# German Learning Tracker

A self-hosted hour tracking system for learning German. Log study sessions with a single tap, and visualize your progress toward B1+ and B2 completion goals.

## Project Structure

```
progrust/
├── backend/          # Rust (Axum) API + static file server
│   ├── src/main.rs
│   ├── migrations/
│   └── Cargo.toml
└── frontend/         # React + Vite PWA
    ├── src/
    │   ├── App.tsx
    │   ├── api.ts
    │   └── components/
    │       ├── SessionTracker.tsx
    │       └── ProgressDashboard.tsx
    └── package.json
```

## Running Locally

### Prerequisites
- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 18+

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

### 2. Start the Backend

```bash
cd backend
cargo run
```

The server starts on `http://0.0.0.0:3000`.

- From this Mac: `http://localhost:3000`
- From iPad/iPhone on the same WiFi: `http://<your-mac-ip>:3000`

> Find your local IP: `ipconfig getifaddr en0`

### Development Mode (hot reload)

You can run the frontend dev server and backend simultaneously:

```bash
# Terminal 1
cd backend && cargo run

# Terminal 2
cd frontend && npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:3000`.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sessions/start` | Start a session (`{"level": "B1_PLUS"\|"B2"}`) |
| `POST` | `/api/sessions/stop/:id` | Stop session, returns duration in minutes |
| `DELETE` | `/api/sessions/:id` | Discard a session |
| `GET` | `/api/stats` | Aggregated hours per level |

## Goals

| Level | Target Hours |
|---|---|
| B1+ | 200 h |
| B2 | 320 h |
| Combined | 520 h |

## Database

SQLite file created automatically at `backend/german_tracker.db` on first run. Back it up by copying this file to your NAS.
