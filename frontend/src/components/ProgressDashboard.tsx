import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
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
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                fontSize: 12,
                color: 'var(--text-muted)',
            }}>
                <span>{pct.toFixed(1)}% complete</span>
                {remaining > 0 ? (
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                        {remaining.toFixed(1)}h remaining
                    </span>
                ) : (
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>Goal reached! 🎉</span>
                )}
            </div>
        </div>
    );
}

interface DailyChartProps {
    title: string;
    data: { date: string; hours: number }[];
    color: string;
}

function DailyChart({ title, data, color }: DailyChartProps) {
    if (data.length === 0) {
        return (
            <div style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--surface-2)',
                borderRadius: 12,
                marginBottom: 32,
                color: 'var(--text-muted)',
                fontSize: 14,
            }}>
                No data for {title} yet.
            </div>
        );
    }

    return (
        <div style={{ marginBottom: 32 }}>
            <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 16,
            }}>
                {title}
            </h3>
            <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(str) => str.split('-').slice(1).join('/')} // Format MM/DD
                        />
                        <YAxis
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            unit="h"
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            cursor={{ fill: 'var(--surface-2)' }}
                        />
                        <Bar
                            dataKey="hours"
                            fill={color}
                            radius={[4, 4, 0, 0]}
                            animationDuration={1000}
                        />
                    </BarChart>
                </ResponsiveContainer>
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
                Cumulative Progress
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

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '32px 0' }} />

                    <h2 style={{
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        marginBottom: 24,
                    }}>
                        Daily Activity
                    </h2>

                    <DailyChart
                        title="Daily B1+ Activity"
                        data={stats.daily_b1_plus}
                        color="#6c8aff"
                    />

                    <DailyChart
                        title="Daily B2 Activity"
                        data={stats.daily_b2}
                        color="#a78bfa"
                    />
                </>
            )}
        </div>
    );
}
