# Welcome Darjeeling 🏔️

A simple, mobile-first shared expense tracker for one trip — built for a group of friends,
not for accountants. React + TypeScript + Tailwind on the frontend, Node/Express +
TypeScript + MongoDB on the backend.

## What's in this repo

```
welcome-darjeeling/
├── backend/     Express + MongoDB API, the accounting engine, and all tests
└── frontend/    React + Vite + Tailwind mobile-first app
```

## Prerequisites

- Node.js 18+
- A MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

## 1. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGODB_URI to your own MongoDB connection string
npm install
npm run test    # runs the accounting engine test suite (42 tests, no DB needed)
npm run dev     # starts the API on http://localhost:4000
```

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if your API isn't on http://localhost:4000/api
npm install
npm run dev     # starts the app on http://localhost:5173
```

Open `http://localhost:5173` — that's the "Create Trip" screen. Create a trip, then open
the People tab to grab the share link and each friend's code, or open the link on another
browser/device to try the join flow.

## How the accounting works (and why it's exact)

- All money is stored and calculated as **integer paise** (1 rupee = 100 paise) — never
  floating point — so rounding errors can never creep into a balance.
- Equal splits distribute the leftover paise deterministically: to the trip owner if
  they're a participant, otherwise to the first selected participant. See
  `backend/src/services/splitEngine.ts` and its tests.
- Settlement suggestions ("who pays whom") are recomputed from the live expense ledger
  every time balances change, netted against settlements already marked `paid`, so the
  same debt is never suggested twice. See `backend/src/services/settlementService.ts`.
- Run `npm run test` inside `backend/` any time — it validates every rounding rule,
  including the exact numbers from the spec's Final Acceptance Test scenario.

## What this app intentionally does NOT have

Per the original spec: no passwords/OTP/OAuth, no payment gateway, no bill photo upload,
no multi-trip history, no offline mode, no partial settlement payments, no member or
category deletion. Identity is a name + a short per-trip code, remembered on your device
via a signed cookie — lightweight, not a full auth system.

## A note on this build

This project was generated in a sandboxed environment without live internet/MongoDB
access, so while the full backend (models, accounting engine, API, auth/permissions) and
frontend (all pages, forms, and the mobile UI) are complete, real code, and fully
typechecked, the end-to-end flow against a running MongoDB has not been exercised inside
this environment. The accounting engine itself *is* verified — 42 passing unit tests,
including the exact Final Acceptance Test numbers from the spec. Before relying on this
in production, run through the acceptance-test scenario yourself against a real MongoDB
instance.
