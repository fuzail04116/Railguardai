"""
Railway Guardian AI — Configuration
Loads environment variables and defines system constants.
"""

from dotenv import load_dotenv
import os

load_dotenv()

# --- API Keys ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# --- Model Configuration ---
YOLO_MODEL = "yolov8n.pt"
GROQ_MODEL = "llama3-70b-8192"

# --- RAG Configuration ---
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# --- Thresholds ---
RISK_THRESHOLD_RAG = 4.0          # Minimum composite score to trigger SOP retrieval
CROWD_DENSITY_THRESHOLD = 15      # Person count to trigger crowd incident
TEMPORAL_ESCALATION_SECS = 120    # Seconds before critical escalation (level 2)
TEMPORAL_PERSISTENT_SECS = 30     # Seconds before persistent escalation (level 1)

# --- Weighted Risk Scoring ---
WEIGHT_CROWD = 1.0
WEIGHT_SECURITY = 2.0
WEIGHT_DISTRESS = 1.5
WEIGHT_TOTAL = WEIGHT_CROWD + WEIGHT_SECURITY + WEIGHT_DISTRESS

# --- Validation ---
if not GROQ_API_KEY:
    print("⚠️  WARNING: GROQ_API_KEY not set. Agent reasoning will fail.")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️  WARNING: Supabase credentials not set. Database operations will fail.")
