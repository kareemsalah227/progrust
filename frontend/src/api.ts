// Typed API client for the German Tracker backend

const BASE = '/api';

export type Level = 'B1_PLUS' | 'B2';

export interface StartSessionResponse {
    session_id: string;
}

export interface StopSessionResponse {
    duration_minutes: number;
}

export interface StatsResponse {
    b1_plus_hours: number;
    b2_hours: number;
    total_hours: number;
    b1_plus_goal_hours: number;
    b2_goal_hours: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`API ${path} failed (${res.status}): ${body}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export const api = {
    startSession: (level: Level) =>
        request<StartSessionResponse>('/sessions/start', {
            method: 'POST',
            body: JSON.stringify({ level }),
        }),

    stopSession: (sessionId: string) =>
        request<StopSessionResponse>(`/sessions/stop/${sessionId}`, {
            method: 'POST',
        }),

    discardSession: (sessionId: string) =>
        request<void>(`/sessions/${sessionId}`, { method: 'DELETE' }),

    getStats: () => request<StatsResponse>('/stats'),
};
