# --- Stage 1: Frontend Build ---
FROM node:20-slim AS frontend-builder
WORKDIR /app
# COPY frontend/package*.json ./
COPY frontend/ ./
RUN npm install
RUN npm run build

# --- Stage 2: Backend Build ---
FROM rust:1.82-slim AS backend-builder
WORKDIR /app

# Install build dependencies for SQLite
RUN apt-get update && apt-get install -y pkg-config libsqlite3-dev build-essential && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/src ./src
COPY backend/migrations ./migrations

# Build the binary
RUN cargo build --release

# --- Stage 3: Runtime ---
FROM debian:bookworm-slim
WORKDIR /app

# Install runtime dependencies for SQLite
RUN apt-get update && apt-get install -y libsqlite3-0 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the built binary from the backend-builder
COPY --from=backend-builder /app/target/release/german-tracker-backend /app/german-tracker-backend

# Copy the frontend dist from the frontend-builder
COPY --from=frontend-builder /app/dist /app/frontend-dist

# Port the app runs on
EXPOSE 3000

# Environment variables
ENV FRONTEND_DIR=/app/frontend-dist
ENV DATABASE_URL=/app/data/german_tracker.db

# Create data directory for volume mounting
RUN mkdir /app/data

# Run the app
CMD ["/app/german-tracker-backend"]
