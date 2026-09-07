# Prompt for ChatGPT: Free Backend & Deployment Setup for Citypulse

> **How to use this**: Copy the prompt below inside the block and paste it directly into ChatGPT.

```markdown
I have a full-stack civic reporting web application called **Citypulse** (Community Tracker) and I want to deploy it completely for **FREE** with a live database and real-time backend.

Please give me a complete, step-by-step guide to set up and deploy the backend and frontend on 100% free hosting tiers (e.g., Render + Supabase/Neon PostgreSQL, or all-in-one on Render).

---

### Project Architecture & Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Leaflet (Map) + Canvas scroll animations
- **Backend Server**: Node.js + Express + Socket.IO (for real-time signal broadcasting)
- **Database Layer**: Currently uses Prisma schema (`prisma/schema.prisma`) with a fallback JSON file store (`citypulse_store.json`)
- **API Endpoints**:
  - `GET /api/issues` — Get all reports
  - `POST /api/issues` — Create a citizen report (supports title, description, category, severity, lat/lng, address, photo base64)
  - `PATCH /api/issues/:id` — Update status (`SUBMITTED`, `IN_REVIEW`, `IN_PROGRESS`, `RESOLVED`), priority score, officer notes
  - `POST /api/issues/:id/upvote` — Upvote / validate report
  - `GET /api/analytics` — Real-time stats (total, resolved, priority queue, activity stream)
  - `POST /api/auth/signup` & `POST /api/auth/login` & `GET /api/auth/me` — JWT-based authentication for CITIZEN and AUTHORITY roles
- **Real-Time Events**:
  - Socket.IO emits `report_created` and `report_updated`

---

### What I Need From You (Step-by-Step)

1. **Free Cloud Database Setup (Free PostgreSQL)**:
   - Guide me on creating a free PostgreSQL database on **Supabase** (or **Neon.tech**).
   - Show how to connect Prisma using `DATABASE_URL`.
   - Provide the Prisma migration command to create tables for `Issue`, `User`, `Vote`, and `Activity`.

2. **Free Backend Hosting (with WebSockets)**:
   - Guide me on deploying the Express + Socket.IO server on **Render.com** (Free Web Service) or Railway.
   - Specify the exact **Build Command** (`npm install && npm run build` or `npm run prisma:generate`) and **Start Command** (`npm start`).
   - List all required Environment Variables (`PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `GEMINI_API_KEY`).
   - Explain how to handle Render's free tier inactivity/spin-down gracefully (e.g. free cron pingers like Cron-Job.org).

3. **Frontend Deployment Options**:
   - Option A: **Render All-in-One** (Express serves Vite's built `dist` bundle from the same domain, zero CORS issues).
   - Option B: **Netlify / Vercel** (Frontend on Netlify, Backend on Render with `VITE_API_URL` pointing to Render).

4. **Production Checklist & Troubleshooting**:
   - How to test Socket.IO connections in production.
   - How to test report uploads and image storage.
   - Any CORS or HTTPS/WSS pitfalls to avoid.

Please provide concise, copy-paste ready terminal commands, configs, and setup steps.
```

---

## Quick Reference for Your Project

### Environment Variables Needed
| Variable | Value Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Web server port | `3000` (or assigned automatically by Render) |
| `JWT_SECRET` | Secret key for auth tokens | `your-secure-random-jwt-key` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:5432/db` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `*` or `https://your-app.netlify.app` |
| `GEMINI_API_KEY` | Optional Google GenAI API key for AI severity triage | `AIzaSy...` |

### Scripts Already In Your `package.json`
- **Build**: `npm run build` (Builds Vite frontend into `dist/` and bundles `server.ts` into `dist/server.cjs`)
- **Start**: `npm start` (Runs `node dist/server.cjs`)
