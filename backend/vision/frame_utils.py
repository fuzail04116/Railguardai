"""
Railway Guardian AI — Frame Utilities
Helper functions for image encoding, decoding, and annotation.
"""

import cv2
import numpy as np
from typing import Optional


def encode_frame_to_bytes(frame: np.ndarray, quality: int = 85) -> bytes:
    """Encode a frame (numpy array) to JPEG bytes."""
    success, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not success:
        raise ValueError("Failed to encode frame to JPEG")
    return buf.tobytes()


def decode_bytes_to_frame(data: bytes) -> Optional[np.ndarray]:
    """Decode raw bytes to a frame (numpy array)."""
    nparr = np.frombuffer(data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return frame


def annotate_frame(frame: np.ndarray, detections: dict) -> np.ndarray:
    """Draw bounding boxes and labels on a frame for visualization."""
    annotated = frame.copy()

    # Draw persons
    for p in detections.get("persons", []):
        x1, y1, x2, y2 = [int(v) for v in p["bbox"]]
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(annotated, f'person {p["conf"]:.2f}',
                    (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

    # Draw bags
    for b in detections.get("bags", []):
        x1, y1, x2, y2 = [int(v) for v in b["bbox"]]
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 165, 0), 2)
        cv2.putText(annotated, f'{b["type"]} {b["conf"]:.2f}',
                    (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 165, 0), 1)

    # Highlight unattended bags in red
    for u in detections.get("unattended_bags", []):
        x1, y1, x2, y2 = [int(v) for v in u["bbox"]]
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(annotated, "UNATTENDED",
                    (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

    # Highlight fallen persons
    for f in detections.get("fallen_persons", []):
        x1, y1, x2, y2 = [int(v) for v in f["bbox"]]
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(annotated, "FALLEN",
                    (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

    # Crowd density counter
    count = detections.get("crowd_density", 0)
    cv2.putText(annotated, f"Persons: {count}",
                (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    return annotated
