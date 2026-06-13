#!/usr/bin/env bash
# Render build script for Railway Guardian AI backend
set -o errexit

echo "=== Installing Python dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Pre-downloading YOLOv8 model ==="
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

echo "=== Pre-loading SentenceTransformer embedding model ==="
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

echo "=== Initializing RAG vector store ==="
python -c "from rag.embedder import build_sop_vectorstore; build_sop_vectorstore()"

echo "=== Build complete ==="
