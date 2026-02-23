# German Learning Tracker 🇩🇪

A self-hosted, premium hour-tracking system designed to quantize your learning progress toward B1+ and B2 levels without demotivating gamification. Built with a Rust backend and a React (PWA) frontend.

## Features

### 🕒 Effortless Logging
- **One-tap Start/Stop**: No manual math or time recording.
- **Level Selection**: Choose between B1+ and B2 on every start.
- **Verification Step**: Confirm or discard a session after finishing to ensure data accuracy.
- **Auto-rounding**: Displays rounded minutes to keep focus on progress, not seconds.

### 📊 Progress Visualization
- **Goal Bars**: Three horizontal bars showing progress toward B1+ (200h), B2 (320h), and Combined (520h).
- **Remaining Hours**: Explicit indicators for exactly how many hours are left to reach each goal.
- **Daily Activity**: Bar charts showing hours put in per day for each level.

### 🏠 Local Network Ready
- **PWA Support**: Installable on iPhone/iPad Home Screen via Safari.
- **Single Binary**: The Rust server hosts both the API and the frontend.
- **SQLite Storage**: Data is stored locally in `backend/german_tracker.db`.

---

## Technical Stack

- **Backend**: Rust (Axum, sqlx, Tokio)
- **Frontend**: React, Vite, Recharts, Tailwind CSS, TanStack Query
- **Database**: SQLite (managed by sqlx migrations)

---

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
    └── package.json
```

---

## Getting Started

### 1. Build the Frontend
```bash
cd frontend
npm install
npm run build
```

### 2. Run the Server
```bash
cd ../backend
cargo run
```

The server starts on `http://0.0.0.0:3000`.

### 3. Access on your devices
- **Mac**: [http://localhost:3000](http://localhost:3000)
- **iPhone/iPad**: `http://<YOUR_MAC_IP>:3000`
- **Pro Tip**: On iOS/Android, use "Add to Home Screen" to use it like a native app.

---

## Docker Deployment (Recommended for Synology NAS)

### 1. Build & Run locally with Compose
```bash
docker-compose up --build -d
```
This will build the image and start the container in the background. Your data will be persisted in the `./data` folder.

### 2. Deploying to Synology NAS
1.  **Preparation**: Copy the project folder to your NAS (e.g., via SMB or File Station).
2.  **Container Manager**:
    *   Open the **Container Manager** app on Synology.
    *   Go to **Project** -> **Create**.
    *   Select the folder containing `docker-compose.yml`.
    *   Give it a name and follow the wizard.
3.  **Data Persistence**: Ensure the `./data` directory exists. This is where your SQLite database will live.

### 3. Secure Remote Access (Tailscale)
To access your tracker securely from anywhere without opening ports:
1.  **Install Tailscale**: Download the Tailscale app on your Synology NAS from the Package Center.
2.  **Connect Devices**: Install Tailscale on your iPhone/iPad/Mac.
3.  **Access**: Use the Synology's Tailscale IP (e.g., `http://100.x.y.z:3000`) or its MagicDNS name to access the tracker from anywhere as if you were home.

---

## Future Expansion
The system is built for expandability:
- **Remote Access**: Ready for **Tailscale** (Zero-Config VPN).
- **Postgres**: Swapping SQLite for Postgres is trivial via `sqlx`.
- **AI Agent**: The structured `/api/stats` endpoint is ready for LLM integration.
