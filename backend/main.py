"""
Railway Guardian AI — FastAPI Server
Main entry point for the backend API.

Endpoints:
  POST /analyze     — Upload a frame for full detection + agent analysis
  POST /simulate    — Run a simulation scenario (no real image needed)
  GET  /health      — Health check
  GET  /alerts      — Retrieve recent alerts from Supabase
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import cv2
import numpy as np
import uuid
import logging
from datetime import datetime, timezone, timedelta

from vision.detector import run_detection
from agents.guardian_agent import run_guardian
from temporal.state_tracker import update_incident_state
from supabase_client import supabase
from vision.frame_utils import encode_frame_to_bytes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("railway_guardian")

# --- FastAPI App ---
app = FastAPI(
    title="Railway Guardian AI",
    description="Multi-Agent AI Safety Command Center for Indian Railways",
    version="1.0.0"
)

# CORS — allow all origins for MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---
class SimulateRequest(BaseModel):
    scenario: str = "security"  # 'crowd' | 'security' | 'distress'
    camera_id: str = "CAM_001"
    intensity: float = 7.0  # 0-10 how severe the simulated scenario is


# --- Endpoints ---

@app.post("/analyze")
async def analyze_frame(
    file: UploadFile = File(...),
    camera_id: str = Query("CAM_001", description="Camera identifier")
):
    """
    Analyze a CCTV frame through the full Guardian AI pipeline:
    1. YOLOv8 object detection
    2. Temporal state tracking
    3. Multi-agent AI analysis (CrewAI)
    4. SOP retrieval (RAG)
    5. Recommendation generation (Groq)
    6. Alert storage (Supabase)
    """
    # Decode uploaded image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    logger.info(f"📸 Frame received from {camera_id} ({frame.shape})")

    # Step 1: Run YOLO detection
    detections = run_detection(frame)
    logger.info(
        f"🔍 Detections: {detections['crowd_density']} persons, "
        f"{len(detections['unattended_bags'])} unattended bags, "
        f"{len(detections['fallen_persons'])} fallen"
    )

    # Step 2: Auto-resolve cleared incidents (FIX 4)
    if supabase:
        active_types = []
        if detections["crowd_density"] > 15: active_types.append("crowd")
        if detections["unattended_bags"]: active_types.append("security")
        if detections["fallen_persons"]: active_types.append("distress")

        for itype in ["crowd", "security", "distress"]:
            if itype not in active_types:
                try:
                    supabase.table("alerts") \
                        .update({"resolved": True}) \
                        .eq("camera_id", camera_id) \
                        .eq("incident_type", itype) \
                        .eq("resolved", False) \
                        .execute()
                except Exception as e:
                    logger.error(f"Resolution update failed for {itype}: {e}")

    # Step 3: Update temporal state
    state = update_incident_state(camera_id, detections)

    # Step 4: Run Guardian Agent pipeline
    result = run_guardian(detections, state, camera_id)
    logger.info(
        f"🛡️ Guardian result: score={result['risk_score']}, "
        f"level={result['risk_level']}, type={result['incident_type']}"
    )

    # Step 5: Upload incident frame to Supabase Storage (for high-risk only)
    frame_url = None
    if result["risk_score"] >= 5.0 and supabase:
        try:
            frame_bytes = encode_frame_to_bytes(frame)
            filename = f"{camera_id}_{uuid.uuid4()}.jpg"
            supabase.storage.from_("incident-frames").upload(
                filename, frame_bytes, {"content-type": "image/jpeg"}
            )
            frame_url = supabase.storage.from_("incident-frames").get_public_url(filename)
            logger.info(f"📤 Frame uploaded: {filename}")
        except Exception as e:
            logger.error(f"Frame upload failed: {e}")

    # Step 6: Write alert to Supabase (FIX 3: deduplicate)
    max_duration = max(
        (v.get("duration_seconds", 0) for v in state.values()),
        default=0
    )
    alert_row = {
        "camera_id": camera_id,
        "risk_score": result["risk_score"],
        "risk_level": result["risk_level"],
        "incident_type": result["incident_type"],
        "agent_outputs": result["agent_outputs"],
        "sop_clause": result.get("sop_clause"),
        "sop_text": result.get("sop_text"),
        "recommendation": result["recommendation"],
        "frame_url": frame_url,
        "duration_seconds": max_duration,
        "resolved": False
    }

    if supabase:
        try:
            cutoff = (datetime.now(timezone.utc) - timedelta(seconds=30)).isoformat()
            recent = supabase.table("alerts") \
                .select("id") \
                .eq("camera_id", camera_id) \
                .eq("incident_type", result["incident_type"]) \
                .eq("resolved", False) \
                .gte("created_at", cutoff) \
                .execute().data

            if recent:
                supabase.table("alerts").update({
                    "duration_seconds": alert_row["duration_seconds"],
                    "risk_score": alert_row["risk_score"],
                    "risk_level": alert_row["risk_level"],
                    "recommendation": alert_row["recommendation"]
                }).eq("id", recent[0]["id"]).execute()
                logger.info(f"💾 Alert updated (dedup): {recent[0]['id']}")
            else:
                supabase.table("alerts").insert(alert_row).execute()
                logger.info("💾 Alert written to Supabase")
        except Exception as e:
            logger.error(f"Supabase alert write failed: {e}")

    return {"status": "processed", "alert": alert_row}


@app.post("/simulate")
async def simulate_incident(request: SimulateRequest):
    """
    Simulate an incident without a real image.
    Generates synthetic detection data and runs through the full agent pipeline.
    Useful for demos and testing.
    """
    logger.info(f"⚡ Simulating {request.scenario} scenario on {request.camera_id}")

    # Generate synthetic detections based on scenario
    detections = _generate_synthetic_detections(request.scenario, request.intensity)

    # Run through the same pipeline
    state = update_incident_state(request.camera_id, detections)
    result = run_guardian(detections, state, request.camera_id)

    max_duration = max(
        (v.get("duration_seconds", 0) for v in state.values()),
        default=0
    )
    alert_row = {
        "camera_id": request.camera_id,
        "risk_score": result["risk_score"],
        "risk_level": result["risk_level"],
        "incident_type": result["incident_type"],
        "agent_outputs": result["agent_outputs"],
        "sop_clause": result.get("sop_clause"),
        "sop_text": result.get("sop_text"),
        "recommendation": result["recommendation"],
        "frame_url": None,
        "duration_seconds": max_duration,
        "resolved": False
    }

    if supabase:
        try:
            cutoff = (datetime.now(timezone.utc) - timedelta(seconds=30)).isoformat()
            recent = supabase.table("alerts") \
                .select("id") \
                .eq("camera_id", request.camera_id) \
                .eq("incident_type", result["incident_type"]) \
                .eq("resolved", False) \
                .gte("created_at", cutoff) \
                .execute().data

            if recent:
                supabase.table("alerts").update({
                    "duration_seconds": alert_row["duration_seconds"],
                    "risk_score": alert_row["risk_score"],
                    "risk_level": alert_row["risk_level"],
                    "recommendation": alert_row["recommendation"]
                }).eq("id", recent[0]["id"]).execute()
            else:
                supabase.table("alerts").insert(alert_row).execute()
        except Exception as e:
            logger.error(f"Supabase alert write failed: {e}")

    return {"status": "simulated", "alert": alert_row}


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Railway Guardian AI",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "supabase_connected": supabase is not None
    }


@app.get("/alerts")
async def get_alerts(limit: int = Query(20, ge=1, le=100)):
    """Retrieve recent alerts from Supabase."""
    if not supabase:
        return {"alerts": [], "error": "Supabase not connected"}

    try:
        result = (
            supabase.table("alerts")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"alerts": result.data}
    except Exception as e:
        logger.error(f"Failed to fetch alerts: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")


# --- Helpers ---

def _generate_synthetic_detections(scenario: str, intensity: float) -> dict:
    """
    Generate realistic synthetic detection data for simulation.
    """
    import random
    random.seed()

    base = {
        "persons": [],
        "bags": [],
        "crowd_density": 0,
        "unattended_bags": [],
        "fallen_persons": [],
        "raw_count": 0
    }

    if scenario == "crowd":
        # Dense crowd simulation
        count = int(15 + intensity * 2)
        persons = []
        for i in range(count):
            x = random.randint(50, 550)
            y = random.randint(100, 350)
            persons.append({
                "bbox": [x, y, x + 40, y + 100],
                "conf": round(random.uniform(0.7, 0.95), 2)
            })
        base["persons"] = persons
        base["crowd_density"] = count
        base["raw_count"] = count

    elif scenario == "security":
        # Unattended bag simulation
        persons = [
            {"bbox": [50, 150, 90, 250], "conf": 0.88},
            {"bbox": [500, 180, 540, 280], "conf": 0.91}
        ]
        bag_count = max(1, int(intensity / 3))
        bags = []
        unattended = []
        for i in range(bag_count):
            bag = {
                "bbox": [280 + i * 60, 320, 320 + i * 60, 355],
                "conf": round(random.uniform(0.75, 0.92), 2),
                "type": random.choice(["backpack", "suitcase"])
            }
            bags.append(bag)
            unattended.append(bag)

        base["persons"] = persons
        base["bags"] = bags
        base["unattended_bags"] = unattended
        base["crowd_density"] = len(persons)
        base["raw_count"] = len(persons) + len(bags)

    elif scenario == "distress":
        # Fallen passenger simulation
        persons = [
            {"bbox": [80, 160, 120, 260], "conf": 0.85},
            {"bbox": [450, 180, 490, 280], "conf": 0.90}
        ]
        # Fallen person has width > height * 1.3
        fallen = [{
            "bbox": [250, 310, 370, 350],
            "conf": 0.78
        }]
        base["persons"] = persons + fallen
        base["fallen_persons"] = fallen
        base["crowd_density"] = len(persons) + len(fallen)
        base["raw_count"] = len(persons) + len(fallen)

    return base


# --- Startup Event ---
@app.on_event("startup")
async def startup():
    logger.info("🚀 Railway Guardian AI starting up...")
    logger.info(f"   Supabase: {'connected' if supabase else 'NOT connected'}")
    logger.info("   Endpoints: /analyze, /simulate, /health, /alerts")
    logger.info("🛡️  Railway Guardian AI is ready.")
