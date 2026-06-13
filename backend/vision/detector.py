"""
Railway Guardian AI — YOLOv8 Detection Pipeline
Runs object detection on frames and extracts safety-relevant features:
- Person count (crowd density)
- Unattended bags (bag with no nearby person)
- Fallen persons (horizontal aspect ratio heuristic)
"""

from ultralytics import YOLO
import cv2
import numpy as np
import logging
from config import YOLO_MODEL

logger = logging.getLogger(__name__)

# Load model at module level (singleton)
try:
    model = YOLO(YOLO_MODEL)
    logger.info(f"YOLOv8 model loaded: {YOLO_MODEL}")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {e}")
    model = None


def run_detection(frame: np.ndarray) -> dict:
    """
    Run YOLOv8 inference on a single frame.
    
    Returns:
        dict with keys:
        - persons: list of {bbox, conf}
        - bags: list of {bbox, conf, type}
        - crowd_density: int (person count)
        - unattended_bags: list of bags with no nearby person
        - fallen_persons: list of persons with horizontal posture
        - raw_count: total detections
    """
    if model is None:
        logger.warning("YOLO model not loaded — returning empty detections")
        return _empty_detections()

    try:
        results = model(frame, verbose=False)[0]
    except Exception as e:
        logger.error(f"YOLO inference failed: {e}")
        return _empty_detections()

    persons = []
    bags = []

    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        label = model.names[cls_id]
        bbox = box.xyxy[0].tolist()

        if label == "person":
            persons.append({"bbox": bbox, "conf": conf})
        elif label in ["backpack", "handbag", "suitcase"]:
            bags.append({"bbox": bbox, "conf": conf, "type": label})

    unattended = _find_unattended_bags(persons, bags)
    fallen = _detect_fallen(persons)

    return {
        "persons": persons,
        "bags": bags,
        "crowd_density": len(persons),
        "unattended_bags": unattended,
        "fallen_persons": fallen,
        "raw_count": len(results.boxes)
    }


def _find_unattended_bags(persons: list, bags: list) -> list:
    """
    Identify bags that have no person within a proximity threshold.
    A bag is 'unattended' if no person center is within 120px of the bag center.
    """
    PROXIMITY_THRESHOLD = 120
    unattended = []

    for bag in bags:
        bx = (bag["bbox"][0] + bag["bbox"][2]) / 2
        by = (bag["bbox"][1] + bag["bbox"][3]) / 2

        near_person = any(
            abs((p["bbox"][0] + p["bbox"][2]) / 2 - bx) < PROXIMITY_THRESHOLD and
            abs((p["bbox"][1] + p["bbox"][3]) / 2 - by) < PROXIMITY_THRESHOLD
            for p in persons
        )

        if not near_person:
            unattended.append(bag)

    return unattended


def _detect_fallen(persons: list) -> list:
    """
    Detect fallen/collapsed persons using aspect ratio heuristic.
    A person whose bounding box is wider than tall (w > h * 1.3) is likely fallen.
    """
    fallen = []
    for p in persons:
        x1, y1, x2, y2 = p["bbox"]
        w = x2 - x1
        h = y2 - y1
        if h > 0 and w > h * 1.3:
            fallen.append(p)
    return fallen


def _empty_detections() -> dict:
    """Return an empty detection result."""
    return {
        "persons": [],
        "bags": [],
        "crowd_density": 0,
        "unattended_bags": [],
        "fallen_persons": [],
        "raw_count": 0
    }
