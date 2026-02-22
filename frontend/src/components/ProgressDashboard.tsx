import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { StatsResponse } from '../api';

interface ProgressBarProps {
    label: string;
    hours: number;
    goalHours: number;
    color: string;
}

function ProgressBar({ label, hours, goalHours, color }: ProgressBarProps) {
    const pct = Math.min((hours / goalHours) * 100, 100);
    const remaining = Math.max(goalHours - hours, 0);

    return (
        <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{label}</span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{hours.toFixed(1)}h</span>
                    {' / '}
                    {goalHours}h
                    {remaining > 0 && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                            ({remaining.toFixed(1)}h left)
                        </span>
                    )}
                </span>
            </div>
            <div style={{
                height: 14,
                borderRadius: 999,
                background: 'var(--surface-2)',
                overflow: 'hidden',
            }}>
                <div
                    style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 999,
                        background: color,
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 0 12px ${color}88`,
                    }}
                />
            </div>
            <div style={{ marginTop: 6, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                {pct.toFixed(1)}% complete
            </div>
        </div>
    );
}

function StatsPlaceholder() {
    return (
        <div style={{ opacity: 0.4 }}>
            {[
                { label: 'B1+ Progress', goal: 200 },
                { label: 'B2 Progress', goal: 320 },
                { label: 'Combined Total', goal: 520 },
            ].map(({ label, goal }) => (
                <div key={label} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{label}</span>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>0.0h / {goal}h</span>
                    </div>
                    <div style={{ height: 14, borderRadius: 999, background: 'var(--surface-2)' }} />
                </div>
            ))}
        </div>
    );
}

export function ProgressDashboard() {
    const {
        data: stats,
        isLoading,
        isError,
    } = useQuery<StatsResponse>({
        queryKey: ['stats'],
        queryFn: api.getStats,
        refetchInterval: 30_000,
    });

    return (
        <div>
            <h2 style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 24,
            }}>
                Progress
            </h2>

            {isLoading && <StatsPlaceholder />}
            {isError && (
                <p style={{ color: '#f87171', fontSize: 14 }}>
                    Could not load stats. Is the backend running?
                </p>
            )}
            {stats && (
                <>
                    <ProgressBar
                        label="B1+ Completion"
                        hours={stats.b1_plus_hours}
                        goalHours={stats.b1_plus_goal_hours}
                        color="#6c8aff"
                    />
                    <ProgressBar
                        label="B2 Completion"
                        hours={stats.b2_hours}
                        goalHours={stats.b2_goal_hours}
                        color="#a78bfa"
                    />
                    <ProgressBar
                        label="Combined Total"
                        hours={stats.total_hours}
                        goalHours={stats.b1_plus_goal_hours + stats.b2_goal_hours}
                        color="#4ade80"
                    />
                </>
            )}
        </div>
    );
}
