"""
Railway Guardian AI — Passenger Welfare Monitor Agent
Detects passenger medical emergencies and distress situations on railway platforms.
"""

from crewai import Agent, Task


def create_distress_agent(llm) -> Agent:
    """Create the Passenger Welfare Monitor agent."""
    return Agent(
        role="Passenger Welfare Monitor",
        goal="Detect passenger medical emergencies and distress situations on railway platforms",
        backstory=(
            "You are a specialist in identifying physical distress signals in CCTV footage. "
            "You understand that a person in a horizontal posture on a platform likely indicates "
            "a medical emergency — collapse, fainting, or injury. Rapid response is critical: "
            "Indian Railways protocol requires immediate medical team notification (1800-111-139) "
            "and area clearance when a passenger is found in an unresponsive state."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False
    )


def create_distress_task(agent: Agent, detections: dict, state: dict) -> Task:
    """Create a distress analysis task with current detection data."""
    distress_state = state.get("distress", {})
    duration = distress_state.get("duration_seconds", 0)
    escalation = distress_state.get("escalation_level", 0)
    fallen_count = len(detections.get("fallen_persons", []))

    return Task(
        description=(
            f"Analyze the following passenger welfare data from a railway platform CCTV feed:\n"
            f"- Fallen/distressed persons detected: {fallen_count}\n"
            f"- Temporal state: duration={duration}s, escalation_level={escalation}\n"
            f"- A person in horizontal posture on a platform indicates potential medical emergency\n\n"
            f"Assess the passenger welfare risk on a scale of 0-10.\n"
            f"Consider: number of fallen persons, duration without assistance, escalation state.\n\n"
            f"Return ONLY a JSON object (no markdown, no explanation):\n"
            f'{{"risk_score": <float 0-10>, "finding": "<one sentence assessment>", "escalation": <true/false>}}'
        ),
        agent=agent,
        expected_output="JSON object with risk_score (float), finding (string), escalation (boolean)"
    )
