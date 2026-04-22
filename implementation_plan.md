# NurseFlow AI — Proper Project Todo List

This document outlines the atomic, sequential tasks required to build **NurseFlow AI** from its current state to a fully functional MVP.

## User Review Required

> [!IMPORTANT]
> The tasks are structured to be completed one at a time. Do not skip steps or work on multiple tasks in parallel to ensure stability and dependency integrity.

> [!NOTE]
> The frontend currently only contains documentation. The backend has a strong service foundation but requires verification of database connectivity and API endpoints.

---

## Phase 1: Foundation & Scaffolding (Frontend)
Initialize the frontend application and establish the design system.

- [ ] **Task 1.1**: Initialize Next.js 15 project in `frontend/` using `npx create-next-app@latest ./` with TypeScript, Tailwind CSS, and App Router.
- [ ] **Task 1.2**: Configure `tailwind.config.ts` with the custom color palette, fonts (Plus Jakarta Sans, DM Sans, JetBrains Mono), and border radius tokens defined in `design.md`.
- [ ] **Task 1.3**: Implement the Global CSS Design System in `app/globals.css`, including custom properties for colors, typography scale, and "Claymorphic" utility classes.

---

## Phase 2: Core UI Shell & Navigation
Build the primary visual framework for the application.

- [ ] **Task 2.1**: Implement the Glassmorphic Navigation Bar (`components/layout/Navbar.tsx`) with blur effects and sticky positioning.
- [ ] **Task 2.2**: Build the Bento Grid Layout Engine (`components/layout/BentoGrid.tsx`) using CSS Grid as specified in the design spec.
- [ ] **Task 2.3**: Create the Reusable Claymorphic Card Component (`components/ui/Card.tsx`) with hover transitions and soft shadows.

---

## Phase 3: Authentication & Backend Sync
Secure the application and connect frontend to backend.

- [ ] **Task 3.1**: Set up Clerk or Better Auth for Nurse authentication flow.
- [ ] **Task 3.2**: Configure FastAPI backend with CORS to allow requests from the frontend (Vercel/Localhost).
- [ ] **Task 3.3**: Verify and run Alembic migrations in the `backend/` to initialize the database schema.

---

## Phase 4: Unified Patient Dashboard (F-04)
The central hub where nurses spend most of their time.

- [ ] **Task 4.1**: Implement the Dashboard Page (`app/dashboard/page.tsx`) using the Bento Grid layout.
- [ ] **Task 4.2**: Integrate Backend Patient Service to fetch the assigned patient list with AI-calculated acuity scores.
- [ ] **Task 4.3**: Implement "Acuity Status Badges" (Safe, Warning, Critical) with the defined semantic colors.

---

## Phase 5: Medication Priority Queue (F-02)
Solving the triage problem for nurses.

- [ ] **Task 5.1**: Build the Medication Priority Queue Component (`components/meds/MedicationQueue.tsx`).
- [ ] **Task 5.2**: Implement "Due Now" pulse animations and critical glow borders for high-priority medications.
- [ ] **Task 5.3**: Connect the "Log Administration" action to the backend `medication_service.py` with real-time state updates.

---

## Phase 6: Intelligent SBAR Handoff (F-01)
Automating the most time-consuming part of the shift.

- [ ] **Task 6.1**: Create the SBAR Handoff Page (`app/handoff/[patientId]/page.tsx`) with a split-screen desktop layout (Raw Data vs AI Draft).
- [ ] **Task 6.2**: Implement the "Generate SBAR" trigger that calls the backend `sbar_service.py` (Llama 3 / Groq integration).
- [ ] **Task 6.3**: Build the interactive SBAR Editor with AI content markers (lavender borders) and "Approve & Sign" functionality.

---

## Phase 7: Voice Documentation & NLP (F-05)
Hands-free workflow enhancements.

- [ ] **Task 7.1**: Implement the Floating Voice Note Button with Browser Speech-to-Text (STT) or Whisper integration.
- [ ] **Task 7.2**: Connect Voice Transcription to the backend `voice_note_service.py` for NLP parsing using Groq (extracting clinical actions).
- [ ] **Task 7.3**: Create a "Voice Note History" feed for each patient.

---

## Phase 8: Predictive Fall-Risk Monitor (F-03)
Real-time safety monitoring.

- [ ] **Task 8.1**: Implement the Liquid-Fill Risk Gauge (`components/ui/RiskGauge.tsx`) using SVGs and the `color-mix` CSS logic.
- [ ] **Task 8.2**: Set up the Real-time Alert System (using Upstash Redis Streams) to push fall-risk notifications to the frontend.
- [ ] **Task 8.3**: Build the Fall-Risk Detail Modal showing top contributing factors (Explainability requirement).

---

## Phase 9: Final Polish & Verification
Ensuring the "Premium Health App" feel.

- [ ] **Task 9.1**: Add staggered entrance animations for all cards and page transitions using Framer Motion or CSS transitions.
- [ ] **Task 9.2**: Conduct an Accessibility Audit (WCAG 2.1 AA/AAA) focusing on contrast and tap targets.
- [ ] **Task 9.3**: Perform full E2E manual verification of the "Shift Handoff" and "Medication Round" user journeys.

## Verification Plan

### Automated Tests
- Run `npm run lint` and `pytest` for frontend and backend.
- Verify API connectivity using Postman or Swagger UI (`/docs`).

### Manual Verification
- **Patient Dashboard**: Verify bento cards are responsive and acuity scores are color-coded correctly.
- **SBAR Flow**: Trigger a handoff generation, edit the text, and confirm successful storage in the DB.
- **Medication Queue**: Confirm meds re-order correctly when "due now" status is triggered.
- **Fall Risk**: Mock a CV event and verify the "Critical" alert pulse and mobile notification.
