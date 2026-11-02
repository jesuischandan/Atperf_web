import { Info } from 'lucide-react';
import { STUDY_DATE, backlog, followedByRed, reliability, treatment, type PriorityClass, type ScoredNotice } from '../scoring';
import type { DemoAction } from './actions';

/* Maintenance KPIs on the illustrative dataset (demonstrator). */

const T = {
    fr: {
        intro: (d: string) => `Indicateurs calculés sur le jeu de données illustratif, à la date de référence du ${d}.`,
        backlogTitle: 'Backlog d’Avis jaunes', backlogOpen: 'Avis jaunes non clôturés', meanAge: 'Âge moyen', days: 'jours', dayShort: 'j',
        ageBands: 'Répartition par ancienneté (jours)', byPriority: 'Répartition par priorité (pondérations actuelles)',
        prio: { HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse' } as Record<PriorityClass, string>,
        followTitle: 'Avis jaunes suivis d’une panne rouge', window: 'Fenêtre',
        followText: (f: number, o: number, w: number) => `${f} Avis jaunes sur ${o} ont été suivis d’une panne rouge sur le même équipement dans les ${w} jours.`,
        followNote: 'Seuls les Avis dont la fenêtre complète est observée sont comptés. Corrélation chronologique, pas une causalité.',
        treatTitle: 'Taux de traitement', treatData: 'Avis jaunes clôturés (jeu de données)', treatDemo: 'Actions réalisées (votre suivi)',
        relTitle: 'Fiabilité par équipement', relCols: ['Équipement', 'Pannes rouges', 'Arrêt total (h)', 'MTTR (h)', 'MTBF (jours)'],
        relNote: 'MTTR approché par la durée d’arrêt enregistrée sur l’OT ; MTBF = temps calendaire moyen entre pannes rouges successives (au moins deux pannes). Données illustratives.',
    },
    en: {
        intro: (d: string) => `Indicators computed on the illustrative dataset, at the reference date of ${d}.`,
        backlogTitle: 'Yellow notification backlog', backlogOpen: 'Yellow notifications not closed', meanAge: 'Mean age', days: 'days', dayShort: 'd',
        ageBands: 'Breakdown by age (days)', byPriority: 'Breakdown by priority (current weights)',
        prio: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' } as Record<PriorityClass, string>,
        followTitle: 'Yellow notifications followed by a red breakdown', window: 'Window',
        followText: (f: number, o: number, w: number) => `${f} of ${o} yellow notifications were followed by a red breakdown on the same asset within ${w} days.`,
        followNote: 'Only notifications whose full window is observed are counted. Chronological correlation, not causality.',
        treatTitle: 'Treatment rate', treatData: 'Yellow notifications closed (dataset)', treatDemo: 'Actions done (your follow-up)',
        relTitle: 'Reliability by asset', relCols: ['Asset', 'Red breakdowns', 'Total downtime (h)', 'MTTR (h)', 'MTBF (days)'],
        relNote: 'MTTR approximated by the downtime recorded on the work order; MTBF = mean calendar time between successive red breakdowns (at least two). Illustrative data.',
    },
};

const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)} %`);
const BAR: Record<PriorityClass, string> = { HIGH: 'bg-amber-600', MEDIUM: 'bg-amber-400', LOW: 'bg-slate-300' };

export default function KpisTab({ lang, scored, actions, windowDays, onWindow }: {
    lang: 'fr' | 'en'; scored: ScoredNotice[]; actions: Record<string, DemoAction>; windowDays: number; onWindow: (d: number) => void;
}) {
    const t = T[lang];
    const b = backlog(scored);
    const maxBand = Math.max(1, ...b.bands.map(x => x.count));
    const prioCounts = (['HIGH', 'MEDIUM', 'LOW'] as PriorityClass[]).map(p => ({ p, count: b.open.filter(n => n.priority === p).length }));
    const f = followedByRed(windowDays);
    const tr = treatment();
    const acts = Object.values(actions);
    const actionable = acts.filter(a => a.status !== 'not_retained');
    const doneRate = actionable.length ? acts.filter(a => a.status === 'done').length / actionable.length : null;
    const rel = reliability();

    return (
        <div className="space-y-8">
            <p className="text-slate-600">{t.intro(STUDY_DATE)}</p>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Backlog */}
                <section className="lg:col-span-2 rounded-xl border border-slate-200 p-5">
                    <h3 className="font-bold mb-4">{t.backlogTitle}</h3>
                    <div className="flex flex-wrap gap-8 mb-5">
                        <div><div className="text-3xl font-black tabular-nums">{b.open.length}</div><div className="text-sm text-slate-600">{t.backlogOpen}</div></div>
                        <div><div className="text-3xl font-black tabular-nums">{b.meanAge ?? '—'} <span className="text-base font-semibold text-slate-400">{t.dayShort}</span></div><div className="text-sm text-slate-600">{t.meanAge}</div></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.ageBands}</p>
                            <div className="space-y-2">
                                {b.bands.map(band => (
                                    <div key={band.label} className="flex items-center gap-3 text-sm">
                                        <span className="w-14 text-slate-600 tabular-nums">{band.label}</span>
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#FF6B00]" style={{ width: `${(band.count / maxBand) * 100}%` }} /></div>
                                        <span className="w-8 text-right font-bold tabular-nums">{band.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.byPriority}</p>
                            <div className="space-y-2">
                                {prioCounts.map(({ p, count }) => (
                                    <div key={p} className="flex items-center gap-3 text-sm">
                                        <span className="w-16 text-slate-600">{t.prio[p]}</span>
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${BAR[p]}`} style={{ width: `${b.open.length ? (count / b.open.length) * 100 : 0}%` }} /></div>
                                        <span className="w-8 text-right font-bold tabular-nums">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Treatment */}
                <section className="rounded-xl border border-slate-200 p-5">
                    <h3 className="font-bold mb-4">{t.treatTitle}</h3>
                    <div className="space-y-4">
                        <div><div className="text-3xl font-black tabular-nums">{pct(tr.rate)}</div><div className="text-sm text-slate-600">{t.treatData} ({tr.closed}/{tr.total})</div></div>
                        <div><div className="text-3xl font-black tabular-nums">{pct(doneRate)}</div><div className="text-sm text-slate-600">{t.treatDemo} ({acts.filter(a => a.status === 'done').length}/{actionable.length})</div></div>
                    </div>
                </section>
            </div>

            {/* Yellow → red */}
            <section className="rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
                    <h3 className="font-bold">{t.followTitle}</h3>
                    <label className="block text-sm w-64">
                        <span className="flex justify-between font-semibold text-slate-700 mb-1">{t.window} <b className="tabular-nums">{windowDays} {t.days}</b></span>
                        <input type="range" min={15} max={180} step={5} value={windowDays} onChange={e => onWindow(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
                    </label>
                </div>
                <div className="flex flex-wrap items-baseline gap-4">
                    <div className="text-4xl font-black tabular-nums">{pct(f.rate)}</div>
                    <p className="text-slate-700">{t.followText(f.followed, f.observed, windowDays)}</p>
                </div>
                <p className="flex gap-2 items-start text-xs text-slate-500 mt-3"><Info size={14} className="shrink-0 mt-0.5" /> {t.followNote}</p>
            </section>

            {/* MTBF / MTTR */}
            <section>
                <h3 className="font-bold mb-3">{t.relTitle}</h3>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>{t.relCols.map((c, i) => <th key={c} className={`font-semibold px-3 py-2.5 whitespace-nowrap ${i ? 'text-right' : 'text-left'}`}>{c}</th>)}</tr>
                        </thead>
                        <tbody>
                            {rel.map(r => (
                                <tr key={r.equipment.id} className="border-t border-slate-100">
                                    <td className="px-3 py-2 whitespace-nowrap"><b>{r.equipment.tag}</b> <span className="text-slate-500">{r.equipment.name}</span></td>
                                    <td className="px-3 py-2 text-right tabular-nums">{r.breakdowns}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{r.downtimeHours}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{r.mttrHours ?? '—'}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{r.mtbfDays ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-slate-500 mt-2">{t.relNote}</p>
            </section>
        </div>
    );
}
