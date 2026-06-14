# 🛡️ Railway Guardian AI

**Multi-Agent AI Safety Command Center for Indian Railways**

> **🔴 Live Demo:** [https://frontend-three-theta-69.vercel.app](https://frontend-three-theta-69.vercel.app)
> **⚙️ Backend API:** [https://fuzail4116-railguard-ai.hf.space/docs](https://fuzail4116-railguard-ai.hf.space/docs)

Railway Guardian AI transforms reactive safety monitoring into proactive, SOP-grounded decision support using computer vision, multi-agent LLM reasoning, and temporal state tracking.

---

## 🚀 What Makes This Different

1. **Multi-Agent Reasoning** — Three specialist AI agents (Crowd, Security, Distress) analyze threats simultaneously through CrewAI
2. **Temporal Escalation** — Tracks incident duration over time, automatically escalating persistent threats
3. **SOP-Grounded Decisions** — Retrieves and cites specific Indian Railway Standard Operating Procedure clauses via RAG
4. **Real-Time Dashboard** — Warm, professional UI with tabbed layout (Monitor · History · Analyze · Incident Log)

## 🏗️ Architecture

```
[CCTV Frame] → [YOLOv8 Detection] → [CrewAI Agents] → [Guardian Master Agent]
                                                              ↓
                                                    [RAG: SOP Retrieval]
                                                              ↓
                                                    [Groq LLM Recommendation]
                                                              ↓
                                                    [Supabase (Realtime DB)]
                                                              ↓
                                                    [React Dashboard (Live)]
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Vision | YOLOv8 (ultralytics) + OpenCV |
| Agents | CrewAI (3 specialists + 1 guardian) |
| LLM | Groq API (Llama 3 70B) |
| RAG | ChromaDB + sentence-transformers |
| Backend | FastAPI |
| Database | Supabase (PostgreSQL + Realtime) |
| Frontend | React + Vite + TailwindCSS v4 |
| Deployment | Vercel (frontend) + Hugging Face Spaces (backend) |

## 🌐 Deployment

| Service | URL |
|---------|-----|
| **Frontend** | [https://frontend-three-theta-69.vercel.app](https://frontend-three-theta-69.vercel.app) |
| **Backend API** | [https://fuzail4116-railguard-ai.hf.space](https://fuzail4116-railguard-ai.hf.space) |
| **API Docs** | [https://fuzail4116-railguard-ai.hf.space/docs](https://fuzail4116-railguard-ai.hf.space/docs) |

## 🎨 Dashboard Features

- **Monitor Tab** — Live risk score, agent status, SOP recommendation card with click-to-expand incident report, temporal escalation bar, and live alert feed
- **History Tab** — Full incident history table with time, platform, camera, type, risk level, score, duration, and SOP clause
- **Analyze Tab** — Upload CCTV images/videos or run demo simulations directly from the dashboard
- **Incident Log Tab** — Complete real-time notification feed from Supabase

## 🛠️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Supabase account (free tier)
- Groq API key (free tier)

### 1. Database Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `scripts/setup_supabase.sql`
3. Note your project URL, anon key, and service role key

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Generate Demo Frames
```bash
python scripts/generate_demo_frames.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your Supabase keys

# Start dev server
npm run dev
```

### 5. Open Dashboard
Navigate to `http://localhost:5173`

## 🎮 Demo Guide

1. **Open the dashboard** — observe clean empty state with idle agents
2. **Click "Simulate"** → select a scenario:
   - 🧳 **Unattended Bag** — triggers Security Agent, cites SOP-SEC-01
   - 👥 **Crowd Surge** — triggers Crowd Agent, cites SOP-CROWD-01
   - 🚨 **Fallen Passenger** — triggers Distress Agent, cites SOP-MED-01
3. **Watch the dashboard update in realtime** — risk score animates, agents activate, toast notification pops
4. **Click the SOP card** to expand full incident report with SOP text, agent breakdown, and escalation timeline
5. **Switch to Analyze tab** to upload your own CCTV images or videos for analysis
6. **Trigger multiple incidents** to see compound escalation and SOP-COMPOUND-01

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI server
│   ├── config.py             # Environment configuration
│   ├── supabase_client.py    # Supabase client
│   ├── vision/
│   │   ├── detector.py       # YOLOv8 detection pipeline
│   │   └── frame_utils.py    # Frame encoding utilities
│   ├── agents/
│   │   ├── crowd_agent.py    # Crowd Intelligence Specialist
│   │   ├── security_agent.py # Security Threat Analyst
│   │   ├── distress_agent.py # Passenger Welfare Monitor
│   │   └── guardian_agent.py # Master Guardian Agent
│   ├── rag/
│   │   ├── embedder.py       # ChromaDB SOP indexer
│   │   └── retriever.py      # SOP semantic search
│   └── temporal/
│       └── state_tracker.py  # Incident duration tracker
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main dashboard (tabbed layout)
│   │   ├── index.css          # Warm light theme CSS
│   │   ├── hooks/useAlerts.js # Supabase realtime hook
│   │   └── components/       # UI components
│   └── public/demo/          # Synthetic demo frames
└── scripts/
    ├── setup_supabase.sql    # Database schema
    └── generate_demo_frames.py
```

## 📄 License

MIT — Built for Smart India Hackathon
