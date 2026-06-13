"""
Railway Guardian AI — Temporal State Tracker
Tracks incident duration across frames and applies escalation logic.

Escalation levels:
  0 = New incident (< 30 seconds)
  1 = Persistent incident (30–120 seconds)
  2 = Critical — prolonged incident (> 120 seconds)
"""

from supabase_client import supabase
from datetime import datetime, timezone
import logging
from config import (
    TEMPORAL_ESCALATION_SECS,
    TEMPORAL_PERSISTENT_SECS,
    CROWD_DENSITY_THRESHOLD
)

logger = logging.getLogger(__name__)


def update_incident_state(camera_id: str, detections: dict) -> dict:
    """
    Update temporal state for detected incidents on a given camera.
    
    Checks which incident types are active based on detections,
    creates/updates incident_state rows in Supabase, and returns
    a summary with duration and escalation level per type.
    
    Args:
        camera_id: Camera identifier (e.g. "CAM_001")
        detections: Output from vision/detector.py run_detection()
    
    Returns:
        dict mapping incident_type → {duration_seconds, escalation_level}
        e.g. {"crowd": {"duration_seconds": 45, "escalation_level": 1}}
    """
    # Determine which incident types are currently active
    incident_types = []
    if detections.get("crowd_density", 0) > CROWD_DENSITY_THRESHOLD:
        incident_types.append("crowd")
    if detections.get("unattended_bags"):
        incident_types.append("security")
    if detections.get("fallen_persons"):
        incident_types.append("distress")

    if not incident_types:
        return {}

    if supabase is None:
        # Fallback: return mock state if Supabase not connected
        logger.warning("Supabase not available — returning mock temporal state")
        return {t: {"duration_seconds": 0, "escalation_level": 0} for t in incident_types}

    state_summary = {}
    now = datetime.now(timezone.utc)

    for itype in incident_types:
        try:
            # Check for existing active incident of this type on this camera
            existing = (
                supabase.table("incident_state")
                .select("*")
                .eq("camera_id", camera_id)
                .eq("incident_type", itype)
                .eq("active", True)
                .execute()
                .data
            )

            if existing:
                row = existing[0]
                first_detected = datetime.fromisoformat(
                    row["first_detected_at"].replace("Z", "+00:00")
                )
                duration = int((now - first_detected).total_seconds())

                # Determine escalation level
                if duration > TEMPORAL_ESCALATION_SECS:
                    escalation = 2  # Critical
                elif duration > TEMPORAL_PERSISTENT_SECS:
                    escalation = 1  # Persistent
                else:
                    escalation = 0  # New

                # Update the existing record
                supabase.table("incident_state").update({
                    "last_seen_at": now.isoformat(),
                    "duration_seconds": duration,
                    "escalation_level": escalation
                }).eq("id", row["id"]).execute()

                state_summary[itype] = {
                    "duration_seconds": duration,
                    "escalation_level": escalation
                }
                logger.info(
                    f"Updated {itype} on {camera_id}: {duration}s, escalation={escalation}"
                )

            else:
                # Create a new incident state entry
                supabase.table("incident_state").insert({
                    "camera_id": camera_id,
                    "incident_type": itype,
                    "first_detected_at": now.isoformat(),
                    "last_seen_at": now.isoformat(),
                    "duration_seconds": 0,
                    "escalation_level": 0,
                    "active": True
                }).execute()

                state_summary[itype] = {
                    "duration_seconds": 0,
                    "escalation_level": 0
                }
                logger.info(f"New incident created: {itype} on {camera_id}")

        except Exception as e:
            logger.error(f"State tracker error for {itype} on {camera_id}: {e}")
            state_summary[itype] = {"duration_seconds": 0, "escalation_level": 0}

    return state_summary


def resolve_incidents(camera_id: str, incident_types: list = None):
    """
    Mark incidents as resolved (inactive) for a given camera.
    Used when detections clear and no threats are present.
    """
    if supabase is None:
        return

    try:
        query = (
            supabase.table("incident_state")
            .update({"active": False})
            .eq("camera_id", camera_id)
            .eq("active", True)
        )

        if incident_types:
            for itype in incident_types:
                query.eq("incident_type", itype)

        query.execute()
        logger.info(f"Resolved incidents on {camera_id}: {incident_types or 'all'}")

    except Exception as e:
        logger.error(f"Failed to resolve incidents: {e}")
