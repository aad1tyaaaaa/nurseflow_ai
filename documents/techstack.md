# NurseFlow AI – Technical Stack (Free Tier Only)

## Overview

This stack is optimized for **zero-cost development and pilot deployment**, using only free-tier services and open-source tools. It is intended for **non-commercial use with synthetic or non-sensitive data**.

---

## 1. Core Frameworks

* **Frontend:** Next.js 16+ (Hobby Plan)
* **Backend:** FastAPI (Python)
* **Styling:** Tailwind CSS
* **Language:** TypeScript (Strict Mode)

---

## 2. Data & Storage

* **Primary Database:** Neon DB

  * Free Tier: 0.5 GB storage, multiple projects supported
  * Use case: Core application data

* **Real-time Events:** Upstash Redis (Redis Streams)

  * Free Tier: ~10k requests/day
  * Use case: Lightweight event streaming (vitals, alerts)

* **Clinical / App Storage:** Supabase

  * Free Tier: 500MB database, 5GB bandwidth
  * Features: Row Level Security (RLS) for structured access control

---

## 3. Authentication & Security

* **Auth Provider:** Better Auth (Open-source)

* **Identity Management:** Clerk

  * Free Tier: Up to 10,000 monthly active users

* **Encryption:**

  * AES-256 (via Postgres / Neon built-in encryption)

---

## 4. AI & Edge Inference

* **LLM (Text Processing):** Groq Cloud API

  * Free Tier access for Llama 3 / Mistral models

* **Computer Vision:** YOLOv8

  * Open-source, runs on local or edge devices

* **Speech-to-Text:** Whisper

  * Open-source, self-hosted (can use free GPU credits where available)

---

## 5. Deployment & Monitoring

* **Frontend Hosting:** Vercel (Hobby Plan)

* **Serverless Backend / APIs:** Cloudflare Workers

  * Free Tier: 100,000 requests/day

* **Error Monitoring:** Sentry

  * Free Tier: 5k errors/month

* **Performance & Logs:** Better Stack

  * Free uptime monitoring + log management

* **Product Analytics:** PostHog

  * Free Tier: 1M events/month
  * Includes session recordings

---

## 6. Development Constraints

* Designed for:

  * Prototyping
  * Hackathons
  * Academic or pilot deployments

* Data Guidelines:

  * Use **synthetic, anonymized, or non-sensitive data only**
  * Avoid storing real patient-identifiable information

---

## 7. Summary Architecture

Frontend (Next.js)
→ API Layer (FastAPI / Cloudflare Workers)
→ Database (Neon / Supabase)
→ Event Streaming (Upstash Redis)
→ AI Services (Groq + YOLOv8 + Whisper)
→ Monitoring (Sentry + Better Stack + PostHog)

---

## 8. Cost

* Total Monthly Cost: **$0**
* Scaling beyond free tiers will require paid upgrades

---

## 9. Notes

This stack prioritizes:

* Zero-cost deployment
* Fast iteration
* Open-source flexibility
* Minimal vendor lock-in

It is not intended for production environments involving sensitive real-world data.

---
