# CAPACITY CONNECT

> **Building Skills. Connecting Capacity. Creating Impact.**

CAPACITY CONNECT is a modern, responsive, secure full-stack capacity-building and learning management platform designed for enterprise organizations, trainees, and instructors. It unifies structured 4-module progressive learning pathways, YouTube video lessons, algorithmic competency mapping, timed anti-cheat assessments with diverse question sets, and cryptographically verifiable digital certification.

---

## Key Features

### 1. Three Core Roles
- **Trainee**:
  - Enrolled curricula dashboard (strictly isolating courses selected by the logged-in trainee).
  - 4-module structured Learning Paths with interactive YouTube video lectures and PDF reference materials.
  - Timed assessments (20 to 50 questions, 30 to 60 minute countdown timer with auto-submit).
  - Dynamic retake system generating fresh question sets avoiding previously attempted questions.
  - Verifiable digital certificates with unique verification hashes (printable & downloadable as PDF).
  - Detailed personal, academic, and professional trainee profile.
  - Multi-criteria curriculum and trainer feedback.
- **Trainer**:
  - Real-time dashboard driven strictly by live database statistics (enrolled trainees, participation rate, average scores, completion rate, feedback rating).
  - Comprehensive trainer credentials profile (skills, specializations, certifications) feeding directly into the Competency Matching engine.
  - Targeted questionnaire creation with questions, answer keys, and enforced deadlines.
  - Student roster tracking module progression, best assessment attempts, and certification status.
  - Faculty knowledge repository (Trainer Library) for recorded lectures, PPT slide decks, and study guides.
- **Admin**:
  - Executive dashboard monitoring platform users, active courses, total enrollments, assessment attempts, certificates, and pass rates.
  - Identity governance: approve/reject pending faculty registrations, activate/deactivate accounts, manage roles, prevent unauthorized role escalation.
  - Course catalog management: create and edit courses with 4-module structures, syllabus summaries, and competency tagging.
  - **Algorithmic Competency Mapping**: Real mathematical suitability percentage matching course competency requirements against trainer profiles, featuring skill gap analysis (matching vs. missing skills) and 1-click trainer assignment.
  - Publication management: publish announcements, cohort achievements, and educational content directly to the public landing page.
  - Assessment and certification audit logs.

### 2. Security & Architecture
- Password hashing with PBKDF2/SHA-256 and salt.
- JWT session authentication with strict role-based access control.
- Login error compliance:
  - Non-existent user returns exactly `"User does not exist"` in red, auto-hiding after ~3 seconds.
  - Wrong password returns `"Incorrect password"`.
  - Public registration defaults to `trainee`; public `admin` signup is strictly forbidden.
- Serverless-ready Python backend compatible with Vercel Serverless Functions (`api/index.py`).
- SQLite database abstraction with migrations and seed initialization.

---

## Technology Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - React Router v6
  - Lucide React
  - Canvas Confetti
- **Backend**:
  - Python 3
  - FastAPI
  - SQLite
  - PyJWT & Passlib
  - Uvicorn (local development server)
- **Deployment**:
  - Vercel Serverless Architecture (`vercel.json`)

---

## Project Structure

```
capacity-connect/
├── api/
│   ├── index.py                  # Vercel Serverless FastAPI application
│   ├── database.py               # SQLite schema, tables, and seed initialization
│   ├── models.py                 # Pydantic validation models
│   ├── auth.py                   # JWT tokens, password hashing, role guards
│   ├── competency_engine.py      # Real competency matching & skill gap algorithm
│   ├── ai_bot.py                 # AI MCQ bot + fallback question bank engine
│   └── requirements.txt          # Python dependencies
├── src/
│   ├── components/
│   │   ├── common/               # Navbar, Footer, Modal, YouTubePlayer, CertificateCard
│   │   ├── trainee/              # LearningPathViewer, AssessmentRunner
│   │   ├── trainer/              # QuestionnaireModal, LibraryUploadModal
│   │   └── admin/                # CompetencyModal, CourseModal
│   ├── layouts/
│   │   ├── PublicLayout.tsx      # Public site shell
│   │   ├── TraineeLayout.tsx     # Trainee sidebar & dashboard shell
│   │   ├── TrainerLayout.tsx     # Trainer portal shell
│   │   └── AdminLayout.tsx       # Admin console shell
│   ├── pages/
│   │   ├── public/               # LandingPage, AboutPage, PublicCoursesPage, ContactPage, LoginPage, SignupPage
│   │   ├── trainee/              # Dashboard, Profile, Courses, LearningPath, Assessment, Resources, Certificates, Feedback
│   │   ├── trainer/              # Dashboard, Profile, Courses, Questionnaires, Trainees, Library, Performance
│   │   └── admin/                # Dashboard, Users, Courses, CompetencyMapping, Assessments, Certifications, Announcements, Content
│   ├── services/
│   │   └── api.ts                # Typed API client without hardcoded URLs
│   ├── context/
│   │   ├── AuthContext.tsx       # Authentication & session state
│   │   └── ToastContext.tsx      # Toast notifications
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── App.tsx                   # Role-based protected routing
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Tailwind CSS & print media rules
├── public/
│   └── logo.svg                  # Brand SVG mark
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                   # Vercel Serverless & SPA routing rewrites
├── .env.example
├── .gitignore
└── README.md
```

---

## Local Setup & Development

### 1. Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+)

### 2. Install Dependencies
```bash
# In the capacity-connect directory:
npm install
pip install -r api/requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
# Frontend (leave empty during local development to use Vite proxy)
VITE_API_BASE_URL=

# Backend Secrets (NEVER expose to frontend)
JWT_SECRET=super_secure_capacity_connect_production_secret_key_2026
GEMINI_API_KEY=
DATABASE_PATH=capacity_connect.db
```

### 4. Development Commands
You can run the backend server and frontend development server in two separate terminals:

**Terminal 1 (Backend API):**
```bash
npm run server
# Runs: python -m uvicorn api.index:app --reload --port 8000
```

**Terminal 2 (Frontend Dev Server):**
```bash
npm run dev
# Starts Vite dev server on http://localhost:5173 with proxy to API
```

Open `http://localhost:5173` in your browser.

---

## Production Build

To compile TypeScript and build the production frontend bundle into `dist/`:
```bash
npm run build
```

To preview the production bundle locally:
```bash
npm run preview
```

---

## Pre-Seeded Demonstration Accounts

The platform automatically seeds initial administrative, faculty, and student accounts for instant verification:

| Role | Email | Password | Status |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@capacityconnect.org` | `Admin@12345` | Active |
| **Faculty Trainer** | `trainer.sarah@capacityconnect.org` | `Trainer@123` | Active |
| **Faculty Trainer** | `trainer.david@capacityconnect.org` | `Trainer@123` | Active |
| **Faculty Trainer** | `trainer.elena@capacityconnect.org` | `Trainer@123` | Active |
| **Trainee** | `trainee.alex@capacityconnect.org` | `Trainee@123` | Active |

---

## Vercel Deployment Instructions

1. Push this repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your repository and select the `capacity-connect` directory if applicable.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Configure Environment Variables in the Vercel dashboard:
   - `JWT_SECRET`: A secure random secret string.
   - `GEMINI_API_KEY`: (Optional) Your Google Gemini API key for dynamic MCQ generation.
8. Click **Deploy**. Vercel will build the frontend and serve `/api` using `@vercel/python` serverless runtime according to `vercel.json`.
