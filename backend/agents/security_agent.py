"""
Railway Guardian AI — Security Threat Analyst Agent
Identifies unattended baggage and suspicious object risks on railway platforms.
"""

from crewai import Agent, Task


def create_security_agent(llm) -> Agent:
    """Create the Security Threat Analyst agent."""
    return Agent(
        role="Security Threat Analyst",
        goal="Identify unattended baggage and suspicious object risks on railway platforms",
        backstory=(
            "You are trained in railway security protocols and threat assessment per RPF "
            "(Railway Protection Force) guidelines. You understand Railway Security Circular 47B "
            "and the critical importance of identifying unattended baggage promptly. "
            "Any bag without an owner within 15 metres for more than 2 minutes is a potential "
            "security threat that requires immediate escalation."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False
    )


def create_security_task(agent: Agent, detections: dict, state: dict) -> Task:
    """Create a security analysis task with current detection data."""
    security_state = state.get("security", {})
    duration = security_state.get("duration_seconds", 0)
    escalation = security_state.get("escalation_level", 0)
    unattended_count = len(detections.get("unattended_bags", []))
    bag_details = detections.get("unattended_bags", [])

    return Task(
        description=(
            f"Analyze the following security data from a railway platform CCTV feed:\n"
            f"- Unattended bags detected: {unattended_count}\n"
            f"- Bag details: {bag_details}\n"
            f"- Temporal state: duration={duration}s, escalation_level={escalation}\n"
            f"- Per RPF protocol: unattended baggage > 2 minutes = potential threat\n\n"
            f"Assess the security threat on a scale of 0-10.\n"
            f"Consider: number of unattended bags, duration of abandonment, proximity to crowds.\n\n"
            f"Return ONLY a JSON object (no markdown, no explanation):\n"
            f'{{"risk_score": <float 0-10>, "finding": "<one sentence assessment>", "escalation": <true/false>}}'
        ),
        agent=agent,
        expected_output="JSON object with risk_score (float), finding (string), escalation (boolean)"
    )
