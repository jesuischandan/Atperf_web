import { useEffect, useState } from 'react';
import FluxTimeline, { TimelineLegend, type TimelineEvent } from '../FluxTimeline';
import { api, type Overview } from './api';
import { ErrorBox, Kpi, Loading, type TabProps } from './ui';
import { fmtDate } from './texts';

const T = {
    fr: { red: 'OT rouges (pannes)', green: 'Préventifs (Avis + OT)', yellow: 'Avis jaunes', high: 'Jaunes en priorité haute', openHigh: 'dont non clôturés', decisions: 'Avis déjà examinés', timeline: 'Chronologie des trois flux par équipement', hint: 'Cliquez sur un Avis jaune pour ouvrir sa fiche.', study: 'Date d’étude' },
    en: { red: 'Red WOs (breakdowns)', green: 'Preventive (notif. + WO)', yellow: 'Yellow notifications', high: 'Yellows at high priority', openHigh: 'not closed', decisions: 'Notifications already reviewed', timeline: 'Timeline of the three flows by asset', hint: 'Click a yellow notification to open its sheet.', study: 'Study date' },
};

const shift = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);

export default function OverviewTab({ datasetId, lang, version, onOpenNotice }: TabProps & { onOpenNotice: (code: string) => void }) {
    const t = T[lang];
    const [data, setData] = useState<Overview | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.overview(datasetId).then(setData).catch(e => setError(e.message));
    }, [datasetId, version]);

    if (error) return <ErrorBox message={error} />;
    if (!data) return <Loading />;

    const events: TimelineEvent[] = data.events.map(ev => ({
        id: ev.code, date: ev.date, equipmentId: ev.equipment,
        kind: ev.flux === 'ROUGE' ? 'red' : ev.flux === 'VERT' ? 'green' : 'yellow',
        priority: ev.priority ?? undefined,
        label: `${ev.code} · ${ev.date} · ${ev.symptom}${ev.score != null ? ` · ${ev.score}/100` : ''}`,
    }));
    const dates = data.events.map(e => e.date).sort();
    const range = dates.length ? { start: shift(dates[0], -10), end: shift(dates[dates.length - 1], 10) } : null;

    return (
        <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Kpi tone="red" value={data.flux.ROUGE.work_orders + data.flux.ROUGE.notices} label={t.red} />
                <Kpi tone="green" value={data.flux.VERT.work_orders + data.flux.VERT.notices} label={t.green} />
                <Kpi tone="yellow" value={data.flux.JAUNE.notices + data.flux.JAUNE.work_orders} label={t.yellow} />
                <Kpi tone="dark" value={data.priorities.HIGH} sub={`${data.open_high} ${t.openHigh}`} label={t.high} />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h2 className="text-lg font-bold">{t.timeline}</h2>
                <span className="text-xs text-slate-500">{t.study} : {fmtDate(data.study_date, lang)} · {t.decisions} : {data.decisions}</span>
            </div>
            {range && (
                <div className="border border-slate-200 rounded-xl p-3 mb-3 bg-white">
                    <FluxTimeline equipments={data.equipments.map(e => ({ id: e.code, name: e.name, tag: e.tag }))} events={events}
                        start={range.start} end={range.end} lang={lang} onSelect={onOpenNotice} />
                </div>
            )}
            <div className="flex flex-wrap justify-between gap-3">
                <TimelineLegend lang={lang} />
                <p className="text-xs text-slate-500">{t.hint}</p>
            </div>
        </div>
    );
}
