import { STUDY_DATE, scoreAll, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, isClosed } from '../scoring';

/* ─────────────────────────────────────────────────────────────
   Demonstrator: action ownership and follow-up.
   Kept in the visitor's browser only (nothing is sent anywhere).
───────────────────────────────────────────────────────────── */

export const OWNERS = ['maintenance_manager', 'reliability', 'production_lead', 'methods', 'stores'] as const;
export type Owner = typeof OWNERS[number];

export const STATUSES = ['to_review', 'planned', 'in_progress', 'done', 'not_retained'] as const;
export type ActionStatus = typeof STATUSES[number];

export interface DemoAction {
    noticeId: string;
    action: string;
    owner: Owner;
    due: string;          // YYYY-MM-DD
    status: ActionStatus;
    comment: string;
    updatedAt: string;
    example?: boolean;    // pre-filled illustration
}

export const OWNER_LABEL: Record<'fr' | 'en', Record<Owner, string>> = {
    fr: { maintenance_manager: 'Responsable Maintenance', reliability: 'Technicien fiabilité', production_lead: 'Chef d’équipe Production', methods: 'Méthodes', stores: 'Magasin / Achats' },
    en: { maintenance_manager: 'Maintenance manager', reliability: 'Reliability technician', production_lead: 'Production team leader', methods: 'Methods', stores: 'Stores / Purchasing' },
};

export const STATUS_LABEL: Record<'fr' | 'en', Record<ActionStatus, string>> = {
    fr: { to_review: 'À examiner', planned: 'Planifiée', in_progress: 'En cours', done: 'Réalisée', not_retained: 'Non retenue' },
    en: { to_review: 'To review', planned: 'Planned', in_progress: 'In progress', done: 'Done', not_retained: 'Not retained' },
};

export const STATUS_STYLE: Record<ActionStatus, string> = {
    to_review: 'bg-slate-100 text-slate-700',
    planned: 'bg-sky-100 text-sky-800',
    in_progress: 'bg-amber-100 text-amber-800',
    done: 'bg-emerald-100 text-emerald-800',
    not_retained: 'bg-slate-100 text-slate-400 line-through',
};

export const isOpenAction = (a: DemoAction) => a.status === 'to_review' || a.status === 'planned' || a.status === 'in_progress';
/** Overdue against the demonstrator's reference date (the study date of the illustrative dataset). */
export const isOverdue = (a: DemoAction) => isOpenAction(a) && !!a.due && a.due < STUDY_DATE;

const KEY = 'strap_demo_actions_v1';
const shift = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);

/** A few pre-filled actions so the follow-up view is not empty on first visit. */
function examples(): Record<string, DemoAction> {
    const top = scoreAll(DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS).filter(n => !isClosed(n)).slice(0, 4);
    const plan: [Owner, ActionStatus, number][] = [
        ['maintenance_manager', 'in_progress', 7], ['reliability', 'planned', 14], ['production_lead', 'to_review', -5], ['methods', 'done', -10],
    ];
    return Object.fromEntries(top.map((n, i) => {
        const [owner, status, offset] = plan[i];
        return [n.id, { noticeId: n.id, action: '', owner, status, due: shift(STUDY_DATE, offset), comment: '', updatedAt: STUDY_DATE, example: true }];
    }));
}

export function loadActions(): Record<string, DemoAction> {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* storage unavailable or corrupted: fall back to examples */ }
    return examples();
}

export function saveActions(actions: Record<string, DemoAction>) {
    try { localStorage.setItem(KEY, JSON.stringify(actions)); } catch { /* storage unavailable: keep in memory */ }
}

export function resetActions(): Record<string, DemoAction> {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    return examples();
}
