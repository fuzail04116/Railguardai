"""
Railway Guardian AI — Crowd Intelligence Specialist Agent
Analyzes crowd density data and assesses overcrowding risk on railway platforms.
"""

from crewai import Agent, Task


def create_crowd_agent(llm) -> Agent:
    """Create the Crowd Intelligence Specialist agent."""
    return Agent(
        role="Crowd Intelligence Specialist",
        goal="Analyze crowd density data and assess overcrowding risk on railway platforms",
        backstory=(
            "You are an expert in crowd dynamics and station safety thresholds for "
            "Indian Railways platforms. You understand that platform overcrowding is one "
            "of the leading causes of accidents at railway stations. You assess risk based "
            "on person count, density patterns, and temporal persistence of crowding."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False
    )


def create_crowd_task(agent: Agent, detections: dict, state: dict) -> Task:
    """Create a crowd analysis task with current detection data."""
    crowd_state = state.get("crowd", {})
    duration = crowd_state.get("duration_seconds", 0)
    escalation = crowd_state.get("escalation_level", 0)

    return Task(
        description=(
            f"Analyze the following crowd data from a railway platform CCTV feed:\n"
            f"- Total persons detected: {detections['crowd_density']}\n"
            f"- Temporal state: duration={duration}s, escalation_level={escalation}\n"
            f"- Indian Railways safety threshold: 15 persons per camera view indicates high density\n\n"
            f"Assess the overcrowding risk on a scale of 0-10.\n"
            f"Consider: person count relative to threshold, duration of crowding, escalation level.\n\n"
            f"Return ONLY a JSON object (no markdown, no explanation):\n"
            f'{{"risk_score": <float 0-10>, "finding": "<one sentence assessment>", "escalation": <true/false>}}'
        ),
        agent=agent,
        expected_output="JSON object with risk_score (float), finding (string), escalation (boolean)"
    )
