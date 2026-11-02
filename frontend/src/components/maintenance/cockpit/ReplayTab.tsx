import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { api, type Replay } from './api';
import { CONFIDENCE, DECISION_LABEL, fmtDate } from './texts';
import { DecisionIcon, ErrorBox, Loading, ScoreBar, type TabProps } from './ui';

const T = {
    fr: {
        pick: 'Choisir une panne rouge historique', threshold: 'Seuil d’alerte', candidates: 'candidat(s)',
        cause: 'Cause', downtime: 'Arrêt',
        verdict: {
            flagged: (d: number) => `La matrice aurait signalé un Avis jaune ${d} jours avant la panne (revue hebdomadaire, informations disponibles à la date de revue uniquement).`,
            below_threshold: 'Des Avis jaunes précèdent la panne, mais aucun n’atteint le seuil : à analyser avec l’expert (critères, pondérations ou seuil).',
            no_precursor: 'Aucun Avis jaune précurseur dans la fenêtre de rapprochement : panne non détectable par cette approche (faux négatif).',
        },
        cols: ['Avis jaune', 'Date', 'Avance', 'Équipement', 'Symptôme', 'Score à la création', 'Score la veille', 'Signalé le', 'Rapprochement', 'Décision'],
        yes: 'Oui', no: 'Non', other: 'autre équipement', dayShort: 'J-',
        method: 'Chaque Avis est rescoré comme lors d’une revue hebdomadaire, avec uniquement les données connues à cette date : une panne future n’entre jamais dans le calcul.',
    },
    en: {
        pick: 'Pick a historical red breakdown', threshold: 'Alert threshold', candidates: 'candidate(s)',
        cause: 'Cause', downtime: 'Downtime',
        verdict: {
            flagged: (d: number) => `The matrix would have flagged a yellow notification ${d} days before the breakdown (weekly review, using only information available at each review).`,
            below_threshold: 'Yellow notifications precede the breakdown but none reaches the threshold: review criteria, weights or threshold with the expert.',
            no_precursor: 'No yellow precursor within the match window: this breakdown is not detectable by this approach (false negative).',
        },
        cols: ['Yellow notif.', 'Date', 'Lead', 'Asset', 'Symptom', 'Score at creation', 'Score day before', 'Flagged on', 'Match', 'Decision'],
        yes: 'Yes', no: 'No', other: 'other asset', dayShort: 'D-',
        method: 'Each notification is rescored as in a weekly review, using only data known at that date: a future breakdown never enters the calculation.',
    },
};

export default function ReplayTab({ datasetId, lang, version, onChanged, defaultThreshold, onOpenNotice, initialWo }: TabProps & {
    defaultThreshold: number; onOpenNotice: (code: string) => void; initialWo?: string | null;
}) {
    const t = T[lang];
    const [index, setIndex] = useState<{ code: string; date: string; equipment: string; symptom: string; candidates: number }[] | null>(null);
    const [wo, setWo] = useState(initialWo ?? '');
    const [threshold, setThreshold] = useState(defaultThreshold);
    const [data, setData] = useState<Replay | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.replayIndex(datasetId).then(list => {
            setIndex(list);
            setWo(prev => prev || list.find(o => o.candidates > 0)?.code || list[0]?.code || '');
        }).catch(e => setError(e.message));
    }, [datasetId]);

    useEffect(() => {
        if (!wo) return;
        const timer = setTimeout(() => {
            api.replay(datasetId, wo, threshold).then(setData).catch(e => setError(e.message));
        }, 200);
        return () => clearTimeout(timer);
    }, [datasetId, wo, threshold, version]);

    const decideLink = async (target: string, decision: 'validated' | 'rejected') => {
        try { await api.decide(datasetId, { target_type: 'link', target, decision }); onChanged(); }
        catch (e) { setError((e as Error).message); }
    };

    if (error) return <ErrorBox message={error} />;
    if (!index) return <Loading />;

    return (
        <div>
            <div className="flex flex-wrap gap-4 items-end mb-6">
                <label className="block text-sm flex-1 min-w-[260px]">
                    <span className="block font-semibold text-slate-700 mb-1">{t.pick}</span>
                    <select value={wo} onChange={e => setWo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white">
                        {index.map(o => <option key={o.code} value={o.code}>{o.code} · {o.date} · {o.equipment} · {o.symptom} ({o.candidates} {t.candidates})</option>)}
                    </select>
                </label>
                <label className="block text-sm w-64">
                    <span className="flex justify-between font-semibold text-slate-700 mb-1">{t.threshold} <b className="tabular-nums">{threshold}/100</b></span>
                    <input type="range" min={30} max={95} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
                </label>
            </div>

            {!data ? <Loading /> : (
                <>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">{data.work_order.type}</div>
                            <div className="text-xl font-extrabold">{data.work_order.code}</div>
                            <div className="text-sm text-slate-700">{fmtDate(data.work_order.date, lang)} · {data.work_order.equipment.tag} — {data.work_order.equipment.name}</div>
                            <div className="text-sm text-slate-700 mt-2">{data.work_order.symptom}</div>
                            <div className="text-xs text-slate-500 mt-2">{t.cause} : {data.work_order.cause || '—'}{data.work_order.downtime_hours != null ? ` · ${t.downtime} ${data.work_order.downtime_hours} h` : ''}</div>
                        </div>
                        <div className={`md:col-span-2 rounded-xl border p-4 flex gap-3 items-start ${data.verdict === 'flagged' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : data.verdict === 'below_threshold' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                            {data.verdict === 'flagged' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="shrink-0 mt-0.5" />}
                            <div>
                                <p className="font-medium">{data.verdict === 'flagged' ? t.verdict.flagged(data.best_lead_days ?? 0) : t.verdict[data.verdict]}</p>
                                <p className="text-xs opacity-75 mt-2">{t.method}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <tr>{t.cols.map(c => <th key={c} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{c}</th>)}</tr>
                            </thead>
                            <tbody>
                                {data.precursors.map(p => {
                                    const target = `${p.notice}>${p.work_order}`;
                                    return (
                                        <tr key={p.notice} className="border-t border-slate-100">
                                            <td className="px-3 py-2 font-semibold"><button onClick={() => onOpenNotice(p.notice)} className="hover:text-[#FF6B00] hover:underline">{p.notice}</button></td>
                                            <td className="px-3 py-2 whitespace-nowrap text-slate-600">{fmtDate(p.date, lang)}</td>
                                            <td className="px-3 py-2 whitespace-nowrap tabular-nums">{t.dayShort}{p.lead_days}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{p.equipment_tag}{!p.same_equipment && <span className="text-xs text-slate-400"> ({t.other})</span>}</td>
                                            <td className="px-3 py-2 text-slate-600 min-w-[140px]">{p.symptom}</td>
                                            <td className="px-3 py-2 tabular-nums">{p.score_at_creation}</td>
                                            <td className="px-3 py-2"><ScoreBar value={p.score_before_failure} priority={p.priority_before_failure} /></td>
                                            <td className="px-3 py-2 whitespace-nowrap">{p.flagged_on ? <span className="font-semibold text-emerald-700">{fmtDate(p.flagged_on, lang)} ({t.dayShort}{p.flag_lead_days})</span> : <span className="text-slate-400">{t.no}</span>}</td>
                                            <td className="px-3 py-2 text-xs text-slate-600 min-w-[160px]">{CONFIDENCE[lang][p.confidence]}{p.imported_status ? ` · ${p.imported_status}` : ''}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                {p.decision && <span className="text-xs mr-2"><DecisionIcon decision={p.decision} lang={lang} /> {DECISION_LABEL[lang][p.decision.decision]}</span>}
                                                <button onClick={() => decideLink(target, 'validated')} className="p-1 rounded hover:bg-emerald-50" title="✓" aria-label={`${DECISION_LABEL[lang].validated} ${target}`}><CheckCircle2 size={15} className="text-emerald-600" /></button>
                                                <button onClick={() => decideLink(target, 'rejected')} className="p-1 rounded hover:bg-red-50" title="✗" aria-label={`${DECISION_LABEL[lang].rejected} ${target}`}><XCircle size={15} className="text-red-500" /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {data.precursors.length === 0 && <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-500">{t.verdict.no_precursor}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
