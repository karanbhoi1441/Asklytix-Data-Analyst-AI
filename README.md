# AskLytix - AI-Powered Data Analytics Platform

A modern data analysis and visualization workspace powered by **FastAPI**, **React (Vite + TypeScript)**, and **Supabase (PostgreSQL)**.

---

## 📁 Project Architecture & Clean Folder Structure

```
nikhil/
├── README.md                      # Complete Project Documentation & Supabase Guide
├── .env.example                   # Master Environment Variables Reference
├── supabase/                      # Supabase Database Migrations & Schemas
│   └── schema.sql                 # Complete PostgreSQL Schema for Supabase SQL Editor
│
├── backend/                       # FastAPI High-Performance Analytics Backend
│   ├── app/
│   │   ├── api/v1/                # Clean REST API endpoints (Auth, Datasets, Analysis, Visualizations)
│   │   ├── core/                  # Configuration, Security, and Sandboxing
│   │   │   ├── config.py          # Supabase & Application Settings
│   │   │   └── security.py        # JWT & Password Hashing
│   │   ├── db/                    # Supabase Database & Session Setup
│   │   │   ├── models.py          # SQLAlchemy PostgreSQL Data Models
│   │   │   ├── session.py         # Connection Pooling Engine
│   │   │   └── supabase_client.py # Official Supabase Python Client Initializer
│   │   ├── schemas/               # Pydantic Schemas & Validation
│   │   ├── services/              # Analytics Engines (Data Quality, AI Viz, Sandboxing)
│   │   └── main.py                # FastAPI Application Entrypoint
│   ├── tests/                     # Automated Backend & Data-Binding Tests
│   │   ├── test_all.py            # End-to-end Backend API Tests
│   │   └── test_interaction_data_binding.py # Data-binding & Visualizations Validation
│   ├── .env.example               # Backend Environment Template
│   ├── requirements.txt           # Python Dependencies (FastAPI, Supabase, Psycopg2, DuckDB, etc.)
│   └── run.py                     # Development Server Runner
│
└── frontend/                      # React 19 + TypeScript + Vite + TailwindCSS
    ├── src/
    │   ├── components/            # UI Components (Charts, Layout, Common, Modals)
    │   ├── contexts/              # Global React Contexts (AuthContext, SidebarContext)
    │   ├── lib/                   # Supabase Client Initializer (lib/supabase.ts)
    │   ├── pages/                 # Clean Route Pages (Dashboard, Datasets, Visualizations, AskAI, etc.)
    │   ├── services/              # API Client & Services (authService, datasetService, etc.)
    │   ├── router.tsx             # React Router v7 Routes
    │   ├── index.css              # Global Design System
    │   └── main.tsx               # App Root
    ├── package.json               # Frontend Dependencies (@supabase/supabase-js, etc.)
    └── .env.example               # Frontend Environment Template
```

---

## ⚡ Supabase Setup (Local Development & Production)

### Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and create or open your project.
2. In your Supabase Dashboard, go to **Project Settings -> API** to get:
   - **Project URL** (`SUPABASE_URL` / `VITE_SUPABASE_URL`)
   - **Anon / Public Key** (`SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`)
   - **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`)
3. In your Supabase Dashboard, go to **Project Settings -> Database -> Connection string (URI)** to get:
   - **Connection String** (`DATABASE_URL`)

### Step 2: Run the SQL Migration Schema
1. In Supabase Dashboard, navigate to the **SQL Editor**.
2. Open [`supabase/schema.sql`](file:///c:/Users/nikhi/OneDrive/Desktop/Karan/nikhil/supabase/schema.sql).
3. Paste the contents into the SQL Editor and click **Run**.
4. This creates all tables (`users`, `datasets`, `dataset_versions`, `saved_visualizations`), indexes, and Row Level Security (RLS) policies.

---

## 🚀 Environment Variables Setup

### 1. Backend (`backend/.env`)
Create `backend/.env` (or copy from `backend/.env.example`):
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key_here

# PostgreSQL connection string from Supabase
DATABASE_URL=postgresql://postgres.your-project-ref:your-db-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET_KEY=change-this-to-a-random-secret-key
COOKIE_SECURE=false
```

### 2. Frontend (`frontend/.env`)
Create `frontend/.env` (or copy from `frontend/.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
```

---

## 🐳 Running with Docker & Docker Compose

You can launch both the **FastAPI Backend** and **React Frontend** in containerized environments with a single command:

### 1. Configure Environment Variables
Ensure your `.env` (or `backend/.env` and `frontend/.env`) contains your Supabase and OpenAI keys:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
DATABASE_URL=postgresql://postgres.your-ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
OPENAI_API_KEY=your_openai_key
```

### 2. Build and Run Containers
```bash
# Build and start all containers in the background
docker compose up --build -d
```

### 3. Access Application
- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 4. Stop Containers
```bash
docker compose down
```

---

## 🛠️ Running Locally (Without Docker)

### Start Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*Backend runs on: `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/docs`)*

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 🧪 Running Backend Tests
```bash
cd backend
python tests/test_all.py
python tests/test_interaction_data_binding.py
```
