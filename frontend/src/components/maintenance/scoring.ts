import demo from '../../data/strapMaintenanceDemo.json';

/* ─────────────────────────────────────────────────────────────
   STRAP Maintenance — demo scoring engine (front-end only)

   Runs entirely in the browser on the fictive dataset exported from
   STRAP_Maintenance_Prototype_Donnees_Fictives_1.xlsx. The 0–5 notes
   come from the dataset (MATRICE_SCORE); only the weights, thresholds
   and replay horizon are adjustable. Score = Σ (note / 5) × weight.
───────────────────────────────────────────────────────────── */

export const CRITERIA = ['criticality', 'recurrence', 'similarity', 'age', 'severity', 'context'] as const;
export type Criterion = typeof CRITERIA[number];
export type Weights = Record<Criterion, number>;
export type Notes = Record<Criterion, number>;
export type Flux = 'ROUGE' | 'VERT' | 'JAUNE';
export type PriorityClass = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Equipment {
    id: string;
    name: string;
    tag: string;
    subsystem: string;
    criticality: string;
    criticalityNote: number;
}

export interface Notice {
    id: string;
    date: string;
    equipmentId: string;
    flux: Flux;
    category: string;
    symptom: string;
    description: string;
    status: string;
    postponements: number;
    issuer: string;
    notes?: Notes;
}

export interface WorkOrder {
    id: string;
    date: string;
    equipmentId: string;
    flux: Flux;
    type: string;
    symptom: string;
    cause: string;
    downtimeHours: number;
    status: string;
    linkedNotice: string | null;
    testNote: string;
}

export interface Link {
    id: string;
    noticeId: string;
    workOrderId: string;
    delayDays: number;
    match: string;
    reason: string;
    expertStatus: string;
}

export interface Thresholds {
    high: number;
    medium: number;
}

export const DATA = demo as unknown as {
    source: string;
    weights: Weights;
    thresholds: Thresholds;
    equipments: Equipment[];
    notices: Notice[];
    workOrders: WorkOrder[];
    links: Link[];
};

export const DEFAULT_WEIGHTS: Weights = { ...DATA.weights };
export const DEFAULT_THRESHOLDS: Thresholds = { ...DATA.thresholds };

export const equipmentById = new Map(DATA.equipments.map(e => [e.id, e]));
export const yellowNotices = DATA.notices.filter(n => n.flux === 'JAUNE' && n.notes);
export const redWorkOrders = DATA.workOrders.filter(o => o.flux === 'ROUGE');

const DAY = 86_400_000;
export const daysBetween = (from: string, to: string) =>
    Math.round((Date.parse(to) - Date.parse(from)) / DAY);

export const weightsTotal = (w: Weights) => CRITERIA.reduce((s, c) => s + w[c], 0);

export function score(notes: Notes, w: Weights): number {
    return Math.round(CRITERIA.reduce((s, c) => s + (notes[c] / 5) * w[c], 0));
}

/** Points contributed by each criterion, for the explainable breakdown. */
export function breakdown(notes: Notes, w: Weights): Record<Criterion, number> {
    return Object.fromEntries(CRITERIA.map(c => [c, (notes[c] / 5) * w[c]])) as Record<Criterion, number>;
}

export function classify(s: number, t: Thresholds): PriorityClass {
    if (s >= t.high) return 'HIGH';
    if (s >= t.medium) return 'MEDIUM';
    return 'LOW';
}

/** Criteria with a note ≥ 4 — the drivers shown as justification. */
export function drivers(notes: Notes): Criterion[] {
    return CRITERIA.filter(c => notes[c] >= 4).sort((a, b) => notes[b] - notes[a]);
}

export interface ScoredNotice extends Notice {
    notes: Notes;
    score: number;
    priority: PriorityClass;
}

export function scoreAll(w: Weights, t: Thresholds): ScoredNotice[] {
    return yellowNotices
        .map(n => {
            const s = score(n.notes!, w);
            return { ...n, notes: n.notes!, score: s, priority: classify(s, t) };
        })
        .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
}

const sameSubsystem = (a: string, b: string) => {
    const sa = equipmentById.get(a)?.subsystem, sb = equipmentById.get(b)?.subsystem;
    return !!sa && sa === sb;
};

/* ── Replay: a red failure and the yellow notices that preceded it ── */

export interface Precursor {
    notice: ScoredNotice;
    leadDays: number;
    linkStatus: string | null; // expert status from the dataset, or null for an automatic candidate
    sameEquipment: boolean;
    sameSubsystem: boolean;    // other asset of the same sub-assembly (weaker candidate)
    flagged: boolean;
}

/**
 * Yellow notices created before the failure: every one on the same equipment
 * or on another asset of the same sub-assembly within the horizon (automatic
 * candidates), plus any link recorded in the dataset (including deliberately
 * wrong ones, kept for expert rejection). Chronological proximity only — never
 * presented as causality.
 */
export function precursors(ot: WorkOrder, scored: ScoredNotice[], horizonDays: number, t: Thresholds): Precursor[] {
    const byId = new Map(scored.map(n => [n.id, n]));
    const out = new Map<string, Precursor>();

    for (const n of scored) {
        const lead = daysBetween(n.date, ot.date);
        if (!(lead > 0 && lead <= horizonDays)) continue;
        if (n.equipmentId === ot.equipmentId) {
            out.set(n.id, { notice: n, leadDays: lead, linkStatus: null, sameEquipment: true, sameSubsystem: true, flagged: n.score >= t.high });
        } else if (sameSubsystem(n.equipmentId, ot.equipmentId)) {
            out.set(n.id, { notice: n, leadDays: lead, linkStatus: null, sameEquipment: false, sameSubsystem: true, flagged: n.score >= t.high });
        }
    }
    for (const l of DATA.links.filter(l => l.workOrderId === ot.id)) {
        const n = byId.get(l.noticeId);
        if (!n) continue;
        const lead = daysBetween(n.date, ot.date);
        if (lead <= 0) continue; // a notice raised after the failure can never be a precursor
        out.set(n.id, {
            notice: n,
            leadDays: lead,
            linkStatus: l.expertStatus,
            sameEquipment: n.equipmentId === ot.equipmentId,
            sameSubsystem: sameSubsystem(n.equipmentId, ot.equipmentId),
            flagged: n.score >= t.high,
        });
    }
    return [...out.values()].sort((a, b) => b.leadDays - a.leadDays);
}

/* ── Backtest metrics over the whole dataset ── */

export interface Metrics {
    reds: number;
    covered: number;        // reds with a same-equipment yellow ≥ threshold within the horizon before
    alerts: number;         // yellows ≥ threshold
    falseAlerts: number;    // alerts with no red on the same equipment within the horizon after
    noPrecursor: number;    // reds with no yellow at all on the same equipment within the horizon
    medianLeadDays: number | null;
}

export function metrics(scored: ScoredNotice[], horizonDays: number, threshold: number): Metrics {
    const leads: number[] = [];
    let covered = 0;
    let noPrecursor = 0;

    for (const ot of redWorkOrders) {
        const before = scored.filter(n => {
            const lead = daysBetween(n.date, ot.date);
            return n.equipmentId === ot.equipmentId && lead > 0 && lead <= horizonDays;
        });
        if (before.length === 0) noPrecursor++;
        const flagged = before.filter(n => n.score >= threshold);
        if (flagged.length) {
            covered++;
            leads.push(Math.max(...flagged.map(n => daysBetween(n.date, ot.date))));
        }
    }

    const alerts = scored.filter(n => n.score >= threshold);
    const falseAlerts = alerts.filter(n => !redWorkOrders.some(ot => {
        const lead = daysBetween(n.date, ot.date);
        return ot.equipmentId === n.equipmentId && lead > 0 && lead <= horizonDays;
    })).length;

    leads.sort((a, b) => a - b);
    const medianLeadDays = leads.length ? leads[Math.floor(leads.length / 2)] : null;

    return { reds: redWorkOrders.length, covered, alerts: alerts.length, falseAlerts, noPrecursor, medianLeadDays };
}

/* ── Demonstrator KPIs (illustrative dataset) ── */

/** Reference date of the demonstrator: the last event in the dataset. */
export const STUDY_DATE = [...DATA.notices.map(n => n.date), ...DATA.workOrders.map(o => o.date)].sort().at(-1)!;

export const isClosed = (n: Notice) => n.status === 'Clôturé';

export interface AgeBand { label: string; min: number; max: number; count: number }

export function backlog(scored: ScoredNotice[]) {
    const open = scored.filter(n => !isClosed(n)).map(n => ({ ...n, ageDays: daysBetween(n.date, STUDY_DATE) }));
    const bands: AgeBand[] = [
        { label: '0–30', min: 0, max: 30, count: 0 },
        { label: '31–90', min: 31, max: 90, count: 0 },
        { label: '91–180', min: 91, max: 180, count: 0 },
        { label: '> 180', min: 181, max: Infinity, count: 0 },
    ];
    for (const n of open) bands.find(b => n.ageDays >= b.min && n.ageDays <= b.max)!.count++;
    const meanAge = open.length ? Math.round(open.reduce((s, n) => s + n.ageDays, 0) / open.length) : null;
    return { open, bands, meanAge };
}

/**
 * Share of yellow notices followed by a red breakdown on the same asset within
 * `windowDays`. Only notices whose whole window is observed (date + window ≤
 * study date) are counted, so recent notices do not dilute the rate.
 */
export function followedByRed(windowDays: number) {
    const observed = yellowNotices.filter(n => daysBetween(n.date, STUDY_DATE) >= windowDays);
    const followed = observed.filter(n => redWorkOrders.some(o => {
        const d = daysBetween(n.date, o.date);
        return o.equipmentId === n.equipmentId && d > 0 && d <= windowDays;
    }));
    return { observed: observed.length, followed: followed.length, rate: observed.length ? followed.length / observed.length : null };
}

export function treatment() {
    const closed = yellowNotices.filter(isClosed).length;
    return { closed, total: yellowNotices.length, rate: yellowNotices.length ? closed / yellowNotices.length : null };
}

export interface Reliability {
    equipment: Equipment;
    breakdowns: number;
    downtimeHours: number;
    mttrHours: number | null;   // mean recorded downtime per breakdown (approximation of repair time)
    mtbfDays: number | null;    // mean calendar days between successive breakdowns (needs ≥ 2)
}

export function reliability(): Reliability[] {
    return DATA.equipments.map(e => {
        const reds = redWorkOrders.filter(o => o.equipmentId === e.id).sort((a, b) => a.date.localeCompare(b.date));
        const downtime = reds.reduce((s, o) => s + (o.downtimeHours || 0), 0);
        const gaps = reds.slice(1).map((o, i) => daysBetween(reds[i].date, o.date));
        return {
            equipment: e,
            breakdowns: reds.length,
            downtimeHours: downtime,
            mttrHours: reds.length ? Math.round((downtime / reds.length) * 10) / 10 : null,
            mtbfDays: gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : null,
        };
    }).sort((a, b) => (a.mtbfDays ?? Infinity) - (b.mtbfDays ?? Infinity) || b.breakdowns - a.breakdowns);
}
