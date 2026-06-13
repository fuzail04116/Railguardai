"""
Railway Guardian AI — SOP Embedder
Seeds ChromaDB with Indian Railway Standard Operating Procedure documents.
Automatically builds the index on first import.
"""

import chromadb
from sentence_transformers import SentenceTransformer
import logging
from config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL

logger = logging.getLogger(__name__)

# Initialize ChromaDB persistent client
client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)

# Initialize embedding model
model = SentenceTransformer(EMBEDDING_MODEL)

# --- Seed SOP Documents ---
# These are based on Indian Railways safety protocols and RPF guidelines.
SEED_SOPS = [
    {
        "clause": "SOP-CROWD-01",
        "text": (
            "When platform density exceeds 4 persons per square metre, station master "
            "must activate crowd control protocol: close additional entry gates, deploy "
            "RPF personnel, announce platform change if possible."
        )
    },
    {
        "clause": "SOP-CROWD-02",
        "text": (
            "Sustained overcrowding exceeding 5 minutes triggers mandatory escalation "
            "to divisional control. Train departure may be held pending platform clearance."
        )
    },
    {
        "clause": "SOP-SEC-01",
        "text": (
            "Any unattended baggage observed for more than 2 minutes must be treated as "
            "a potential threat. RPF must cordon 15-metre radius and notify Bomb Detection "
            "Squad per Railway Security Circular 47B."
        )
    },
    {
        "clause": "SOP-SEC-02",
        "text": (
            "Station CCTV operator must tag unattended baggage timestamp and relay camera "
            "feed to RPF control room immediately. Do not touch or move the object."
        )
    },
    {
        "clause": "SOP-MED-01",
        "text": (
            "Passenger found in collapsed or unresponsive state: immediately call station "
            "medical team (1800-111-139), clear area, initiate first aid if trained personnel "
            "are on site. Alert train crew if incident is near boarding zone."
        )
    },
    {
        "clause": "SOP-MED-02",
        "text": (
            "Medical emergencies on platform must be logged with timestamp, platform number, "
            "and train number (if applicable) in the Station Incident Register within 10 "
            "minutes of occurrence."
        )
    },
    {
        "clause": "SOP-COMPOUND-01",
        "text": (
            "When multiple simultaneous incidents occur (crowd + security or crowd + medical), "
            "declare Platform Emergency Status. Contact Divisional Security Control, suspend "
            "normal boarding, activate PA system."
        )
    },
]


def build_index():
    """
    Build or verify the ChromaDB SOP index.
    Idempotent — skips if the collection already has entries.
    """
    collection = client.get_or_create_collection("railway_sops")

    if collection.count() >= len(SEED_SOPS):
        logger.info(f"SOP index already built ({collection.count()} entries). Skipping.")
        return

    # Clear and rebuild if partial
    if collection.count() > 0:
        # Delete existing to rebuild cleanly
        existing_ids = collection.get()["ids"]
        if existing_ids:
            collection.delete(ids=existing_ids)

    texts = [s["text"] for s in SEED_SOPS]
    embeddings = model.encode(texts).tolist()

    collection.add(
        ids=[s["clause"] for s in SEED_SOPS],
        embeddings=embeddings,
        documents=texts,
        metadatas=[{"clause": s["clause"]} for s in SEED_SOPS]
    )

    logger.info(f"✅ Indexed {len(SEED_SOPS)} SOP entries into ChromaDB")


# Auto-build on import
try:
    build_index()
except Exception as e:
    logger.error(f"Failed to build SOP index: {e}")
