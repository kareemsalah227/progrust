use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, Row, SqlitePool};
use std::{net::SocketAddr, path::PathBuf};
use tower_http::{cors::CorsLayer, services::ServeDir};
use uuid::Uuid;

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
struct StartSessionRequest {
    level: String, // "B1_PLUS" | "B2"
}

#[derive(Debug, Serialize)]
struct StartSessionResponse {
    session_id: String,
}

#[derive(Debug, Serialize)]
struct StopSessionResponse {
    duration_minutes: i64,
}

#[derive(Debug, Serialize)]
struct StatsResponse {
    b1_plus_hours: f64,
    b2_hours: f64,
    total_hours: f64,
    b1_plus_goal_hours: f64,
    b2_goal_hours: f64,
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/// POST /api/sessions/start
async fn start_session(
    State(pool): State<SqlitePool>,
    Json(payload): Json<StartSessionRequest>,
) -> impl IntoResponse {
    let level = payload.level.to_uppercase();
    if level != "B1_PLUS" && level != "B2" {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "level must be B1_PLUS or B2"})),
        )
            .into_response();
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    sqlx::query("INSERT INTO sessions (id, started_at, level) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(&now)
        .bind(&level)
        .execute(&pool)
        .await
        .expect("Failed to insert session");

    (
        StatusCode::CREATED,
        Json(StartSessionResponse { session_id: id }),
    )
        .into_response()
}

/// POST /api/sessions/stop/:id
async fn stop_session(
    State(pool): State<SqlitePool>,
    Path(session_id): Path<String>,
) -> impl IntoResponse {
    let row = sqlx::query(
        "SELECT id, started_at, ended_at, duration_s, level FROM sessions WHERE id = ?",
    )
    .bind(&session_id)
    .fetch_optional(&pool)
    .await
    .expect("DB error");

    let row = match row {
        Some(r) => r,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({"error": "session not found"})),
            )
                .into_response()
        }
    };

    let ended_at: Option<String> = row.get("ended_at");
    if ended_at.is_some() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "session already stopped"})),
        )
            .into_response();
    }

    let started_at: String = row.get("started_at");
    let started: chrono::DateTime<Utc> = started_at.parse().expect("Invalid started_at");
    let now = Utc::now();
    let duration_s = (now - started).num_seconds();
    let now_str = now.to_rfc3339();

    sqlx::query("UPDATE sessions SET ended_at = ?, duration_s = ? WHERE id = ?")
        .bind(&now_str)
        .bind(duration_s)
        .bind(&session_id)
        .execute(&pool)
        .await
        .expect("Failed to update session");

    // Round to nearest minute — never show raw seconds to user
    let duration_minutes = (duration_s as f64 / 60.0).round() as i64;

    (
        StatusCode::OK,
        Json(StopSessionResponse { duration_minutes }),
    )
        .into_response()
}

/// DELETE /api/sessions/:id  — discard a session the user chose not to log
async fn discard_session(
    State(pool): State<SqlitePool>,
    Path(session_id): Path<String>,
) -> impl IntoResponse {
    let result = sqlx::query("DELETE FROM sessions WHERE id = ?")
        .bind(&session_id)
        .execute(&pool)
        .await
        .expect("DB error");

    if result.rows_affected() == 0 {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "session not found"})),
        )
            .into_response();
    }

    StatusCode::NO_CONTENT.into_response()
}

/// GET /api/stats
async fn get_stats(State(pool): State<SqlitePool>) -> impl IntoResponse {
    let rows = sqlx::query(
        "SELECT level, CAST(SUM(duration_s) AS INTEGER) as total_s \
         FROM sessions WHERE duration_s IS NOT NULL GROUP BY level",
    )
    .fetch_all(&pool)
    .await
    .expect("DB error");

    let mut b1_plus_s: f64 = 0.0;
    let mut b2_s: f64 = 0.0;

    for row in rows {
        let level: String = row.get("level");
        let total_s: i64 = row.try_get("total_s").unwrap_or(0);
        match level.as_str() {
            "B1_PLUS" => b1_plus_s = total_s as f64,
            "B2" => b2_s = total_s as f64,
            _ => {}
        }
    }

    let to_hours = |s: f64| -> f64 { (s / 3600.0 * 100.0).round() / 100.0 };

    Json(StatsResponse {
        b1_plus_hours: to_hours(b1_plus_s),
        b2_hours: to_hours(b2_s),
        total_hours: to_hours(b1_plus_s + b2_s),
        b1_plus_goal_hours: 200.0,
        b2_goal_hours: 320.0,
    })
    .into_response()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "./german_tracker.db".to_string());

    let connect_opts = SqliteConnectOptions::new()
        .filename(&db_url)
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_opts)
        .await?;

    // Run migrations automatically on startup
    sqlx::migrate!("./migrations").run(&pool).await?;

    tracing::info!("Database ready");

    let api_router = Router::new()
        .route("/api/sessions/start", post(start_session))
        .route("/api/sessions/stop/{id}", post(stop_session))
        .route("/api/sessions/{id}", delete(discard_session))
        .route("/api/stats", get(get_stats))
        .with_state(pool);

    // Serve the React build. Falls back to index.html for client-side routing.
    let frontend_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("frontend/dist");

    let serve_dir = ServeDir::new(&frontend_dir).not_found_service(
        tower_http::services::ServeFile::new(frontend_dir.join("index.html")),
    );

    let app = api_router
        .fallback_service(serve_dir)
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
