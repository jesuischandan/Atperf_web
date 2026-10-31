import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { api, type Backtest } from './api';
import { fmtDate } from './texts';
import { ErrorBox, Kpi, Loading, type TabProps } from './ui';

const T = {
    fr: {
        intro: 'Sur tout l’historique : combien de pannes rouges auraient été précédées d’une alerte, et combien d’alertes n’ont été suivies d’aucune panne ? Chaque Avis est revu chaque semaine tant qu’il est ouvert, avec les seules données connues à la date de revue.',
        threshold: 'Seuil d’alerte', horizon: 'Horizon', days: 'jours',
        coverage: 'Pannes couvertes par une alerte', alerts: 'Alertes émises', falseAlerts: 'Alertes sans panne ultérieure', noPre: 'Pannes sans précurseur', lead: 'Avance médiane',
        caution: 'Le score exprime une priorité métier, pas une probabilité de panne. Une alerte non suivie de panne n’est pas forcément une erreur : l’Avis a pu être traité à temps. Ces mesures servent à calibrer règles, pondérations et seuil avec les experts.',
        perRed: 'Détail par panne rouge', falseList: 'Alertes non suivies d’une panne', covered: 'Couverte', notCovered: 'Non couverte',
        precursors: 'Avis jaunes dans l’horizon', flaggedOn: 'Signalé le', open: 'Ouvrir',
    },
    en: {
        intro: 'Across the whole history: how many red breakdowns were preceded by an alert, and how many alerts were followed by no breakdown? Each notification is reviewed weekly while open, using only data known at each review.',
        threshold: 'Alert threshold', horizon: 'Horizon', days: 'days',
        coverage: 'Breakdowns covered by an alert', alerts: 'Alerts raised', falseAlerts: 'Alerts with no later breakdown', noPre: 'Breakdowns without precursor', lead: 'Median lead time',
        caution: 'The score is a business priority, not a failure probability. An alert with no later breakdown is not necessarily wrong: the notification may have been handled in time. Use these measures to calibrate rules, weights and threshold with the experts.',
        perRed: 'Per red breakdown', falseList: 'Alerts not followed by a breakdown', covered: 'Covered', notCovered: 'Not covered',
        precursors: 'Yellow notifications in horizon', flaggedOn: 'Flagged on', open: 'Open',
    },
};

export default function BacktestTab({ datasetId, lang, version, defaultThreshold, defaultHorizon, onOpenNotice, onOpenReplay }: TabProps & {
    defaultThreshold: number; defaultHorizon: number; onOpenNotice: (code: string) => void; onOpenReplay: (wo: string) => void;
}) {
    const t = T[lang];
    const [threshold, setThreshold] = useState(defaultThreshold);
    const [horizon, setHorizon] = useState(defaultHorizon);
    const [data, setData] = useState<Backtest | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            api.backtest(datasetId, threshold, horizon).then(setData).catch(e => setError(e.message));
        }, 250);
        return () => clearTimeout(timer);
    }, [datasetId, threshold, horizon, version]);

    if (error) return <ErrorBox message={error} />;

    return (
        <div>
            <p className="text-slate-600 mb-6 max-w-3xl">{t.intro}</p>
            <div className="flex flex-wrap gap-8 mb-6">
                <label className="block text-sm w-64">
                    <span className="flex justify-between font-semibold text-slate-700 mb-1">{t.threshold} <b className="tabular-nums">{threshold}/100</b></span>
                    <input type="range" min={30} max={95} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
                </label>
                <label className="block text-sm w-64">
                    <span className="flex justify-between font-semibold text-slate-700 mb-1">{t.horizon} <b className="tabular-nums">{horizon} {t.days}</b></span>
                    <input type="range" min={15} max={180} step={5} value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
                </label>
            </div>
            {!data ? <Loading /> : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <Kpi value={`${data.covered}/${data.reds}`} sub={data.coverage != null ? `${Math.round(data.coverage * 100)} %` : undefined} label={t.coverage} />
                        <Kpi value={data.alerts} label={t.alerts} />
                        <Kpi value={data.false_alerts} sub={data.false_alert_rate != null ? `${Math.round(data.false_alert_rate * 100)} %` : undefined} label={t.falseAlerts} />
                        <Kpi value={data.no_precursor} label={t.noPre} />
                        <Kpi value={data.median_lead_days == null ? '—' : `${data.median_lead_days} ${lang === 'fr' ? 'j' : 'd'}`} label={t.lead} />
                    </div>
                    <div className="flex gap-3 items-start bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 mb-8">
                        <Info size={18} className="shrink-0 mt-0.5 text-slate-500" /><p>{t.caution}</p>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <section>
                            <h3 className="font-bold mb-3">{t.perRed}</h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[480px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {data.per_red.map(r => (
                                            <tr key={r.work_order} className="border-t first:border-t-0 border-slate-100">
                                                <td className="px-3 py-2 font-semibold"><button onClick={() => onOpenReplay(r.work_order)} className="hover:text-[#FF6B00] hover:underline">{r.work_order}</button></td>
                                                <td className="px-3 py-2">{r.covered
                                                    ? <span className="text-emerald-700 font-semibold">{t.covered} ({lang === 'fr' ? 'J-' : 'D-'}{r.lead_days})</span>
                                                    : <span className="text-slate-400">{t.notCovered}</span>}</td>
                                                <td className="px-3 py-2 text-xs text-slate-500 text-right">{r.precursors} {t.precursors}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        <section>
                            <h3 className="font-bold mb-3">{t.falseList} ({data.false_alert_list.length})</h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[480px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {data.false_alert_list.map(f => (
                                            <tr key={f.notice} className="border-t first:border-t-0 border-slate-100">
                                                <td className="px-3 py-2 font-semibold"><button onClick={() => onOpenNotice(f.notice)} className="hover:text-[#FF6B00] hover:underline">{f.notice}</button></td>
                                                <td className="px-3 py-2 text-slate-600">{t.flaggedOn} {fmtDate(f.flagged_on, lang)}</td>
                                                <td className="px-3 py-2 text-right font-bold tabular-nums">{f.score}</td>
                                            </tr>
                                        ))}
                                        {data.false_alert_list.length === 0 && <tr><td className="px-3 py-6 text-center text-slate-400">—</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
