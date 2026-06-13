"""
Generate synthetic demo frames for Railway Guardian AI.
These frames are used by the "Simulate Incident" button in the dashboard.

Run: python scripts/generate_demo_frames.py
Output: frontend/public/demo/*.jpg
"""

import numpy as np
import os

try:
    import cv2
except ImportError:
    print("OpenCV not installed. Install with: pip install opencv-python-headless")
    exit(1)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "demo")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def draw_person(img, x, y, w=40, h=100, color=(0, 200, 100)):
    """Draw a simplified person bounding box with head circle."""
    cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)
    # Head circle
    cv2.circle(img, (x + w // 2, y - 10), 12, color, 2)
    # Label
    cv2.putText(img, "person", (x, y - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)


def draw_bag(img, x, y, w=35, h=30, color=(0, 100, 255)):
    """Draw a bag/luggage bounding box."""
    cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)
    cv2.putText(img, "bag", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)


def draw_fallen_person(img, x, y, color=(0, 0, 255)):
    """Draw a horizontal person (fallen/collapsed)."""
    cv2.rectangle(img, (x, y), (x + 110, y + 45), color, 2)
    cv2.putText(img, "person (fallen)", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)


def draw_platform_bg(img):
    """Draw a stylized railway platform background."""
    h, w = img.shape[:2]
    
    # Platform floor (gray concrete)
    cv2.rectangle(img, (0, h // 2), (w, h), (80, 80, 85), -1)
    
    # Platform edge line (yellow safety line)
    cv2.line(img, (0, h - 60), (w, h - 60), (0, 200, 255), 3)
    
    # Track area (dark)
    cv2.rectangle(img, (0, h - 55), (w, h), (40, 40, 45), -1)
    
    # Rails
    cv2.line(img, (0, h - 40), (w, h - 40), (150, 150, 155), 2)
    cv2.line(img, (0, h - 20), (w, h - 20), (150, 150, 155), 2)
    
    # Roof structure
    cv2.rectangle(img, (0, 0), (w, 40), (60, 60, 65), -1)
    
    # Pillars
    for px in range(100, w, 200):
        cv2.rectangle(img, (px, 40), (px + 15, h // 2), (70, 70, 75), -1)
    
    # Platform number sign
    cv2.rectangle(img, (w // 2 - 40, 5), (w // 2 + 40, 35), (200, 50, 50), -1)
    cv2.putText(img, "Platform 3", (w // 2 - 35, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    # CCTV overlay
    cv2.putText(img, "CAM_001 | REC", (10, h - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)


def generate_crowd_surge():
    """Scene: Dense crowd, 20+ persons on platform."""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    draw_platform_bg(img)
    
    # Draw many people clustered together
    np.random.seed(42)
    positions = []
    for i in range(24):
        x = np.random.randint(30, 580)
        y = np.random.randint(100, 340)
        w = np.random.randint(30, 50)
        h = np.random.randint(80, 120)
        positions.append((x, y, w, h))
    
    # Sort by y for depth illusion
    positions.sort(key=lambda p: p[1])
    
    for i, (x, y, w, h) in enumerate(positions):
        intensity = min(255, 100 + i * 6)
        draw_person(img, x, y, w, h, color=(0, intensity, 100))
    
    # Crowd density overlay
    cv2.rectangle(img, (5, 45), (200, 85), (0, 0, 0), -1)
    cv2.putText(img, "CROWD DENSITY: HIGH", (10, 63), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 100, 255), 1)
    cv2.putText(img, "Persons: 24 detected", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 200, 200), 1)
    
    # Camera label
    cv2.putText(img, "CAM_001 | CROWD ALERT", (10, img.shape[0] - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
    
    path = os.path.join(OUTPUT_DIR, "crowd_surge.jpg")
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(f"  ✓ Generated: {path}")
    return path


def generate_unattended_bag():
    """Scene: Bag with no nearby person (unattended luggage)."""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    draw_platform_bg(img)
    
    # A few people on one side
    draw_person(img, 50, 150, 40, 100)
    draw_person(img, 120, 170, 35, 90)
    draw_person(img, 500, 180, 42, 95)
    
    # Unattended bag in the middle — far from any person
    bag_x, bag_y = 310, 330
    draw_bag(img, bag_x, bag_y, 50, 35, color=(0, 0, 255))
    
    # Alert box around unattended bag
    cv2.rectangle(img, (bag_x - 15, bag_y - 15), (bag_x + 65, bag_y + 50), (0, 0, 255), 2)
    cv2.putText(img, "UNATTENDED", (bag_x - 15, bag_y - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    
    # Danger radius circle
    cv2.circle(img, (bag_x + 25, bag_y + 17), 80, (0, 0, 200), 1, cv2.LINE_AA)
    cv2.putText(img, "15m radius", (bag_x + 60, bag_y - 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 200), 1)
    
    # Alert overlay
    cv2.rectangle(img, (5, 45), (220, 85), (0, 0, 0), -1)
    cv2.putText(img, "SECURITY ALERT", (10, 63), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
    cv2.putText(img, "Unattended baggage detected", (10, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 200, 200), 1)
    
    cv2.putText(img, "CAM_002 | SECURITY ALERT", (10, img.shape[0] - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
    
    path = os.path.join(OUTPUT_DIR, "unattended_bag.jpg")
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(f"  ✓ Generated: {path}")
    return path


def generate_fallen_passenger():
    """Scene: Person in horizontal posture (collapsed/fallen)."""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    draw_platform_bg(img)
    
    # Normal standing people
    draw_person(img, 80, 160, 38, 95)
    draw_person(img, 450, 180, 40, 100)
    draw_person(img, 530, 200, 36, 88)
    
    # Fallen person
    fallen_x, fallen_y = 250, 310
    draw_fallen_person(img, fallen_x, fallen_y, color=(0, 0, 255))
    
    # Emergency highlight
    cv2.rectangle(img, (fallen_x - 10, fallen_y - 10),
                  (fallen_x + 120, fallen_y + 55), (0, 0, 255), 3)
    
    # Medical alert overlay
    cv2.rectangle(img, (5, 45), (230, 85), (0, 0, 0), -1)
    cv2.putText(img, "MEDICAL EMERGENCY", (10, 63),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
    cv2.putText(img, "Fallen passenger detected", (10, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 200, 200), 1)
    
    # Nearby person reacting
    draw_person(img, 380, 250, 40, 100, color=(0, 200, 255))
    cv2.putText(img, "bystander", (380, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 200, 255), 1)
    
    cv2.putText(img, "CAM_003 | DISTRESS ALERT", (10, img.shape[0] - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
    
    path = os.path.join(OUTPUT_DIR, "fallen_passenger.jpg")
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(f"  ✓ Generated: {path}")
    return path


if __name__ == "__main__":
    print("Generating Railway Guardian AI demo frames...")
    print(f"Output directory: {OUTPUT_DIR}\n")
    
    generate_crowd_surge()
    generate_unattended_bag()
    generate_fallen_passenger()
    
    print(f"\n✅ All demo frames generated in {OUTPUT_DIR}")
    print("These images power the 'Simulate Incident' button in the dashboard.")
