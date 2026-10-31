import API_URL from '../../../utils/apiUrl';
import type { Priority } from '../FluxTimeline';

/* ─────────────────────────────────────────────────────────────
   STRAP Maintenance API client (session cookie sent by apiClient)
───────────────────────────────────────────────────────────── */

export const CRITERIA = ['criticality', 'recurrence', 'similarity', 'age', 'severity', 'context'] as const;
export type Criterion = typeof CRITERIA[number];
export type Notes = Record<Criterion, number>;

export interface Dataset {
    id: string;
    name: string;
    company_id: string | null;
    company_name: string | null;
    source_filename: string | null;
    weights: Record<Criterion, number>;
    thresholds: { high: number; medium: number };
    windows: Record<string, number>;
    import_report: ImportReport | null;
    created_by_name: string | null;
    created_at: string | null;
    counts: ImportReport['counts'] | null;
    study_date?: string;
    can_delete?: boolean;
}

export interface ImportReport {
    counts: { equipments: number; notices: number; work_orders: number; links: number; flux: Record<string, number> };
    issues: { table: string; row: number; code: string | null; issue: string }[];
    issue_count: number;
}

export interface Decision {
    id: number;
    target_type: 'notice' | 'link' | 'config';
    target: string;
    decision: 'validated' | 'rejected' | 'corrected' | 'updated';
    comment: string | null;
    changes: Record<string, unknown> | null;
    score_snapshot: number | null;
    actor_name: string | null;
    created_at: string | null;
}

export interface EquipmentInfo {
    code: string; name: string; tag: string; subsystem: string; criticality: string; criticality_note: number;
}

export interface Overview {
    study_date: string;
    flux: Record<'ROUGE' | 'VERT' | 'JAUNE', { notices: number; work_orders: number }>;
    priorities: Record<Priority, number>;
    open_high: number;
    decisions: number;
    equipments: EquipmentInfo[];
    events: {
        kind: 'notice' | 'work_order'; code: string; date: string; equipment: string; flux: 'ROUGE' | 'VERT' | 'JAUNE';
        symptom: string; score?: number | null; priority?: Priority | null; downtime_hours?: number | null;
    }[];
}

export interface NoticeRow {
    rank: number; code: string; date: string; equipment: string; equipment_tag: string; equipment_name: string;
    symptom: string; category: string; status: string; closed: boolean; postponements: number;
    score: number; priority: Priority; notes: Notes; overridden: Criterion[]; drivers: Criterion[]; decision: Decision | null;
}

export interface Evidence { note: number; reason: string; detail: Record<string, unknown>; overridden: boolean }

export interface LinkRow {
    notice: string; work_order: string; lead_days: number | null; confidence: 'strong' | 'medium' | 'weak' | null;
    same_equipment: boolean; shared_families: string[]; source: 'engine' | 'import'; imported_status?: string | null;
    decision: Decision | null;
}

export interface WoLite { code: string; date: string; symptom: string; cause: string; downtime_hours: number | null }

export interface NoticeDetail {
    as_of: string;
    notice: {
        code: string; date: string; equipment: EquipmentInfo; symptom: string; description: string; category: string;
        status: string; postponements: number; issuer: string; context_note: number | null;
        overrides: Partial<Record<Criterion, number>> | null; families: string[];
    };
    score: number; priority: Priority; notes: Notes; points: Notes; weights: Notes;
    evidence: Record<Criterion, Evidence>;
    prior_reds: WoLite[]; later_reds: WoLite[]; links: LinkRow[]; checks: string[]; history: Decision[];
}

export interface ReplayRow {
    notice: string; work_order: string; lead_days: number; confidence: 'strong' | 'medium' | 'weak'; same_equipment: boolean;
    shared_families: string[]; score_at_creation: number; score_before_failure: number; priority_before_failure: Priority;
    flagged_on: string | null; flag_lead_days: number | null; date: string; symptom: string; equipment_tag: string;
    imported_status: string | null; decision: Decision | null;
}

export interface Replay {
    work_order: WoLite & { type: string; equipment: EquipmentInfo };
    threshold: number;
    verdict: 'flagged' | 'below_threshold' | 'no_precursor';
    best_lead_days: number | null;
    precursors: ReplayRow[];
}

export interface Backtest {
    threshold: number; horizon_days: number; as_of: string; reds: number; covered: number; coverage: number | null;
    alerts: number; false_alerts: number; false_alert_rate: number | null; no_precursor: number; median_lead_days: number | null;
    per_red: { work_order: string; covered: boolean; lead_days: number | null; precursors: number }[];
    false_alert_list: { notice: string; flagged_on: string; score: number }[];
}

export interface ImportPreview {
    token: string;
    files: string[];
    sources: { index: number; name: string; columns: string[]; rows: number; sample: Record<string, string | null>[] }[];
    tables: Record<ImportTable, { source: number | null; mapping: Record<string, string | null>; fields: { name: string; required: boolean }[] }>;
}
export type ImportTable = 'equipments' | 'notices' | 'work_orders' | 'links';

const BASE = `${API_URL}/api/maintenance`;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, init);
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Error ${res.status}`);
    return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

export const api = {
    datasets: () => call<Dataset[]>('/datasets'),
    companies: () => call<{ company_id: string; company_name: string }[]>('/companies'),
    dataset: (id: string) => call<Dataset>(`/datasets/${id}`),
    deleteDataset: (id: string) => call<void>(`/datasets/${id}`, { method: 'DELETE' }),
    loadSample: (company_id: string | null) => call<{ id: string; report: ImportReport }>('/datasets/sample', json('POST', { company_id })),
    preview: (files: File[]) => {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        return call<ImportPreview>('/import/preview', { method: 'POST', body: fd });
    },
    commit: (body: { token: string; name: string; company_id: string | null; tables: Record<string, { source: number | null; mapping: Record<string, string | null> }> }) =>
        call<{ id: string; report: ImportReport }>('/import/commit', json('POST', body)),
    overview: (id: string) => call<Overview>(`/datasets/${id}/overview`),
    notices: (id: string) => call<{ as_of: string; thresholds: { high: number; medium: number }; notices: NoticeRow[] }>(`/datasets/${id}/notices`),
    notice: (id: string, code: string, lang: string) => call<NoticeDetail>(`/datasets/${id}/notices/${encodeURIComponent(code)}?lang=${lang}`),
    updateNotes: (id: string, code: string, body: { overrides: Partial<Record<Criterion, number | null>>; context_note?: number | null; clear_context?: boolean; comment?: string }) =>
        call<{ score: number }>(`/datasets/${id}/notices/${encodeURIComponent(code)}/notes`, json('PUT', body)),
    decide: (id: string, body: { target_type: 'notice' | 'link'; target: string; decision: 'validated' | 'rejected'; comment?: string }) =>
        call<Decision>(`/datasets/${id}/decisions`, json('POST', body)),
    decisions: (id: string) => call<Decision[]>(`/datasets/${id}/decisions`),
    replayIndex: (id: string) => call<{ code: string; date: string; equipment: string; symptom: string; candidates: number }[]>(`/datasets/${id}/replay`),
    replay: (id: string, wo: string, threshold: number) => call<Replay>(`/datasets/${id}/replay/${encodeURIComponent(wo)}?threshold=${threshold}`),
    backtest: (id: string, threshold: number, horizon: number) => call<Backtest>(`/datasets/${id}/backtest?threshold=${threshold}&horizon=${horizon}`),
    saveConfig: (id: string, body: { weights: Record<string, number>; thresholds: Record<string, number>; windows: Record<string, number>; comment?: string }) =>
        call<{ weights: Record<Criterion, number>; thresholds: { high: number; medium: number }; windows: Record<string, number> }>(`/datasets/${id}/config`, json('PUT', body)),
    exportUrl: (id: string) => `${BASE}/datasets/${id}/export.xlsx`,
};
