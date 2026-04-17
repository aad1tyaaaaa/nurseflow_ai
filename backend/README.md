# NurseFlow AI — Backend

Unified Intelligent Workflow Assistant for Nurses.

## Features (per PRD)
- **F-01**: Intelligent SBAR Handoff Generator
- **F-02**: Dynamic Medication Priority Queue
- **F-03**: Predictive Fall-Risk Monitor
- **F-04**: Unified Patient Dashboard
- **F-05**: Voice Note Capture & NLP Parsing
- **F-06**: EHR & Vitals Integration Layer (FHIR R4)
- **F-07**: Early Deterioration Alerts (NEWS2/qSOFA)
- **F-08**: Admin Analytics & Safety Dashboard

## Tech Stack
- **Framework**: FastAPI (async)
- **Database**: PostgreSQL with SQLAlchemy 2.0 (async)
- **Auth**: JWT (access + refresh tokens), bcrypt password hashing
- **RBAC**: Role-based access control (nurse, charge_nurse, nursing_director, pharmacist, admin)
- **Migrations**: Alembic

## Quick Start

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Edit with your database credentials
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

## API Endpoints

| Prefix | Description |
|---|---|
| `/api/v1/auth` | Registration, login, JWT refresh, user profile |
| `/api/v1/patients` | Patient CRUD, vitals recording |
| `/api/v1/handoffs` | SBAR generation, handoff CRUD, digital sign-off |
| `/api/v1/medications` | Priority queue, administration logging, interaction checks |
| `/api/v1/fall-risk` | Fall risk assessments, mobility event reporting |
| `/api/v1/alerts` | Clinical alerts, acknowledgment, resolution, escalation |
| `/api/v1/voice-notes` | Voice note upload, transcription, NLP parsing |
| `/api/v1/dashboard` | Unified patient dashboard, shift summary |
| `/api/v1/analytics` | Shift metrics, unit analytics, safety KPIs |

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py          # Auth dependencies (JWT, RBAC)
│   │   └── v1/              # Versioned API endpoints
│   ├── core/
│   │   ├── security.py      # JWT, password hashing
│   │   └── rbac.py          # Role permissions matrix
│   ├── middleware/
│   │   └── audit.py         # HIPAA audit logging
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic layer
│   ├── config.py            # Settings from environment
│   ├── database.py          # Async DB engine & session
│   └── main.py              # FastAPI app entry point
├── alembic/                  # Database migrations
├── requirements.txt
└── .env.example
```
