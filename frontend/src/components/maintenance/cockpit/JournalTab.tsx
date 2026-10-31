import { useEffect, useState } from 'react';
import { api, type Decision } from './api';
import { DECISION_LABEL, fmtDateTime } from './texts';
import { DecisionIcon, ErrorBox, Loading, type TabProps } from './ui';

const T = {
    fr: { empty: 'Aucune décision enregistrée pour l’instant.', cols: ['Date', 'Décision', 'Cible', 'Score', 'Par', 'Commentaire'], config: 'Paramètres', notice: 'Avis', link: 'Lien' },
    en: { empty: 'No decision recorded yet.', cols: ['Date', 'Decision', 'Target', 'Score', 'By', 'Comment'], config: 'Parameters', notice: 'Notification', link: 'Match' },
};

export default function JournalTab({ datasetId, lang, version, onOpenNotice }: TabProps & { onOpenNotice: (code: string) => void }) {
    const t = T[lang];
    const [rows, setRows] = useState<Decision[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => { api.decisions(datasetId).then(setRows).catch(e => setError(e.message)); }, [datasetId, version]);

    if (error) return <ErrorBox message={error} />;
    if (!rows) return <Loading />;
    if (rows.length === 0) return <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 text-sm">{t.empty}</div>;

    return (
        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>{t.cols.map(c => <th key={c} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.id} className="border-t border-slate-100 align-top">
                            <td className="px-3 py-2 whitespace-nowrap text-slate-600">{fmtDateTime(r.created_at, lang)}</td>
                            <td className="px-3 py-2 whitespace-nowrap"><DecisionIcon decision={r} lang={lang} /> {DECISION_LABEL[lang][r.decision]}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                                <span className="text-xs text-slate-400 mr-1">{t[r.target_type]}</span>
                                {r.target_type === 'config' ? '' : r.target_type === 'notice'
                                    ? <button onClick={() => onOpenNotice(r.target)} className="font-semibold hover:text-[#FF6B00] hover:underline">{r.target}</button>
                                    : <button onClick={() => onOpenNotice(r.target.split('>')[0])} className="font-semibold hover:text-[#FF6B00] hover:underline">{r.target.replace('>', ' → ')}</button>}
                            </td>
                            <td className="px-3 py-2 tabular-nums">{r.score_snapshot ?? '—'}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{r.actor_name}</td>
                            <td className="px-3 py-2 text-slate-600 min-w-[200px]">{r.comment ?? ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
