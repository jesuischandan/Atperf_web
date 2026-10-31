import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, RotateCcw, SlidersHorizontal, XCircle, PencilLine } from 'lucide-react';
import LandingPageNav from '../LandingPageNav';
import Footer from '../Footer';
import { useLang } from '../../utils/useLang';
import FluxTimeline, { TimelineLegend, type TimelineEquipment, type TimelineEvent } from './FluxTimeline';
import {
    CRITERIA, DATA, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, breakdown, daysBetween, drivers, equipmentById,
    metrics, precursors, redWorkOrders, scoreAll, weightsTotal,
    type Criterion, type PriorityClass, type ScoredNotice, type Thresholds, type Weights,
} from './scoring';

/* ─────────────────────────────────────────────────────────────
   STRAP Software Maintenance — public simulator on fictive data
───────────────────────────────────────────────────────────── */

type Lang = 'en' | 'fr';
type Tab = 'overview' | 'yellows' | 'replay' | 'measure';
type Decision = { status: 'validated' | 'rejected' | 'corrected'; comment: string };

const T = {
    fr: {
        back: 'STRAP Software Maintenance',
        title: 'Simulateur STRAP Software Maintenance',
        subtitle: 'Rejouez l’hypothèse JAUNE → ROUGE sur un jeu de données de maintenance entièrement fictif.',
        banner: 'Démonstrateur sur données 100 % fictives (12 équipements, 102 Avis, 48 OT). Pas de connexion SAP, pas de création d’OT, pas d’IA : les notes 0–5 proviennent du jeu de test, seules les pondérations et les seuils sont ajustables. Un Avis jaune antérieur ne prouve pas qu’il a causé la panne.',
        tabs: { overview: 'Vue d’ensemble', yellows: 'Avis jaunes priorisés', replay: 'Rejeu d’une panne', measure: 'Mesure des alertes' } as Record<Tab, string>,
        params: 'Paramètres de la matrice',
        total: 'Total',
        totalWarn: 'Les pondérations doivent totaliser 100.',
        reset: 'Réinitialiser',
        high: 'Seuil priorité haute',
        medium: 'Seuil priorité moyenne',
        criteria: { criticality: 'Criticité équipement', recurrence: 'Récurrence des anomalies', similarity: 'Similarité historique', age: 'Ancienneté / reports', severity: 'Gravité des symptômes', context: 'Contexte aggravant' } as Record<Criterion, string>,
        prio: { HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse' } as Record<PriorityClass, string>,
        kpi: { red: 'OT rouges (pannes)', green: 'Préventifs (Avis + OT)', yellow: 'Avis jaunes', high: 'Jaunes en priorité haute' },
        timelineTitle: 'Chronologie des trois flux par équipement',
        timelineHint: 'Cliquez sur un Avis jaune pour ouvrir sa fiche.',
        fictive: 'Illustration fictive',
        filterAll: 'Toutes',
        filterEq: 'Tous équipements',
        filterOpen: 'Non clôturés uniquement',
        search: 'Rechercher un Avis, un symptôme…',
        cols: ['#', 'Avis', 'Date', 'Équipement', 'Symptôme', 'Statut', 'Reports', 'Score /100'],
        none: 'Aucun Avis ne correspond aux filtres.',
        selectHint: 'Sélectionnez un Avis jaune pour voir la justification de son score.',
        why: 'Justification du score',
        drivers: 'Facteurs dominants',
        noDriver: 'Aucun facteur ≥ 4/5 — score réparti.',
        history: 'Historique du même équipement',
        priorReds: 'Pannes rouges antérieures (utilisables)',
        laterReds: 'Pannes rouges ultérieures (jamais utilisées dans le score)',
        noneFound: 'Aucune',
        datasetLinks: 'Rapprochements enregistrés',
        checks: 'Vérifications suggérées',
        checksNote: 'À confirmer par un responsable Maintenance — aucun OT n’est créé automatiquement.',
        expert: 'Décision de l’expert Maintenance',
        validate: 'Valider la priorité',
        reject: 'Rejeter',
        correct: 'Corriger',
        comment: 'Commentaire (optionnel)',
        decisionNote: 'Démo : les décisions restent dans votre navigateur et ne sont pas enregistrées.',
        decisions: { validated: 'Priorité validée', rejected: 'Rejeté par l’expert', corrected: 'Corrigé par l’expert' },
        replayPick: 'Choisir une panne rouge historique',
        withPre: 'Pannes avec Avis jaune précurseur',
        withoutPre: 'Pannes sans précurseur sur l’équipement',
        horizon: 'Horizon de recherche',
        days: 'jours',
        dayShort: 'J',
        replayCols: ['Avis jaune', 'Date', 'Avance', 'Équipement', 'Symptôme', 'Score', 'Signalé ?', 'Rapprochement'],
        flaggedYes: 'Oui',
        flaggedNo: 'Non',
        autoCandidate: 'Candidat automatique (même équipement)',
        otherEq: 'autre équipement',
        verdictOk: (d: number) => `La matrice aurait signalé un Avis jaune ${d} jours avant la panne (seuil haut).`,
        verdictLow: 'Des Avis jaunes précèdent la panne, mais aucun n’atteint le seuil haut : à analyser avec l’expert (critères ou pondérations).',
        verdictNone: 'Aucun Avis jaune précurseur dans l’horizon : panne non détectable par cette approche (faux négatif à mesurer).',
        downtime: 'Arrêt',
        cause: 'Cause (fictive)',
        measureIntro: 'Sur l’ensemble du jeu : combien de pannes rouges auraient été précédées d’une alerte, et combien d’alertes n’ont été suivies d’aucune panne ?',
        threshold: 'Seuil d’alerte',
        m: { coverage: 'Pannes couvertes par une alerte', alerts: 'Alertes émises', falseAlerts: 'Alertes sans panne ultérieure', noPre: 'Pannes sans précurseur', lead: 'Avance médiane' },
        falseList: 'Alertes non suivies d’une panne dans l’horizon',
        caution: 'Le score exprime une priorité métier, pas une probabilité de panne. L’absence de panne ultérieure ne signifie pas l’absence de risque : l’Avis a pu être traité à temps.',
        ctaTitle: 'Vous disposez d’historiques d’Avis et d’OT ?',
        ctaDesc: 'Échangeons sur un pilote STRAP Maintenance afin d’évaluer les liens entre anomalies différées et défaillances historiques sur vos propres données.',
        ctaBtn: 'Échanger sur un pilote',
    },
    en: {
        back: 'STRAP Software Maintenance',
        title: 'STRAP Software Maintenance simulator',
        subtitle: 'Replay the YELLOW → RED hypothesis on an entirely fictive maintenance dataset.',
        banner: 'Demonstrator on 100% fictive data (12 assets, 102 notifications, 48 work orders). No SAP connection, no automatic work orders, no AI: the 0–5 notes come from the test dataset, only weights and thresholds are adjustable. An earlier yellow notification does not prove it caused the breakdown. Dataset labels are in French.',
        tabs: { overview: 'Overview', yellows: 'Prioritised yellows', replay: 'Replay a breakdown', measure: 'Alert measurement' } as Record<Tab, string>,
        params: 'Matrix parameters',
        total: 'Total',
        totalWarn: 'Weights must add up to 100.',
        reset: 'Reset',
        high: 'High-priority threshold',
        medium: 'Medium-priority threshold',
        criteria: { criticality: 'Asset criticality', recurrence: 'Anomaly recurrence', similarity: 'Similarity to past failures', age: 'Age / postponements', severity: 'Symptom severity', context: 'Aggravating context' } as Record<Criterion, string>,
        prio: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' } as Record<PriorityClass, string>,
        kpi: { red: 'Red WOs (breakdowns)', green: 'Preventive (notif. + WO)', yellow: 'Yellow notifications', high: 'Yellows at high priority' },
        timelineTitle: 'Timeline of the three flows by asset',
        timelineHint: 'Click a yellow notification to open its detail.',
        fictive: 'Fictive illustration',
        filterAll: 'All',
        filterEq: 'All assets',
        filterOpen: 'Not closed only',
        search: 'Search a notification, a symptom…',
        cols: ['#', 'Notif.', 'Date', 'Asset', 'Symptom', 'Status', 'Postp.', 'Score /100'],
        none: 'No notification matches the filters.',
        selectHint: 'Select a yellow notification to see why it scores the way it does.',
        why: 'Score explanation',
        drivers: 'Main drivers',
        noDriver: 'No factor ≥ 4/5 — score is spread out.',
        history: 'History of the same asset',
        priorReds: 'Earlier red breakdowns (usable)',
        laterReds: 'Later red breakdowns (never used in the score)',
        noneFound: 'None',
        datasetLinks: 'Recorded matches',
        checks: 'Suggested checks',
        checksNote: 'To be confirmed by a maintenance manager — no work order is created automatically.',
        expert: 'Maintenance expert decision',
        validate: 'Validate priority',
        reject: 'Reject',
        correct: 'Correct',
        comment: 'Comment (optional)',
        decisionNote: 'Demo: decisions stay in your browser and are not saved.',
        decisions: { validated: 'Priority validated', rejected: 'Rejected by expert', corrected: 'Corrected by expert' },
        replayPick: 'Pick a historical red breakdown',
        withPre: 'Breakdowns with a yellow precursor',
        withoutPre: 'Breakdowns with no precursor on the asset',
        horizon: 'Search horizon',
        days: 'days',
        dayShort: 'D',
        replayCols: ['Yellow notif.', 'Date', 'Lead', 'Asset', 'Symptom', 'Score', 'Flagged?', 'Match'],
        flaggedYes: 'Yes',
        flaggedNo: 'No',
        autoCandidate: 'Automatic candidate (same asset)',
        otherEq: 'other asset',
        verdictOk: (d: number) => `The matrix would have flagged a yellow notification ${d} days before the breakdown (high threshold).`,
        verdictLow: 'Yellow notifications precede the breakdown but none reaches the high threshold: review criteria or weights with the expert.',
        verdictNone: 'No yellow precursor within the horizon: this breakdown is not detectable by this approach (false negative to measure).',
        downtime: 'Downtime',
        cause: 'Cause (fictive)',
        measureIntro: 'Across the whole dataset: how many red breakdowns were preceded by an alert, and how many alerts were followed by no breakdown?',
        threshold: 'Alert threshold',
        m: { coverage: 'Breakdowns covered by an alert', alerts: 'Alerts raised', falseAlerts: 'Alerts with no later breakdown', noPre: 'Breakdowns without precursor', lead: 'Median lead time' },
        falseList: 'Alerts not followed by a breakdown within the horizon',
        caution: 'The score is a business priority, not a failure probability. No later breakdown does not mean no risk: the notification may have been handled in time.',
        ctaTitle: 'Do you have notification and work-order history?',
        ctaDesc: 'Let’s discuss a STRAP Maintenance pilot to assess the links between deferred anomalies and past failures on your own data.',
        ctaBtn: 'Discuss a pilot',
    },
};

/* Rule-based suggested checks per symptom family (V1: no AI) */
const CHECKS: Record<string, { fr: string; en: string }> = {
    'Fuite d’huile progressive': { fr: 'Contrôler étanchéité, joints et niveau d’huile ; planifier le remplacement du joint à la prochaine fenêtre.', en: 'Check sealing, gaskets and oil level; plan seal replacement at the next window.' },
    'Vibration inhabituelle': { fr: 'Mesure vibratoire ; contrôle roulements, alignement et fixations.', en: 'Vibration measurement; check bearings, alignment and fixings.' },
    'Bruit intermittent': { fr: 'Inspection acoustique ; contrôle transmission et serrages.', en: 'Acoustic inspection; check transmission and tightening.' },
    'Température élevée': { fr: 'Thermographie ; contrôle du refroidissement et de la ventilation.', en: 'Thermography; check cooling and ventilation.' },
    'Pression instable': { fr: 'Contrôle du circuit hydraulique, recherche de fuite interne, vérification des capteurs de pression.', en: 'Check hydraulic circuit, look for internal leak, verify pressure sensors.' },
    'Défaut capteur intermittent': { fr: 'Contrôle connectique et câblage ; étalonnage du capteur.', en: 'Check connectors and wiring; calibrate the sensor.' },
    'Débit irrégulier': { fr: 'Contrôle filtres et colmatage ; vérification de la pompe.', en: 'Check filters and clogging; verify the pump.' },
    'Jeu mécanique observé': { fr: 'Contrôle des serrages et de l’usure des accouplements.', en: 'Check tightening and coupling wear.' },
};

const PRIO_BADGE: Record<PriorityClass, string> = {
    HIGH: 'bg-amber-600 text-white',
    MEDIUM: 'bg-amber-200 text-amber-900',
    LOW: 'bg-slate-100 text-slate-600',
};

const greens = DATA.notices.filter(n => n.flux === 'VERT');
const shortDate = (d: string, lang: Lang) =>
    new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shiftDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);

function ScoreBar({ value, priority }: { value: number; priority: PriorityClass }) {
    return (
        <div className="flex items-center gap-2 min-w-[110px]">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${priority === 'HIGH' ? 'bg-amber-600' : priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${Math.min(100, value)}%` }} />
            </div>
            <span className="font-bold tabular-nums text-slate-900 w-7 text-right">{value}</span>
        </div>
    );
}

export default function StrapMaintenanceDemo() {
    const navigate = useNavigate();
    const [lang, switchLang] = useLang();
    const t = T[lang];

    const [tab, setTab] = useState<Tab>('overview');
    const [showParams, setShowParams] = useState(false);
    const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
    const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
    const [horizon, setHorizon] = useState(90);
    const [alertThreshold, setAlertThreshold] = useState(DEFAULT_THRESHOLDS.high);

    const [prioFilter, setPrioFilter] = useState<PriorityClass | 'ALL'>('ALL');
    const [eqFilter, setEqFilter] = useState('ALL');
    const [openOnly, setOpenOnly] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [decisions, setDecisions] = useState<Record<string, Decision>>({});
    const [draftComment, setDraftComment] = useState('');

    const scored = useMemo(() => scoreAll(weights, thresholds), [weights, thresholds]);
    const total = weightsTotal(weights);

    const timelineEquipments: TimelineEquipment[] = DATA.equipments.map(e => ({ id: e.id, name: e.name, tag: e.tag }));
    const timelineEvents: TimelineEvent[] = [
        ...greens.map(n => ({ id: n.id, date: n.date, equipmentId: n.equipmentId, kind: 'green' as const, label: `${n.id} · ${n.date}` })),
        ...scored.map(n => ({ id: n.id, date: n.date, equipmentId: n.equipmentId, kind: 'yellow' as const, priority: n.priority,
            label: `${n.id} · ${n.date} · ${n.symptom} · ${n.score}/100` })),
        ...DATA.workOrders.map(o => ({ id: o.id, date: o.date, equipmentId: o.equipmentId, kind: o.flux === 'ROUGE' ? 'red' as const : 'green' as const,
            label: `${o.id} · ${o.date} · ${o.symptom}` })),
    ];

    const filtered = scored.filter(n =>
        (prioFilter === 'ALL' || n.priority === prioFilter) &&
        (eqFilter === 'ALL' || n.equipmentId === eqFilter) &&
        (!openOnly || n.status !== 'Clôturé') &&
        (!query || `${n.id} ${n.symptom} ${equipmentById.get(n.equipmentId)?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())),
    );
    const selected = scored.find(n => n.id === selectedId) ?? null;

    // Replay
    const redsWithPre = useMemo(() => redWorkOrders.filter(o => precursors(o, scored, horizon, thresholds).length > 0), [scored, horizon, thresholds]);
    const redsWithoutPre = redWorkOrders.filter(o => !redsWithPre.includes(o));
    const [replayId, setReplayId] = useState<string>(() => {
        const initial = scoreAll(DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
        return (redWorkOrders.find(o => precursors(o, initial, 90, DEFAULT_THRESHOLDS).some(p => p.flagged && p.sameEquipment)) ?? redWorkOrders[0]).id;
    });
    const replayOt = redWorkOrders.find(o => o.id === replayId)!;
    const pre = precursors(replayOt, scored, horizon, thresholds);
    const earliestFlag = pre.filter(p => p.flagged && p.sameEquipment).reduce<number | null>((m, p) => (m === null || p.leadDays > m ? p.leadDays : m), null);

    // Measure
    const m = metrics(scored, horizon, alertThreshold);
    const falseAlertList = scored.filter(n => n.score >= alertThreshold && !redWorkOrders.some(o => {
        const lead = daysBetween(n.date, o.date);
        return o.equipmentId === n.equipmentId && lead > 0 && lead <= horizon;
    }));

    const openNotice = (id: string) => { setSelectedId(id); setDraftComment(decisions[id]?.comment ?? ''); setTab('yellows'); };
    const decide = (status: Decision['status']) => {
        if (!selected) return;
        setDecisions(d => ({ ...d, [selected.id]: { status, comment: draftComment } }));
    };

    const allDates = [...DATA.notices.map(n => n.date), ...DATA.workOrders.map(o => o.date)].sort();
    const range = { start: shiftDays(allDates[0], -10), end: shiftDays(allDates[allDates.length - 1], 10) };

    return (
        <div className="min-h-screen bg-white text-slate-900 antialiased flex flex-col" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <LandingPageNav lang={lang} onLangChange={switchLang} />

            <main className="flex-1 pt-24 pb-16 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => navigate('/strap-software/maintenance')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#FF6B00] mb-4">
                        <ArrowLeft size={15} /> {t.back}
                    </button>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">{t.title}</h1>
                    <p className="text-slate-500 text-base sm:text-lg mb-6">{t.subtitle}</p>

                    <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-6">
                        <Info size={18} className="shrink-0 mt-0.5" />
                        <p>{t.banner}</p>
                    </div>

                    {/* Parameters */}
                    <div className="border border-slate-200 rounded-xl mb-6">
                        <button onClick={() => setShowParams(s => !s)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700">
                            <span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} className="text-[#FF6B00]" /> {t.params}</span>
                            <span className={`tabular-nums ${total === 100 ? 'text-slate-500' : 'text-red-600'}`}>{t.total} {total}/100</span>
                        </button>
                        {showParams && (
                            <div className="border-t border-slate-200 p-4">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                    {CRITERIA.map(c => (
                                        <label key={c} className="block text-sm">
                                            <span className="flex justify-between text-slate-700 mb-1">{t.criteria[c]} <b className="tabular-nums">{weights[c]}</b></span>
                                            <input type="range" min={0} max={40} value={weights[c]} className="w-full accent-[#FF6B00]"
                                                onChange={e => setWeights(w => ({ ...w, [c]: Number(e.target.value) }))} />
                                        </label>
                                    ))}
                                    <label className="block text-sm">
                                        <span className="flex justify-between text-slate-700 mb-1">{t.high} <b className="tabular-nums">{thresholds.high}</b></span>
                                        <input type="range" min={thresholds.medium + 1} max={95} value={thresholds.high} className="w-full accent-amber-600"
                                            onChange={e => setThresholds(th => ({ ...th, high: Number(e.target.value) }))} />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="flex justify-between text-slate-700 mb-1">{t.medium} <b className="tabular-nums">{thresholds.medium}</b></span>
                                        <input type="range" min={10} max={thresholds.high - 1} value={thresholds.medium} className="w-full accent-amber-400"
                                            onChange={e => setThresholds(th => ({ ...th, medium: Number(e.target.value) }))} />
                                    </label>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                                    {total !== 100 ? <p className="text-sm text-red-600 inline-flex items-center gap-1.5"><AlertTriangle size={15} /> {t.totalWarn}</p> : <span />}
                                    <button onClick={() => { setWeights(DEFAULT_WEIGHTS); setThresholds(DEFAULT_THRESHOLDS); }}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
                                        <RotateCcw size={14} /> {t.reset}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-6" role="tablist">
                        {(Object.keys(t.tabs) as Tab[]).map((k, i) => (
                            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                                className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                {i + 1}. {t.tabs[k]}
                            </button>
                        ))}
                    </div>

                    {/* ── 1. Overview ── */}
                    {tab === 'overview' && (
                        <div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: t.kpi.red, value: redWorkOrders.length, cls: 'border-red-200 bg-red-50 text-red-700' },
                                    { label: t.kpi.green, value: greens.length + DATA.workOrders.filter(o => o.flux === 'VERT').length, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                                    { label: t.kpi.yellow, value: scored.length, cls: 'border-amber-200 bg-amber-50 text-amber-700' },
                                    { label: t.kpi.high, value: scored.filter(n => n.priority === 'HIGH').length, cls: 'border-slate-200 bg-slate-900 text-white' },
                                ].map(k => (
                                    <div key={k.label} className={`rounded-xl border p-4 ${k.cls}`}>
                                        <div className="text-3xl font-black tabular-nums">{k.value}</div>
                                        <div className="text-sm font-medium opacity-80">{k.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                                <h2 className="text-lg font-bold">{t.timelineTitle}</h2>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.fictive}</span>
                            </div>
                            <div className="border border-slate-200 rounded-xl p-3 mb-3">
                                <FluxTimeline equipments={timelineEquipments} events={timelineEvents}
                                    start={range.start} end={range.end} lang={lang} onSelect={openNotice} />
                            </div>
                            <div className="flex flex-wrap justify-between gap-3">
                                <TimelineLegend lang={lang} />
                                <p className="text-xs text-slate-500">{t.timelineHint}</p>
                            </div>
                        </div>
                    )}

                    {/* ── 2. Prioritised yellows ── */}
                    {tab === 'yellows' && (
                        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
                            <div className="min-w-0">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search}
                                        className="flex-1 min-w-[180px] border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                    <select value={prioFilter} onChange={e => setPrioFilter(e.target.value as PriorityClass | 'ALL')} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                                        <option value="ALL">{t.filterAll}</option>
                                        {(['HIGH', 'MEDIUM', 'LOW'] as PriorityClass[]).map(p => <option key={p} value={p}>{t.prio[p]}</option>)}
                                    </select>
                                    <select value={eqFilter} onChange={e => setEqFilter(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                                        <option value="ALL">{t.filterEq}</option>
                                        {DATA.equipments.map(e => <option key={e.id} value={e.id}>{e.tag} — {e.name}</option>)}
                                    </select>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-600 px-1">
                                        <input type="checkbox" checked={openOnly} onChange={e => setOpenOnly(e.target.checked)} className="accent-[#FF6B00]" /> {t.filterOpen}
                                    </label>
                                </div>
                                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                            <tr>{t.cols.map(c => <th key={c} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{c}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map(n => {
                                                const e = equipmentById.get(n.equipmentId)!;
                                                const d = decisions[n.id];
                                                return (
                                                    <tr key={n.id} onClick={() => openNotice(n.id)}
                                                        className={`border-t border-slate-100 cursor-pointer hover:bg-orange-50/50 ${selectedId === n.id ? 'bg-orange-50' : ''}`}>
                                                        <td className="px-3 py-2 text-slate-400 tabular-nums">{scored.indexOf(n) + 1}</td>
                                                        <td className="px-3 py-2 font-semibold whitespace-nowrap">
                                                            {n.id}
                                                            {d && (d.status === 'validated' ? <CheckCircle2 size={13} className="inline ml-1 text-emerald-600" /> : d.status === 'rejected' ? <XCircle size={13} className="inline ml-1 text-red-500" /> : <PencilLine size={13} className="inline ml-1 text-slate-500" />)}
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-slate-600">{n.date}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap">{e.tag}</td>
                                                        <td className="px-3 py-2 text-slate-600">{n.symptom}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-slate-600">{n.status}</td>
                                                        <td className="px-3 py-2 text-center tabular-nums">{n.postponements}</td>
                                                        <td className="px-3 py-2"><ScoreBar value={n.score} priority={n.priority} /></td>
                                                    </tr>
                                                );
                                            })}
                                            {filtered.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">{t.none}</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <aside className="min-w-0">
                                {!selected ? (
                                    <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 text-sm">{t.selectHint}</div>
                                ) : (
                                    <NoticeDetail
                                        n={selected} lang={lang} weights={weights} decision={decisions[selected.id]}
                                        comment={draftComment} onComment={setDraftComment} onDecide={decide}
                                    />
                                )}
                            </aside>
                        </div>
                    )}

                    {/* ── 3. Replay ── */}
                    {tab === 'replay' && (
                        <div>
                            <div className="flex flex-wrap gap-4 items-end mb-6">
                                <label className="block text-sm flex-1 min-w-[260px]">
                                    <span className="block font-semibold text-slate-700 mb-1">{t.replayPick}</span>
                                    <select value={replayId} onChange={e => setReplayId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                                        <optgroup label={t.withPre}>
                                            {redsWithPre.map(o => <option key={o.id} value={o.id}>{o.id} · {o.date} · {equipmentById.get(o.equipmentId)!.tag} · {o.symptom}</option>)}
                                        </optgroup>
                                        <optgroup label={t.withoutPre}>
                                            {redsWithoutPre.map(o => <option key={o.id} value={o.id}>{o.id} · {o.date} · {equipmentById.get(o.equipmentId)!.tag} · {o.symptom}</option>)}
                                        </optgroup>
                                    </select>
                                </label>
                                <label className="block text-sm w-64">
                                    <span className="flex justify-between font-semibold text-slate-700 mb-1">{t.horizon} <b className="tabular-nums">{horizon} {t.days}</b></span>
                                    <input type="range" min={15} max={180} step={5} value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
                                </label>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <div className="md:col-span-1 rounded-xl border border-red-200 bg-red-50 p-4">
                                    <div className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">{replayOt.type}</div>
                                    <div className="text-xl font-extrabold">{replayOt.id}</div>
                                    <div className="text-sm text-slate-700">{shortDate(replayOt.date, lang)} · {equipmentById.get(replayOt.equipmentId)!.tag} — {equipmentById.get(replayOt.equipmentId)!.name}</div>
                                    <div className="text-sm text-slate-700 mt-2">{replayOt.symptom}</div>
                                    <div className="text-xs text-slate-500 mt-2">{t.cause} : {replayOt.cause} · {t.downtime} {replayOt.downtimeHours} h</div>
                                </div>
                                <div className={`md:col-span-2 rounded-xl border p-4 flex gap-3 items-start ${earliestFlag !== null ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : pre.some(p => p.sameEquipment) ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                                    {earliestFlag !== null ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="shrink-0 mt-0.5" />}
                                    <p className="font-medium">
                                        {earliestFlag !== null ? t.verdictOk(earliestFlag) : pre.some(p => p.sameEquipment) ? t.verdictLow : t.verdictNone}
                                    </p>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl p-3 mb-6">
                                <FluxTimeline
                                    equipments={[replayOt.equipmentId, ...new Set(pre.filter(p => !p.sameEquipment).map(p => p.notice.equipmentId))]
                                        .map(id => timelineEquipments.find(e => e.id === id)!)}
                                    events={timelineEvents}
                                    start={shiftDays(replayOt.date, -horizon - 10)} end={shiftDays(replayOt.date, 15)} lang={lang}
                                    highlight={new Set([replayOt.id, ...pre.map(p => p.notice.id)])} onSelect={openNotice}
                                />
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                        <tr>{t.replayCols.map(c => <th key={c} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{c}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {pre.map(p => (
                                            <tr key={p.notice.id} className="border-t border-slate-100 hover:bg-orange-50/50 cursor-pointer" onClick={() => openNotice(p.notice.id)}>
                                                <td className="px-3 py-2 font-semibold">{p.notice.id}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{p.notice.date}</td>
                                                <td className="px-3 py-2 whitespace-nowrap tabular-nums">{t.dayShort}-{p.leadDays}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{equipmentById.get(p.notice.equipmentId)!.tag}{!p.sameEquipment && <span className="text-xs text-slate-400"> ({t.otherEq})</span>}</td>
                                                <td className="px-3 py-2 text-slate-600">{p.notice.symptom}</td>
                                                <td className="px-3 py-2"><ScoreBar value={p.notice.score} priority={p.notice.priority} /></td>
                                                <td className="px-3 py-2">{p.flagged ? <span className="font-semibold text-emerald-700">{t.flaggedYes}</span> : <span className="text-slate-500">{t.flaggedNo}</span>}</td>
                                                <td className="px-3 py-2 text-xs text-slate-600">{p.linkStatus ?? t.autoCandidate}</td>
                                            </tr>
                                        ))}
                                        {pre.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">{t.verdictNone}</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── 4. Measure ── */}
                    {tab === 'measure' && (
                        <div>
                            <p className="text-slate-600 mb-6 max-w-3xl">{t.measureIntro}</p>
                            <div className="flex flex-wrap gap-8 mb-6">
                                <label className="block text-sm w-64">
                                    <span className="flex justify-between font-semibold text-slate-700 mb-1">{t.threshold} <b className="tabular-nums">{alertThreshold}/100</b></span>
                                    <input type="range" min={30} max={95} value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
                                </label>
                                <label className="block text-sm w-64">
                                    <span className="flex justify-between font-semibold text-slate-700 mb-1">{t.horizon} <b className="tabular-nums">{horizon} {t.days}</b></span>
                                    <input type="range" min={15} max={180} step={5} value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                {[
                                    { label: t.m.coverage, value: `${m.covered}/${m.reds}`, sub: `${Math.round((m.covered / m.reds) * 100)} %` },
                                    { label: t.m.alerts, value: String(m.alerts), sub: '' },
                                    { label: t.m.falseAlerts, value: String(m.falseAlerts), sub: m.alerts ? `${Math.round((m.falseAlerts / m.alerts) * 100)} %` : '' },
                                    { label: t.m.noPre, value: String(m.noPrecursor), sub: '' },
                                    { label: t.m.lead, value: m.medianLeadDays === null ? '—' : `${m.medianLeadDays} ${t.days}`, sub: '' },
                                ].map(k => (
                                    <div key={k.label} className="rounded-xl border border-slate-200 p-4">
                                        <div className="text-2xl font-black tabular-nums">{k.value} <span className="text-sm font-semibold text-slate-400">{k.sub}</span></div>
                                        <div className="text-sm text-slate-600">{k.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 mb-6">
                                <Info size={18} className="shrink-0 mt-0.5 text-slate-500" />
                                <p>{t.caution}</p>
                            </div>
                            <h3 className="font-bold mb-3">{t.falseList} ({falseAlertList.length})</h3>
                            <div className="border border-slate-200 rounded-xl overflow-x-auto">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {falseAlertList.map(n => (
                                            <tr key={n.id} className="border-t first:border-t-0 border-slate-100 hover:bg-orange-50/50 cursor-pointer" onClick={() => openNotice(n.id)}>
                                                <td className="px-3 py-2 font-semibold">{n.id}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{n.date}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{equipmentById.get(n.equipmentId)!.tag}</td>
                                                <td className="px-3 py-2 text-slate-600">{n.symptom}</td>
                                                <td className="px-3 py-2 text-slate-600">{n.status}</td>
                                                <td className="px-3 py-2"><ScoreBar value={n.score} priority={n.priority} /></td>
                                            </tr>
                                        ))}
                                        {falseAlertList.length === 0 && <tr><td className="px-3 py-6 text-center text-slate-500">—</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="mt-14 rounded-2xl bg-slate-900 text-white p-8 sm:p-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="max-w-2xl">
                            <h2 className="text-xl sm:text-2xl font-extrabold mb-2">{t.ctaTitle}</h2>
                            <p className="text-slate-400">{t.ctaDesc}</p>
                        </div>
                        <button onClick={() => navigate('/contact')} className="shrink-0 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-7 py-3.5 rounded-xl transition-all">
                            {t.ctaBtn}
                        </button>
                    </div>
                </div>
            </main>

            <Footer lang={lang} />
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Detail panel for one yellow notification
───────────────────────────────────────────────────────────── */
function NoticeDetail({ n, lang, weights, decision, comment, onComment, onDecide }: {
    n: ScoredNotice; lang: Lang; weights: Weights; decision?: Decision;
    comment: string; onComment: (s: string) => void; onDecide: (s: Decision['status']) => void;
}) {
    const t = T[lang];
    const e = equipmentById.get(n.equipmentId)!;
    const pts = breakdown(n.notes, weights);
    const drv = drivers(n.notes);
    const sameEqReds = redWorkOrders.filter(o => o.equipmentId === n.equipmentId);
    const priorReds = sameEqReds.filter(o => o.date < n.date);
    const laterReds = sameEqReds.filter(o => o.date > n.date);
    const links = DATA.links.filter(l => l.noticeId === n.id);
    const check = CHECKS[n.symptom];

    return (
        <div className="border border-slate-200 rounded-xl p-5 lg:sticky lg:top-20 space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xl font-extrabold">{n.id}</div>
                    <div className="text-sm text-slate-600">{e.tag} — {e.name} · {e.subsystem}</div>
                    <div className="text-sm text-slate-500">{shortDate(n.date, lang)} · {n.category} · {n.status}</div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black tabular-nums">{n.score}</div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIO_BADGE[n.priority]}`}>{t.prio[n.priority]}</span>
                </div>
            </div>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{n.description}</p>

            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.why}</h4>
                <div className="space-y-2">
                    {CRITERIA.map(c => (
                        <div key={c} className="text-sm">
                            <div className="flex justify-between text-slate-700">
                                <span>{t.criteria[c]} <span className="text-slate-400">· {n.notes[c]}/5</span></span>
                                <span className="tabular-nums font-semibold">{pts[c].toFixed(0)} / {weights[c]}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#FF6B00]" style={{ width: `${(n.notes[c] / 5) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-sm text-slate-600 mt-3">
                    <b>{t.drivers} :</b> {drv.length ? drv.map(c => t.criteria[c]).join(' · ') : t.noDriver}
                </p>
            </div>

            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.history}</h4>
                <p className="text-sm text-slate-700 mb-1">{t.priorReds} :</p>
                <ul className="text-sm text-slate-600 mb-2 list-disc pl-5">
                    {priorReds.length ? priorReds.map(o => <li key={o.id}>{o.id} · {o.date} · {o.symptom}</li>) : <li className="list-none -ml-5 text-slate-400">{t.noneFound}</li>}
                </ul>
                <p className="text-sm text-slate-400 mb-1">{t.laterReds} :</p>
                <ul className="text-sm text-slate-400 list-disc pl-5">
                    {laterReds.length ? laterReds.map(o => <li key={o.id}>{o.id} · {o.date} · {o.symptom}</li>) : <li className="list-none -ml-5">{t.noneFound}</li>}
                </ul>
                {links.length > 0 && (
                    <div className="mt-3 text-sm">
                        <p className="text-slate-700 mb-1">{t.datasetLinks} :</p>
                        {links.map(l => (
                            <p key={l.id} className="text-slate-600">{l.id} → {l.workOrderId} · {l.match} · {l.reason} · <i>{l.expertStatus}</i></p>
                        ))}
                    </div>
                )}
            </div>

            {check && (
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.checks}</h4>
                    <p className="text-sm text-slate-700">{check[lang]}</p>
                    <p className="text-xs text-slate-500 mt-1">{t.checksNote}</p>
                </div>
            )}

            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.expert}</h4>
                {decision && <p className="text-sm font-semibold text-slate-800 mb-2">✓ {t.decisions[decision.status]}{decision.comment && ` — « ${decision.comment} »`}</p>}
                <textarea value={comment} onChange={ev => onComment(ev.target.value)} placeholder={t.comment} rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2" />
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => onDecide('validated')} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2"><CheckCircle2 size={15} /> {t.validate}</button>
                    <button onClick={() => onDecide('rejected')} className="inline-flex items-center gap-1.5 text-sm font-semibold border border-slate-200 hover:bg-slate-50 rounded-lg px-3 py-2"><XCircle size={15} /> {t.reject}</button>
                    <button onClick={() => onDecide('corrected')} className="inline-flex items-center gap-1.5 text-sm font-semibold border border-slate-200 hover:bg-slate-50 rounded-lg px-3 py-2"><PencilLine size={15} /> {t.correct}</button>
                </div>
                <p className="text-xs text-slate-500 mt-2">{t.decisionNote}</p>
            </div>
        </div>
    );
}
