# SyncDocs — Local-First Collaborative Document Editor

> **House of EdTech — Fullstack Developer Technical Assessment (v2.1)**  
> **Built with:** Next.js 16 (App Router + Turbopack), React 19, TypeScript, Tailwind CSS v4, Prisma ORM, PostgreSQL (Neon / SQLite), Auth.js v5, Tiptap, Dexie.js (IndexedDB), Yjs CRDT, and Vercel AI SDK (Gemini).

---

## 🌟 Architecture Overview

SyncDocs is built on a **Local-First Architecture**. Unlike traditional web apps where every stroke waits for a server roundtrip, SyncDocs treats browser **IndexedDB** as the primary source of truth. The UI is zero-latency, fully functional offline, and automatically reconciles state with background exponential backoff synchronization when connectivity is restored.

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER (CLIENT SIDE)                      │
│                                                                 │
│  ┌──────────────────┐    IndexedDB    ┌──────────────────────┐  │
│  │   Tiptap Editor  │───────────────► │ Dexie Local DB       │  │
│  │  + Y.Doc CRDT    │                 │ (Source of Truth)    │  │
│  └──────────────────┘                 └──────────┬───────────┘  │
│           ▲                                      │              │
│           │ Reactivity                           ▼              │
│  ┌──────────────────┐  Outbox Queue   ┌──────────────────────┐  │
│  │ User Interface   │ ◄───────────────│ Sync Engine (Worker) │  │
│  └──────────────────┘                 └──────────┬───────────┘  │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                                     POST /api/sync│ (Exponential Backoff)
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (NEXT.JS 16)                       │
│                                                                 │
│  ┌──────────────────┐  Scoped ORM     ┌──────────────────────┐  │
│  │ API Route Handler│───────────────► │ PostgreSQL / Prisma  │  │
│  │ + Zod Validation │                 │ (Database State)     │  │
│  └──────────────────┘                 └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Technical Highlights

### ⚡ 1. Local-First Storage & Zero-Latency Edits
- **Primary Source of Truth**: All document creations, content modifications, and formatting changes hit local IndexedDB (powered by **Dexie.js**) first.
- **Zero Blocking Network Calls**: The user can create, edit, format, and navigate documents without internet connectivity.

### 🔄 2. Background Sync Engine (Outbox Pattern)
- **Automatic Queueing**: Edits while offline are stored in a local `syncQueue` table marked as `PENDING`.
- **Connectivity Detection**: Listens to browser `online`/`offline` events and triggers background reconciliation instantly on network restoration.
- **Exponential Backoff with Jitter**: If sync fails (e.g., flaky network), the engine retries with delays calculated via $E(r) = \min(\text{base} \times 2^r, \text{max}) \pm \text{jitter}$ to prevent thundering herd traffic.

### 🛡️ 3. Deterministic Conflict Resolution (CRDT with Yjs)
- **Mathematically Proven Convergence**: Uses **Yjs Conflict-free Replicated Data Types (CRDT)**. Concurrent offline edits by multiple users merge deterministically without data loss or overwrites.
- **Dual-State Representation**: Stores binary Yjs state vectors for merging alongside JSON structures for instant rendering and AI processing.

### 📜 4. Version History & Safe Time-Travel
- **Manual & Automatic Snapshots**: Save document versions with custom titles.
- **Non-Destructive Restoration**: Restoring an older snapshot creates a **NEW** version instead of destroying past timeline history.

### 🔐 5. Authorization & Granular Permissions (RBAC)
- **Role Hierarchy**:
  - `OWNER`: Full permissions — edit, delete, invite collaborators, restore past versions.
  - `EDITOR`: Edit document and view history.
  - `VIEWER`: Read-only. **Viewers are strictly prohibited from pushing sync updates to the server.**

### 🤖 6. AI-Powered Writing Assistant
- Powered by Vercel **AI SDK** and **Google Gemini** (`@ai-sdk/google`).
- Summarize document, improve writing tone, generate compelling titles, fix grammar, and translate to multiple languages.

---

## 🔒 Security & Real-World Production Considerations

| Challenge | Mitigation & Architecture |
|---|---|
| **Server OOM via Malformed Payloads** | Strict **Zod payload validation** caps sync operations at 100 batch items and payload size at 1MB via HTTP headers before parsing JSON in memory. |
| **Tenant Isolation & Unauthorized Access** | All Prisma database queries are strictly scoped: `where: { OR: [{ ownerId }, { collaborators: { some: { userId } } }] }`. Users cannot query or mutate un-shared documents. |
| **Viewers Pushing State Corruptions** | `/api/sync` performs server-side role verification before accepting state operations; `VIEWER` roles receive an immediate `403 Forbidden`. |
| **Typing Lag during Rapid Editing** | Client uses a debounced 2000ms write buffer to local storage, keeping main-thread input unblocked. |

---

## 📁 Folder Structure

```
syncdocs/
├── prisma/
│   └── schema.prisma         # Prisma ORM schema (Users, Documents, Collaborators, Versions, AuditLogs)
├── src/
│   ├── app/                  # Next.js 16 App Router Pages & API Routes
│   │   ├── (auth)/           # Login & Register pages
│   │   ├── (dashboard)/      # Dashboard document grid & search
│   │   ├── (editor)/         # Document editor workspace
│   │   └── api/              # REST & Sync Route Handlers
│   ├── components/           # UI Components & Editor Toolbar
│   ├── editor/               # Tiptap Extensions & Config
│   ├── features/             # AI Panel & Version Timeline Features
│   ├── hooks/                # React Hooks (useSyncEngine, useOnlineStatus)
│   ├── lib/                  # Auth.js, Prisma Singleton, Utilities
│   ├── server/               # Server Services & Zod Validators
│   ├── store/                # Zustand Client State Stores
│   ├── sync/                 # Local-First Sync Engine & Yjs Conflict Resolver
│   └── proxy.ts              # Next.js 16 Proxy / Middleware Protection
├── tests/                    # Automated Unit & Integration Test Suites
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm / pnpm / yarn

### Installation
```bash
# 1. Clone repository
git clone https://github.com/yourusername/syncdocs.git
cd syncdocs

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Initialize Database (SQLite for local dev or PostgreSQL for production)
npx prisma db push
npx prisma generate

# 4. Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

SyncDocs includes automated test suites covering CRDT conflict resolution and sync engine exponential backoff:

```bash
npm test
```

**Expected Output:**
```
==========================================
   SYNC DOCS AUTOMATED TEST RUNNER        
==========================================
🧪 Running CRDT Conflict Resolution Tests...
✅ Test 1 Passed: Deterministic CRDT Convergence verified.
✅ Test 2 Passed: Zero data loss verified.
🎉 All CRDT Conflict Resolution tests passed successfully!
🧪 Running Sync Engine Backoff Tests...
✅ Test 1 Passed: Exponential backoff growth verified.
✅ Test 2 Passed: Maximum delay cap enforced.
🎉 All Sync Engine Backoff tests passed successfully!

==========================================
 ALL TEST SUITES PASSED CLEANLY (100%)    
==========================================
```

---

## 🌐 Deployment Guide (Vercel + Neon PostgreSQL)

1. Push your code to GitHub.
2. Link your repository on [Vercel](https://vercel.com).
3. Set Environment Variables in Vercel settings:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string (`postgresql://...`)
   - `AUTH_SECRET`: Generate with `npx auth secret`
   - `GOOGLE_GENERATIVE_AI_API_KEY`: API key from [Google AI Studio](https://aistudio.google.com)
4. Update `prisma/schema.prisma` datasource provider to `postgresql`.
5. Deploy! Vercel automatically runs builds using Next.js 16 Turbopack.

---

## 👤 Author Information

- **Candidate Name**: **BHANU SRI**
- **Title**: Full Stack Developer | Shopify Developer | Hyderabad
- **Phone**: 📞9390623903
- **Email**: ✉️ [bhanuannagi1@gmail.com](mailto:bhanuannagi1@gmail.com)
- **Portfolio**: [https://personal-portfolio-latest-sooty.vercel.app/](https://personal-portfolio-latest-sooty.vercel.app/)
- **LinkedIn**: [https://www.linkedin.com/in/bhanu-sri-anangi-2963b3248](https://www.linkedin.com/in/bhanu-sri-anangi-2963b3248)
- **GitHub**: [https://github.com/Bhanu-sri-12](https://github.com/Bhanu-sri-12)
- **Submission**: House of EdTech — Fullstack Developer Assignment 2 (v2.1, April 2026)
