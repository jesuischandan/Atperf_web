import { useEffect, useMemo, useState } from 'react';
import type { Priority } from '../FluxTimeline';
import { api, type NoticeRow } from './api';
import NoticePanel from './NoticePanel';
import { CRITERION_LABEL, PRIORITY_LABEL, fmtDate } from './texts';
import { DecisionIcon, ErrorBox, Loading, ScoreBar, type TabProps } from './ui';

const T = {
    fr: {
        search: 'Rechercher un Avis, un symptôme, un équipement…', all: 'Toutes priorités', allEq: 'Tous équipements', open: 'Non clôturés uniquement',
        undecided: 'Sans décision', cols: ['#', 'Avis', 'Date', 'Équipement', 'Symptôme', 'Statut', 'Facteurs', 'Score /100'],
        none: 'Aucun Avis ne correspond aux filtres.', pick: 'Sélectionnez un Avis jaune pour voir la justification de son score et décider.',
        shown: (n: number, total: number) => `${n} Avis sur ${total}`,
    },
    en: {
        search: 'Search a notification, symptom, asset…', all: 'All priorities', allEq: 'All assets', open: 'Not closed only',
        undecided: 'Not reviewed', cols: ['#', 'Notif.', 'Date', 'Asset', 'Symptom', 'Status', 'Drivers', 'Score /100'],
        none: 'No notification matches the filters.', pick: 'Select a yellow notification to see why it scores this way and decide.',
        shown: (n: number, total: number) => `${n} of ${total} notifications`,
    },
};

export default function PrioritiesTab({ datasetId, lang, version, onChanged, selected, onSelect }: TabProps & {
    selected: string | null; onSelect: (code: string) => void;
}) {
    const t = T[lang];
    const [rows, setRows] = useState<NoticeRow[] | null>(null);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [prio, setPrio] = useState<Priority | 'ALL'>('ALL');
    const [eq, setEq] = useState('ALL');
    const [openOnly, setOpenOnly] = useState(true);
    const [undecided, setUndecided] = useState(false);

    useEffect(() => {
        api.notices(datasetId).then(r => setRows(r.notices)).catch(e => setError(e.message));
    }, [datasetId, version]);

    const equipments = useMemo(() => {
        const m = new Map<string, string>();
        rows?.forEach(r => m.set(r.equipment, `${r.equipment_tag}${r.equipment_name ? ` — ${r.equipment_name}` : ''}`));
        return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    }, [rows]);

    if (error) return <ErrorBox message={error} />;
    if (!rows) return <Loading />;

    const q = query.toLowerCase();
    const filtered = rows.filter(r =>
        (prio === 'ALL' || r.priority === prio) && (eq === 'ALL' || r.equipment === eq) && (!openOnly || !r.closed) &&
        (!undecided || !r.decision) &&
        (!q || `${r.code} ${r.symptom} ${r.equipment_tag} ${r.equipment_name}`.toLowerCase().includes(q)));

    return (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
            <div className="min-w-0">
                <div className="flex flex-wrap gap-2 mb-3">
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search}
                        className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <select value={prio} onChange={e => setPrio(e.target.value as Priority | 'ALL')} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                        <option value="ALL">{t.all}</option>
                        {(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_LABEL[lang][p]}</option>)}
                    </select>
                    <select value={eq} onChange={e => setEq(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-sm max-w-[220px]">
                        <option value="ALL">{t.allEq}</option>
                        {equipments.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                    </select>
                </div>
                <div className="flex flex-wrap gap-4 mb-3 text-sm text-slate-600">
                    <label className="inline-flex items-center gap-2"><input type="checkbox" checked={openOnly} onChange={e => setOpenOnly(e.target.checked)} className="accent-[#FF6B00]" /> {t.open}</label>
                    <label className="inline-flex items-center gap-2"><input type="checkbox" checked={undecided} onChange={e => setUndecided(e.target.checked)} className="accent-[#FF6B00]" /> {t.undecided}</label>
                    <span className="ml-auto text-slate-400">{t.shown(filtered.length, rows.length)}</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>{t.cols.map((c, i) => <th key={c} className={`text-left font-semibold px-3 py-2.5 whitespace-nowrap ${i === 6 ? 'hidden 2xl:table-cell' : ''}`}>{c}</th>)}</tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.code} onClick={() => onSelect(r.code)}
                                    className={`border-t border-slate-100 cursor-pointer hover:bg-orange-50/50 ${selected === r.code ? 'bg-orange-50' : ''}`}>
                                    <td className="px-3 py-2 text-slate-400 tabular-nums">{r.rank}</td>
                                    <td className="px-3 py-2 font-semibold whitespace-nowrap">{r.code} <DecisionIcon decision={r.decision} lang={lang} /></td>
                                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">{fmtDate(r.date, lang)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{r.equipment_tag}</td>
                                    <td className="px-3 py-2 text-slate-600 min-w-[160px]">{r.symptom}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">{r.status}</td>
                                    <td className="hidden 2xl:table-cell px-3 py-2 text-xs text-slate-500 min-w-[140px]">{r.drivers.map(c => CRITERION_LABEL[lang][c]).join(' · ')}</td>
                                    <td className="px-3 py-2"><ScoreBar value={r.score} priority={r.priority} /></td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">{t.none}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
                {selected ? <NoticePanel datasetId={datasetId} code={selected} lang={lang} version={version} onChanged={onChanged} />
                    : <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 text-sm">{t.pick}</div>}
            </aside>
        </div>
    );
}
