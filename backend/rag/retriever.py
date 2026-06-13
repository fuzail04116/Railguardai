"""
Railway Guardian AI — SOP Retriever
Semantic search over the ChromaDB SOP collection.
Returns the most relevant SOP clause for a given incident query.
"""

import chromadb
from sentence_transformers import SentenceTransformer
import logging
from config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL

logger = logging.getLogger(__name__)

# Use the same client and model as the embedder
client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
model = SentenceTransformer(EMBEDDING_MODEL)


def query_sop(query: str, n_results: int = 1) -> dict:
    """
    Query the SOP collection for the most relevant clause.
    
    Args:
        query: Natural language description of the incident
        n_results: Number of results to return (default 1)
    
    Returns:
        dict with keys:
        - clause: SOP clause identifier (e.g. "SOP-SEC-01") or None
        - text: Full SOP text or None
    """
    try:
        collection = client.get_or_create_collection("railway_sops")

        if collection.count() == 0:
            logger.warning("SOP collection is empty — no SOPs indexed")
            return {"clause": None, "text": None}

        embedding = model.encode([query]).tolist()
        results = collection.query(
            query_embeddings=embedding,
            n_results=n_results
        )

        if results["documents"] and results["documents"][0]:
            clause = results["metadatas"][0][0]["clause"]
            text = results["documents"][0][0]
            logger.info(f"SOP retrieved: {clause} for query: '{query[:50]}...'")
            return {"clause": clause, "text": text}

    except Exception as e:
        logger.error(f"SOP query failed: {e}")

    return {"clause": None, "text": None}


def query_sop_multi(query: str, n_results: int = 3) -> list:
    """
    Query for multiple relevant SOP clauses.
    Returns a list of {clause, text, distance} dicts.
    """
    try:
        collection = client.get_or_create_collection("railway_sops")
        embedding = model.encode([query]).tolist()
        results = collection.query(
            query_embeddings=embedding,
            n_results=min(n_results, collection.count())
        )

        sops = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                sops.append({
                    "clause": results["metadatas"][0][i]["clause"],
                    "text": doc,
                    "distance": results["distances"][0][i] if results.get("distances") else None
                })
        return sops

    except Exception as e:
        logger.error(f"Multi-SOP query failed: {e}")
        return []
