"""
Railway Guardian AI — Guardian Master Agent
The central orchestrator that:
1. Runs all three specialist agents (Crowd, Security, Distress) via CrewAI
2. Computes weighted composite risk score
3. Applies temporal escalation multipliers
4. Retrieves relevant SOP clauses via RAG
5. Generates human-readable recommendations via Groq LLM

This is the brain of the system.
"""

from crewai import Crew, LLM
from agents.crowd_agent import create_crowd_agent, create_crowd_task
from agents.security_agent import create_security_agent, create_security_task
from agents.distress_agent import create_distress_agent, create_distress_task
from rag.retriever import query_sop
from config import (
    GROQ_API_KEY, GROQ_MODEL, RISK_THRESHOLD_RAG,
    WEIGHT_CROWD, WEIGHT_SECURITY, WEIGHT_DISTRESS, WEIGHT_TOTAL
)
import json
import logging

logger = logging.getLogger(__name__)

# Lazy LLM initialization — avoids import-time crash if litellm not yet installed
_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        try:
            _llm = LLM(model=f"groq/{GROQ_MODEL}", api_key=GROQ_API_KEY)
            logger.info("CrewAI LLM initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize CrewAI LLM: {e}")
            _llm = None
    return _llm


def run_guardian(detections: dict, state: dict, camera_id: str) -> dict:
    """
    Run the full Guardian Agent pipeline.
    
    Args:
        detections: Output from vision/detector.py run_detection()
        state: Output from temporal/state_tracker.py update_incident_state()
        camera_id: Camera identifier
    
    Returns:
        dict with keys:
        - risk_score: float (0-10)
        - risk_level: str ('low'|'medium'|'high'|'critical')
        - incident_type: str (dominant incident type)
        - agent_outputs: dict with crowd/security/distress analysis
        - sop_clause: str or None
        - sop_text: str or None
        - recommendation: str (human-readable action recommendation)
    """

    # --- Step 1: Run specialist agents via CrewAI ---
    crowd_r, security_r, distress_r = _run_specialist_agents(detections, state)

    # --- Step 2: Compute weighted composite risk score ---
    composite = (
        crowd_r["risk_score"] * WEIGHT_CROWD +
        security_r["risk_score"] * WEIGHT_SECURITY +
        distress_r["risk_score"] * WEIGHT_DISTRESS
    ) / WEIGHT_TOTAL

    # --- Step 3: Apply temporal escalation ---
    max_escalation = max(
        state.get("crowd", {}).get("escalation_level", 0),
        state.get("security", {}).get("escalation_level", 0),
        state.get("distress", {}).get("escalation_level", 0),
    )

    if max_escalation == 2:
        composite = min(composite * 1.4, 10.0)
    elif max_escalation == 1:
        composite = min(composite * 1.15, 10.0)

    composite = round(composite, 2)

    # --- Step 4: Determine dominant incident type ---
    scores = {
        "crowd": crowd_r["risk_score"],
        "security": security_r["risk_score"],
        "distress": distress_r["risk_score"]
    }

    # If multiple types are active, label as 'compound'
    active_types = [k for k, v in scores.items() if v > 2.0]
    if len(active_types) > 1:
        dominant = "compound"
    else:
        dominant = max(scores, key=scores.get)

    # --- FIX 1: Override composite for high single-agent scores ---
    max_single_score = max(crowd_r["risk_score"], security_r["risk_score"], distress_r["risk_score"])
    if max_single_score >= 8.0 and max_escalation == 2:
        composite = max(composite, 6.0)

    # --- Step 5: Determine risk level ---
    if composite >= 8.0:
        risk_level = "critical"
    elif composite >= 6.0:
        risk_level = "high"
    elif composite >= 4.0:
        risk_level = "medium"
    else:
        risk_level = "low"

    # --- Step 6: RAG — retrieve relevant SOP clause ---
    sop_clause, sop_text = None, None
    # --- FIX 2: SOP triggers on high per-agent scores regardless of composite ---
    dominant_score = max(crowd_r["risk_score"], security_r["risk_score"], distress_r["risk_score"])
    if composite >= RISK_THRESHOLD_RAG or dominant_score >= 6.0:
        sop_query = f"{dominant} incident on railway platform"
        if dominant == "compound":
            sop_query = "multiple simultaneous incidents on railway platform"
        sop_result = query_sop(sop_query)
        sop_clause = sop_result.get("clause")
        sop_text = sop_result.get("text")

    # --- Step 7: Generate recommendation via Groq LLM ---
    recommendation = _generate_recommendation(
        camera_id=camera_id,
        composite=composite,
        risk_level=risk_level,
        crowd_r=crowd_r,
        security_r=security_r,
        distress_r=distress_r,
        max_escalation=max_escalation,
        sop_clause=sop_clause,
        sop_text=sop_text
    )

    return {
        "risk_score": composite,
        "risk_level": risk_level,
        "incident_type": dominant,
        "agent_outputs": {
            "crowd": crowd_r,
            "security": security_r,
            "distress": distress_r
        },
        "sop_clause": sop_clause,
        "sop_text": sop_text,
        "recommendation": recommendation
    }


def _run_specialist_agents(detections: dict, state: dict) -> tuple:
    """
    Execute all three specialist agents via CrewAI Crew.
    Returns parsed results for crowd, security, and distress agents.
    """
    try:
        # Get LLM instance (lazy init)
        llm = _get_llm()
        if llm is None:
            logger.warning("LLM not available — using heuristic fallback")
            return _fallback_analysis(detections, state)

        # Create agents
        crowd_agent = create_crowd_agent(llm)
        security_agent = create_security_agent(llm)
        distress_agent = create_distress_agent(llm)

        # Create tasks
        crowd_task = create_crowd_task(crowd_agent, detections, state)
        security_task = create_security_task(security_agent, detections, state)
        distress_task = create_distress_task(distress_agent, detections, state)

        # Run crew
        crew = Crew(
            agents=[crowd_agent, security_agent, distress_agent],
            tasks=[crowd_task, security_task, distress_task],
            verbose=False
        )

        result = crew.kickoff()

        # Parse outputs — CrewAI returns TaskOutput objects via tasks_output
        task_outputs = result.tasks_output
        crowd_r = _safe_parse(task_outputs[0].raw if len(task_outputs) > 0 else "")
        security_r = _safe_parse(task_outputs[1].raw if len(task_outputs) > 1 else "")
        distress_r = _safe_parse(task_outputs[2].raw if len(task_outputs) > 2 else "")

        logger.info(
            f"Agents completed — Crowd: {crowd_r['risk_score']}, "
            f"Security: {security_r['risk_score']}, "
            f"Distress: {distress_r['risk_score']}"
        )

        return crowd_r, security_r, distress_r

    except Exception as e:
        logger.error(f"CrewAI execution failed: {e}")
        logger.info("Falling back to heuristic-based agent analysis")
        return _fallback_analysis(detections, state)


def _fallback_analysis(detections: dict, state: dict) -> tuple:
    """
    Heuristic-based fallback when CrewAI/Groq agents fail.
    Ensures the system always produces a result.
    """
    # Crowd heuristic
    density = detections.get("crowd_density", 0)
    crowd_score = min(density / 3.0, 10.0)
    crowd_escalation = state.get("crowd", {}).get("escalation_level", 0) > 0
    crowd_r = {
        "risk_score": round(crowd_score, 1),
        "finding": f"{density} persons detected on platform — {'high' if density > 15 else 'normal'} density",
        "escalation": crowd_escalation
    }

    # Security heuristic
    unattended = len(detections.get("unattended_bags", []))
    security_score = min(unattended * 5.0, 10.0)
    security_escalation = state.get("security", {}).get("escalation_level", 0) > 0
    security_r = {
        "risk_score": round(security_score, 1),
        "finding": f"{unattended} unattended bag(s) detected — {'threat' if unattended > 0 else 'clear'}",
        "escalation": security_escalation
    }

    # Distress heuristic
    fallen = len(detections.get("fallen_persons", []))
    distress_score = min(fallen * 7.0, 10.0)
    distress_escalation = state.get("distress", {}).get("escalation_level", 0) > 0
    distress_r = {
        "risk_score": round(distress_score, 1),
        "finding": f"{fallen} person(s) in distress posture — {'emergency' if fallen > 0 else 'clear'}",
        "escalation": distress_escalation
    }

    return crowd_r, security_r, distress_r


def _generate_recommendation(
    camera_id: str,
    composite: float,
    risk_level: str,
    crowd_r: dict,
    security_r: dict,
    distress_r: dict,
    max_escalation: int,
    sop_clause: str,
    sop_text: str
) -> str:
    """Generate a human-readable recommendation using Groq LLM."""
    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)
        prompt = (
            f"You are the Railway Guardian AI master agent for Indian Railways.\n"
            f"Camera: {camera_id}\n"
            f"Risk Score: {composite:.1f}/10 ({risk_level})\n"
            f"Crowd finding: {crowd_r['finding']}\n"
            f"Security finding: {security_r['finding']}\n"
            f"Distress finding: {distress_r['finding']}\n"
            f"Incident duration escalation level: {max_escalation}/2\n"
            f"Relevant SOP: {sop_text or 'No specific SOP retrieved'}\n"
            f"SOP Clause: {sop_clause or 'N/A'}\n\n"
            f"Do NOT list raw detection counts. Write as a senior safety officer giving a direct, urgent action "
            f"instruction to station control room staff. Cite the SOP clause if available. 2-3 sentences maximum."
        )

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3
        )
        recommendation = response.choices[0].message.content.strip()
        # --- FIX 5: Remove [AUTO] prefix if present ---
        recommendation = recommendation.replace("[AUTO]", "").strip()
        return recommendation

    except Exception as e:
        logger.error(f"Groq recommendation failed: {e}")
        # Fallback recommendation (no [AUTO] prefix)
        rec = f"Risk level {risk_level.upper()} detected on {camera_id}. "
        if sop_clause:
            rec += f"Refer to {sop_clause}. "
        rec += f"Crowd: {crowd_r['finding']}. Security: {security_r['finding']}. "
        rec += f"Distress: {distress_r['finding']}."
        return rec


def _safe_parse(raw: str) -> dict:
    """
    Safely parse JSON from LLM output.
    Handles markdown code blocks, extra text, and malformed JSON.
    """
    default = {"risk_score": 0.0, "finding": "No analysis available", "escalation": False}

    if not raw:
        return default

    try:
        text = str(raw).strip()

        # Remove markdown code blocks if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        # Find JSON object boundaries
        start = text.find("{")
        end = text.rfind("}") + 1

        if start == -1 or end == 0:
            return default

        json_str = text[start:end]
        parsed = json.loads(json_str)

        # Validate and normalize
        return {
            "risk_score": float(parsed.get("risk_score", 0.0)),
            "finding": str(parsed.get("finding", "Analysis completed")),
            "escalation": bool(parsed.get("escalation", False))
        }

    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.warning(f"JSON parse failed: {e} | Raw: {raw[:100]}")
        return default
