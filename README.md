# Atperf — StrAP Tools & Internal Staff Portal

**StrAP Tools** is Atperf's unified web platform combining AI-powered strategic diagnostics, data analysis, and operational tooling — all behind a secure role-based authentication system for both external clients and internal staff.

> Built with **FastAPI** · **React + Vite** · **PostgreSQL**

---

## ✨ Features

### 🎯 Decision Radar
An executive decision-support tool that maps strategic topics across four dimensions: **Impact**, **Frequency**, **Cross-Functionality**, and **Anticipation**. The tool renders an interactive radar chart and uses AI to produce a personalized, action-oriented strategic diagnostic. Results can be exported to PDF or shared via email.

### 🤖 StrAPilot
An AI-powered data analysis tool. Users upload a dataset and StrAPilot automatically cleans the data, identifies key KPIs, generates up to five insight charts, and produces a structured diagnostic report with open questions and strategic recommendations. Full session history is accessible from the dashboard.

### 📋 ProExtract *(SubmitForm)*
A structured problem-capture tool that converts free-text operational issues into formatted tickets. It extracts root causes, involved tools, priority level, and generates a resolution plan alongside an industry benchmark gap analysis — all powered by AI.

### 🏢 Internal Staff Portal (ProStaff)
A dedicated login and registration flow for internal Atperf staff, separate from external users. Staff members get access to an **Admin Panel** for user management and an **Admin Use Cases** interface for curating content.

### 🔐 Role-Based Access & OTP Verification
A secure registration and authentication flow that separates **ProStaff** (internal) from **Users** (external clients). New accounts are verified via Email OTP and placed in an admin approval queue before gaining access.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python, FastAPI, SQLAlchemy, PostgreSQL, AsyncOpenAI, Passlib (bcrypt), Pydantic |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts, jsPDF, html2canvas, Lucide React |
| **Infrastructure** | Docker Compose, Render (cloud DB) |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js v18+ and npm
- PostgreSQL running locally (or a Render connection string)
- OpenAI API Key (GPT-4o access)
- Gmail account with an App Password (for OTP and email delivery)

---

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key

# Email (OTP & PDF delivery)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
```

Start the API server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 35001
```

API docs available at: `http://localhost:35001/docs`

---

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:35001
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:35000`.

---

## 📂 Project Structure

```
Atperf_web/
├── backend/
│   ├── main.py                  # FastAPI app entry point & router registration
│   ├── database.py              # SQLAlchemy engine, sessions, and DB config
│   ├── models.py                # ORM table definitions (User, Company, Session, etc.)
│   ├── schemas.py               # Pydantic request/response models
│   ├── dependencies.py          # Shared auth & session dependencies
│   ├── email_utils.py           # SMTP handling (OTP, HTML emails, PDF attachments)
│   ├── api/                     # Route modules (auth, radar, strapilot, admin, etc.)
│   └── prompts/
│       ├── DecisionRadar.py     # AI prompt logic for radar diagnostics
│       ├── StrAPilot.py         # AI prompt logic for data analysis
│       ├── StrapAnalysis.py     # Structured analysis generation
│       ├── StrapDiagnostic.py   # Diagnostic output formatting
│       └── CompanyInfo.py       # Company context extraction
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.tsx                      # Root component & client-side routing
        ├── components/
        │   ├── LandingPage.tsx          # Public landing page
        │   ├── Login.tsx                # External user login
        │   ├── Register.tsx             # External user registration (+ OTP)
        │   ├── StaffLogin.tsx           # Internal staff login
        │   ├── StaffRegister.tsx        # Internal staff registration
        │   ├── Dashboard.tsx            # User dashboard (history, sessions)
        │   ├── DecisionRadar.tsx        # Decision Radar tool
        │   ├── DecisionRadarLanding.tsx # Decision Radar landing page
        │   ├── Strapilot.tsx            # StrAPilot data analysis tool
        │   ├── StrapilotLanding.tsx     # StrAPilot landing page
        │   ├── StrapDiag.tsx            # StrAP diagnostic viewer
        │   ├── SubmitForm.tsx           # ProExtract problem submission form
        │   ├── AdminPanel.tsx           # Staff-only user management panel
        │   ├── AdminUseCases.tsx        # Staff-only use-case management
        │   ├── ProfileModal.tsx         # User profile editor (bilingual CV)
        │   ├── ContactPage.tsx          # Contact form page
        │   ├── TermsPage.tsx            # Terms & Conditions
        │   └── PrivacyPage.tsx          # Privacy Policy
        └── utils/
            ├── apiUrl.ts                # Global API base URL parser
            └── pdfGenerator.ts         # jsPDF layout and chart export helpers
```

---

## 🛠️ Troubleshooting

| Issue | Fix |
|---|---|
| **CORS errors on login** | Ensure `VITE_API_URL` exactly matches the backend host (e.g. `127.0.0.1` vs `localhost`) |
| **DB connection refused** | Verify PostgreSQL is running and `DATABASE_URL` is correct in `backend/.env` |
| **"Failed to generate diagnostic"** | Check that your OpenAI API key is valid and has not hit rate limits |
| **PDF export missing chart** | Keep the browser tab active and fully loaded before clicking export — `html2canvas` requires a visible DOM |
| **OTP email not received** | Confirm `SMTP_PASSWORD` is a Gmail App Password, not your account password |