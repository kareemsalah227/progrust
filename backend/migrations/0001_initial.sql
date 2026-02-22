CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    started_at  TEXT NOT NULL,
    ended_at    TEXT,
    duration_s  INTEGER,
    level       TEXT NOT NULL CHECK(level IN ('B1_PLUS', 'B2'))
);
