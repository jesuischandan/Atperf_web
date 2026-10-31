import type { Criterion, Evidence } from './api';
import type { Priority } from '../FluxTimeline';

/* ─────────────────────────────────────────────────────────────
   Cockpit wording (FR / EN) and human-readable score explanations
───────────────────────────────────────────────────────────── */

export type Lang = 'en' | 'fr';

export const CRITERION_LABEL: Record<Lang, Record<Criterion, string>> = {
    fr: { criticality: 'Criticité équipement', recurrence: 'Récurrence des anomalies', similarity: 'Similarité historique', age: 'Ancienneté / reports', severity: 'Gravité des symptômes', context: 'Contexte aggravant' },
    en: { criticality: 'Asset criticality', recurrence: 'Anomaly recurrence', similarity: 'Similarity to past failures', age: 'Age / postponements', severity: 'Symptom severity', context: 'Aggravating context' },
};

export const PRIORITY_LABEL: Record<Lang, Record<Priority, string>> = {
    fr: { HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse' },
    en: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' },
};

export const PRIORITY_BADGE: Record<Priority, string> = {
    HIGH: 'bg-amber-600 text-white',
    MEDIUM: 'bg-amber-200 text-amber-900',
    LOW: 'bg-slate-100 text-slate-600',
};

const FAMILY: Record<Lang, Record<string, string>> = {
    fr: { sealing: 'étanchéité / fuite', pressure: 'pression', vibration: 'vibration / roulements', mechanical: 'mécanique / transmission', thermal: 'thermique', electrical: 'électrique / instrumentation', flow: 'débit / colmatage' },
    en: { sealing: 'sealing / leak', pressure: 'pressure', vibration: 'vibration / bearings', mechanical: 'mechanical / transmission', thermal: 'thermal', electrical: 'electrical / instrumentation', flow: 'flow / clogging' },
};

export const families = (list: unknown, lang: Lang) =>
    (Array.isArray(list) ? list : []).map(f => FAMILY[lang][f as string] ?? f).join(', ');

export const CONFIDENCE: Record<Lang, Record<string, string>> = {
    fr: { strong: 'Forte — même équipement, même famille', medium: 'Moyenne — même équipement', weak: 'Faible — même sous-ensemble, même famille' },
    en: { strong: 'Strong — same asset, same family', medium: 'Medium — same asset', weak: 'Weak — same sub-assembly, same family' },
};

export const DECISION_LABEL: Record<Lang, Record<string, string>> = {
    fr: { validated: 'Validé', rejected: 'Rejeté', corrected: 'Corrigé', updated: 'Paramètres modifiés' },
    en: { validated: 'Validated', rejected: 'Rejected', corrected: 'Corrected', updated: 'Parameters changed' },
};

export const ISSUE_LABEL: Record<Lang, Record<string, string>> = {
    fr: { missing_code: 'identifiant manquant (ligne ignorée)', duplicate_code: 'identifiant en double (ligne ignorée)', missing_or_invalid_date: 'date manquante ou invalide (ligne ignorée)', missing_equipment: 'équipement manquant (ligne ignorée)', unknown_equipment_created: 'équipement absent du référentiel (créé, criticité par défaut 3/5)', undefined_flux: 'flux non déterminé (ligne ignorée)', unknown_notice_or_work_order: 'rapprochement vers un Avis ou OT inconnu (ignoré)' },
    en: { missing_code: 'missing identifier (row skipped)', duplicate_code: 'duplicate identifier (row skipped)', missing_or_invalid_date: 'missing or invalid date (row skipped)', missing_equipment: 'missing asset (row skipped)', unknown_equipment_created: 'asset not in the reference list (created, default criticality 3/5)', undefined_flux: 'flow could not be determined (row skipped)', unknown_notice_or_work_order: 'match to an unknown notification or WO (ignored)' },
};

export const TABLE_LABEL: Record<Lang, Record<string, string>> = {
    fr: { equipments: 'Équipements', notices: 'Avis', work_orders: 'OT (ordres de travail)', links: 'Rapprochements (optionnel)' },
    en: { equipments: 'Assets', notices: 'Notifications', work_orders: 'Work orders', links: 'Matches (optional)' },
};

export const FIELD_LABEL: Record<Lang, Record<string, string>> = {
    fr: { code: 'Identifiant', name: 'Nom', tag: 'Repère', subsystem: 'Sous-ensemble', criticality_label: 'Criticité', criticality_note: 'Note de criticité 0–5', date: 'Date', equipment: 'Équipement', flux: 'Flux (rouge / vert / jaune)', category: 'Catégorie', symptom: 'Symptôme', description: 'Description', status: 'Statut', postponements: 'Nombre de reports', issuer: 'Émetteur', context_note: 'Note de contexte 0–5', type: 'Type', cause: 'Cause', downtime_hours: 'Durée d’arrêt (h)', linked_notice: 'Avis lié', notice: 'Avis jaune', work_order: 'OT rouge', expert_status: 'Statut d’expertise' },
    en: { code: 'Identifier', name: 'Name', tag: 'Tag', subsystem: 'Sub-assembly', criticality_label: 'Criticality', criticality_note: 'Criticality score 0–5', date: 'Date', equipment: 'Asset', flux: 'Flow (red / green / yellow)', category: 'Category', symptom: 'Symptom', description: 'Description', status: 'Status', postponements: 'Postponements', issuer: 'Reported by', context_note: 'Context score 0–5', type: 'Type', cause: 'Cause', downtime_hours: 'Downtime (h)', linked_notice: 'Linked notification', notice: 'Yellow notification', work_order: 'Red WO', expert_status: 'Expert status' },
};

/** Plain-language explanation of one criterion's note. */
export function explain(ev: Evidence, lang: Lang): string {
    const d = ev.detail as Record<string, any>;
    const fr = lang === 'fr';
    switch (ev.reason) {
        case 'equipment_criticality':
            return fr ? `Équipement ${d.equipment}${d.label ? ` — criticité « ${d.label} »` : ' — criticité non renseignée (3/5 par défaut)'}`
                : `Asset ${d.equipment}${d.label ? ` — criticality "${d.label}"` : ' — criticality not provided (default 3/5)'}`;
        case 'prior_notices':
            return fr ? `${d.count} Avis jaune(s) antérieur(s) sur le même équipement dans les ${d.days} jours précédents`
                : `${d.count} earlier yellow notification(s) on the same asset in the previous ${d.days} days`;
        case 'same_asset_same_family':
            return fr ? `Panne ${d.work_order} du ${d.date} sur le même équipement, même famille de symptômes (${families(d.families, lang)})`
                : `Breakdown ${d.work_order} on ${d.date} on the same asset, same symptom family (${families(d.families, lang)})`;
        case 'same_asset_other_family':
            return fr ? `Panne ${d.work_order} du ${d.date} sur le même équipement (autre famille de symptômes)`
                : `Breakdown ${d.work_order} on ${d.date} on the same asset (different symptom family)`;
        case 'same_subsystem_same_family':
            return fr ? `Panne ${d.work_order} du ${d.date} sur ${d.equipment} (même sous-ensemble, même famille)`
                : `Breakdown ${d.work_order} on ${d.date} on ${d.equipment} (same sub-assembly, same family)`;
        case 'none':
            return fr ? `Aucune panne comparable dans les ${d.days} jours précédents` : `No comparable breakdown in the previous ${d.days} days`;
        case 'age_postponements':
            return fr ? `Ouvert depuis ${d.age_days} jours, ${d.postponements} report(s)` : `Open for ${d.age_days} days, ${d.postponements} postponement(s)`;
        case 'symptom_rules':
            return (fr ? `Famille : ${families(d.families, lang) || 'non reconnue'}` : `Family: ${families(d.families, lang) || 'not recognised'}`)
                + (d.aggravated ? (fr ? ' — symptôme signalé comme aggravé' : ' — symptom reported as worsening') : '');
        case 'context_not_entered':
            return fr ? 'Non renseigné — saisie manuelle par un expert' : 'Not entered — manual input by an expert';
        case 'context_manual':
            return fr ? 'Saisi par un expert' : 'Entered by an expert';
        case 'expert_override':
            return fr ? `Corrigé par un expert (valeur calculée : ${d.computed}/5)` : `Corrected by an expert (computed value: ${d.computed}/5)`;
        default:
            return ev.reason;
    }
}

export const fmtDate = (d: string | null | undefined, lang: Lang) =>
    d ? new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

export const fmtDateTime = (d: string | null | undefined, lang: Lang) =>
    d ? new Date(d.endsWith('Z') ? d : d + 'Z').toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
