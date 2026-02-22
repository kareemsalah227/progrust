import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Level } from '../api';

type Phase = 'idle' | 'choosing-level' | 'running' | 'confirming';

export function SessionTracker() {
    const queryClient = useQueryClient();
    const [phase, setPhase] = useState<Phase>('idle');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [durationMinutes, setDurationMinutes] = useState<number>(0);
    const [chosenLevel, setChosenLevel] = useState<Level | null>(null);

    const startMutation = useMutation({
        mutationFn: (level: Level) => api.startSession(level),
        onSuccess: (data) => {
            setSessionId(data.session_id);
            setPhase('running');
        },
    });

    const stopMutation = useMutation({
        mutationFn: () => api.stopSession(sessionId!),
        onSuccess: (data) => {
            setDurationMinutes(data.duration_minutes);
            setPhase('confirming');
        },
    });

    const confirmMutation = useMutation({
        mutationFn: () => Promise.resolve(), // session is already saved — nothing to do
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            reset();
        },
    });

    const discardMutation = useMutation({
        mutationFn: () => api.discardSession(sessionId!),
        onSuccess: () => {
            reset();
        },
    });

    function reset() {
        setPhase('idle');
        setSessionId(null);
        setDurationMinutes(0);
        setChosenLevel(null);
    }

    function handleLevelSelect(level: Level) {
        setChosenLevel(level);
        startMutation.mutate(level);
    }

    // ---- UI ----

    if (phase === 'idle') {
        return (
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={() => setPhase('choosing-level')}
                    style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 140,
                        height: 140,
                        fontSize: 18,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 0 40px rgba(108,138,255,0.35)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        letterSpacing: '0.05em',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(108,138,255,0.5)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(108,138,255,0.35)';
                    }}
                >
                    START
                </button>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tap to begin a study session</p>
            </div>
        );
    }

    if (phase === 'choosing-level') {
        return (
            <div className="flex flex-col items-center gap-6">
                <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Which level are you studying?</p>
                <div className="flex gap-4">
                    {(['B1_PLUS', 'B2'] as Level[]).map(level => (
                        <button
                            key={level}
                            onClick={() => handleLevelSelect(level)}
                            disabled={startMutation.isPending}
                            style={{
                                background: 'var(--surface-2)',
                                border: '2px solid var(--border)',
                                borderRadius: 16,
                                color: 'var(--text)',
                                padding: '20px 36px',
                                fontSize: 18,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'border-color 0.15s, background 0.15s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                                (e.currentTarget as HTMLElement).style.background = 'var(--accent-muted)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                                (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                            }}
                        >
                            {level === 'B1_PLUS' ? 'B1+' : 'B2'}
                        </button>
                    ))}
                </div>
                <button
                    onClick={reset}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
                >
                    Cancel
                </button>
            </div>
        );
    }

    if (phase === 'running') {
        return (
            <div className="flex flex-col items-center gap-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{
                        background: 'var(--success)',
                        borderRadius: 999,
                        width: 10,
                        height: 10,
                        display: 'inline-block',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 15 }}>
                        Session running · {chosenLevel === 'B1_PLUS' ? 'B1+' : 'B2'}
                    </span>
                </div>
                <button
                    onClick={() => stopMutation.mutate()}
                    disabled={stopMutation.isPending}
                    style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 140,
                        height: 140,
                        fontSize: 18,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 0 40px rgba(239,68,68,0.35)',
                        transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                >
                    STOP
                </button>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tap when you're done studying</p>
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </div>
        );
    }

    if (phase === 'confirming') {
        const mins = durationMinutes;
        const label = mins < 1
            ? 'less than a minute'
            : mins === 1
                ? 'about 1 minute'
                : `about ${mins} minutes`;

        return (
            <div className="flex flex-col items-center gap-6" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>
                    You studied {label}.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Do you want to log this session?</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => confirmMutation.mutate()}
                        disabled={confirmMutation.isPending}
                        style={{
                            background: 'var(--success)',
                            color: '#0f1117',
                            border: 'none',
                            borderRadius: 12,
                            padding: '14px 36px',
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        ✓ Log it
                    </button>
                    <button
                        onClick={() => discardMutation.mutate()}
                        disabled={discardMutation.isPending}
                        style={{
                            background: 'var(--surface-2)',
                            color: 'var(--text-muted)',
                            border: '2px solid var(--border)',
                            borderRadius: 12,
                            padding: '14px 36px',
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Discard
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
