# Campus Festival Management Platform

A full-stack MVP for managing a campus festival's competitions: student registration
(online + on-site "Green Room"), a real-time anonymized judge portal, panel scoring
with averaging, live leaderboards, and certificate generation.

Built from the platform spec: JEDS/organizer portal, judging system, student
registration & code-letter IDs, and real-time judge ↔ Green Room sync.

## Stack

- **Backend:** Node.js, Express, Socket.IO (real-time), better-sqlite3 (zero-config file DB), pdfkit (certificates)
- **Frontend:** React (Vite), React Router, socket.io-client, plain CSS
- **Infra:** Docker + docker-compose for one-command local run

No payment/financial features are included, per the plan.

## Features implemented

- **Programs/Competitions:** organizer creates writing (pre-submitted) or stage (live) programs with a short code and time slot.
- **Student Registration:** one shared form for stage & writing programs; open to all campus members; both online (self-service) and on-site ("Green Room", organizer-entered) registration.
- **Code Letters & Participant IDs:** assigned in registration order per program (A, B, C...); Participant ID format `FEST-[ProgramCode]-[RegNumber]-[CodeLetter]`, e.g. `FEST-ESH-001-A`.
- **Judge Accounts:** system-issued judge codes (seeded examples below); organizers manually assign judges to programs.
- **Real-Time Judge Portal:** WebSocket push (Socket.IO) — new Green Room registrations appear in the judge's list within ~1-2 seconds, no refresh needed.
- **Anonymized Judging:** judges see Code Letter only, never student name/ID; they pick who to judge next (no forced order).
- **Panel Scoring:** numeric score (0-100) + letter grade (A-F) + remarks (≤500 chars); one submission per judge per participant, final — no revision/appeal endpoint exists.
- **Averaging & Confidentiality:** final rank uses the average of all submitted judge scores; individual judge scores are never exposed to organizers or the public, only the average.
- **Live Leaderboard:** public page, ranked per program, updates in real time as scores come in.
- **Certificates:** auto-generated PDF certificates for 1st/2nd/3rd place.

## Project structure

```
festival-platform/
├── backend/
│   ├── server.js          # Express + Socket.IO entry point
│   ├── db.js               # SQLite schema + seed data
│   ├── routes/
│   │   ├── auth.js         # organizer/judge login, judge account creation
│   │   ├── programs.js     # competitions CRUD, judge assignment
│   │   ├── registrations.js# registration + code-letter/participant-ID logic
│   │   ├── scores.js       # judge scoring, one-final-score enforcement
│   │   └── results.js      # ranking/averaging + certificate PDF
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # routing + simple role-based auth
│   │   ├── api.js           # REST client
│   │   ├── socket.js        # Socket.IO client
│   │   └── pages/
│   │       ├── Register.jsx     # public student registration
│   │       ├── GreenRoom.jsx    # organizer on-site registration + judge assignment
│   │       ├── ProgramsAdmin.jsx# organizer: create competitions
│   │       ├── JudgePortal.jsx  # real-time anonymized judging UI
│   │       ├── Leaderboard.jsx  # public live results display
│   │       └── Login.jsx
│   └── Dockerfile
└── docker-compose.yml
```

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api

## Quick start (without Docker)

```bash
# Terminal 1
cd backend
npm install
npm run dev        # http://localhost:4000

# Terminal 2
cd frontend
npm install
npm run dev         # http://localhost:5173, proxies /api to :4000
```

## Seeded accounts (change before real use)

| Role      | Code            | Password    |
|-----------|-----------------|-------------|
| Organizer | `ORG-001`       | organizer123|
| Judge     | `JUDGE-2024-001`| judge123    |
| Judge     | `JUDGE-2024-002`| judge123    |

## Typical flow

1. Organizer logs in → **Programs** → creates competitions (e.g. "Essay Writing (English)", type `writing`; "Qawwali Night", type `stage`).
2. Organizer assigns judges to each program from **Green Room**.
3. Students self-register online at `/register`, or organizer adds them on-site from **Green Room** — both get a Code Letter + Participant ID instantly.
4. Judge logs in, opens **Judge Portal**, selects the program — sees the anonymized, live-updating list and scores whoever they pick.
5. **Leaderboard** updates in real time as scores land; once all assigned judges have scored a participant, their status flips to "judged" and their average appears in the rankings.
6. Organizer downloads 1st/2nd/3rd place certificates from Green Room's results table.

## Notes / next steps for production hardening

- Auth is intentionally minimal (plaintext password match, no JWT/session) to keep the MVP simple to run locally — add bcrypt hashing + JWT/session cookies before any real deployment.
- Writing-competition file uploads (essays/stories) aren't wired up yet — `submission_file` exists in the schema as a placeholder; add multer + file storage when ready.
- better-sqlite3 is fine for a single-server festival deployment; swap to Postgres if you need multiple backend instances.
- Add rate limiting / input sanitization before exposing the public registration form to the internet.
