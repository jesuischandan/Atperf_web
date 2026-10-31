import { AlertTriangle, CheckCircle2, Loader2, PencilLine, XCircle } from 'lucide-react';
import type { Priority } from '../FluxTimeline';
import type { Decision } from './api';
import { DECISION_LABEL, PRIORITY_BADGE, PRIORITY_LABEL, type Lang } from './texts';

export interface TabProps {
    datasetId: string;
    lang: Lang;
    version: number;          // bumps after any change, so tabs reload
    onChanged: () => void;
}

export function ScoreBar({ value, priority }: { value: number; priority: Priority }) {
    return (
        <div className="flex items-center gap-2 min-w-[110px]">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${priority === 'HIGH' ? 'bg-amber-600' : priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-300'}`}
                    style={{ width: `${Math.min(100, value)}%` }} />
            </div>
            <span className="font-bold tabular-nums text-slate-900 w-7 text-right">{value}</span>
        </div>
    );
}

export function PriorityBadge({ priority, lang }: { priority: Priority; lang: Lang }) {
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[priority]}`}>{PRIORITY_LABEL[lang][priority]}</span>;
}

export function DecisionIcon({ decision, lang }: { decision: Decision | null; lang: Lang }) {
    if (!decision) return null;
    const title = `${DECISION_LABEL[lang][decision.decision]}${decision.actor_name ? ` — ${decision.actor_name}` : ''}`;
    const icon = decision.decision === 'validated' ? <CheckCircle2 size={14} className="text-emerald-600" />
        : decision.decision === 'rejected' ? <XCircle size={14} className="text-red-500" />
            : <PencilLine size={14} className="text-slate-500" />;
    return <span title={title} aria-label={title} className="inline-flex align-middle">{icon}</span>;
}

export function Loading() {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>;
}

export function ErrorBox({ message }: { message: string }) {
    return (
        <div className="mb-4 flex gap-2 items-start rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />{message}
        </div>
    );
}

export function Kpi({ value, label, sub, tone = 'plain' }: { value: string | number; label: string; sub?: string; tone?: 'plain' | 'red' | 'green' | 'yellow' | 'dark' }) {
    const cls = {
        plain: 'border-slate-200 bg-white text-slate-900',
        red: 'border-red-200 bg-red-50 text-red-700',
        green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        yellow: 'border-amber-200 bg-amber-50 text-amber-700',
        dark: 'border-slate-900 bg-slate-900 text-white',
    }[tone];
    return (
        <div className={`rounded-xl border p-4 ${cls}`}>
            <div className="text-2xl sm:text-3xl font-black tabular-nums">{value} {sub && <span className="text-sm font-semibold opacity-60">{sub}</span>}</div>
            <div className="text-sm font-medium opacity-80">{label}</div>
        </div>
    );
}
