import { AlertTriangle, RotateCcw } from 'lucide-react';
import { equipmentById, STUDY_DATE, type ScoredNotice } from '../scoring';
import { OWNER_LABEL, STATUS_LABEL, STATUS_STYLE, isOpenAction, isOverdue, type DemoAction } from './actions';

/* Follow-up of the actions decided on yellow notices (demonstrator). */

const T = {
    fr: {
        intro: 'Suivi des actions décidées sur les Avis jaunes : qui fait quoi, pour quand, et où en est-on. Ouvrez un Avis dans l’onglet « Avis jaunes priorisés » pour décider une action.',
        open: 'Actions ouvertes', overdue: 'En retard', done: 'Réalisées', notRetained: 'Non retenues',
        cols: ['Avis', 'Équipement', 'Score', 'Action', 'Responsable', 'Échéance', 'Statut'],
        empty: 'Aucune action pour l’instant.', late: 'en retard', reset: 'Réinitialiser les exemples',
        reference: (d: string) => `Retards calculés à la date de référence du démonstrateur (${d}).`,
    },
    en: {
        intro: 'Follow-up of actions decided on yellow notifications: who does what, by when, and where things stand. Open a notification in the "Prioritised yellows" tab to decide an action.',
        open: 'Open actions', overdue: 'Overdue', done: 'Done', notRetained: 'Not retained',
        cols: ['Notif.', 'Asset', 'Score', 'Action', 'Owner', 'Due', 'Status'],
        empty: 'No action yet.', late: 'overdue', reset: 'Reset the examples',
        reference: (d: string) => `Overdue status computed at the demonstrator reference date (${d}).`,
    },
};

export default function ActionsTab({ lang, actions, scored, onOpen, onReset }: {
    lang: 'fr' | 'en'; actions: Record<string, DemoAction>; scored: ScoredNotice[];
    onOpen: (noticeId: string) => void; onReset: () => void;
}) {
    const t = T[lang];
    const byId = new Map(scored.map(n => [n.id, n]));
    const list = Object.values(actions)
        .filter(a => byId.has(a.noticeId))
        .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)) || Number(isOpenAction(b)) - Number(isOpenAction(a)) || (a.due || '9').localeCompare(b.due || '9'));

    const kpis = [
        { label: t.open, value: list.filter(isOpenAction).length, cls: 'border-slate-200' },
        { label: t.overdue, value: list.filter(isOverdue).length, cls: 'border-red-200 bg-red-50 text-red-700' },
        { label: t.done, value: list.filter(a => a.status === 'done').length, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
        { label: t.notRetained, value: list.filter(a => a.status === 'not_retained').length, cls: 'border-slate-200 text-slate-500' },
    ];

    return (
        <div>
            <p className="text-slate-600 mb-6 max-w-3xl">{t.intro}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpis.map(k => (
                    <div key={k.label} className={`rounded-xl border p-4 ${k.cls}`}>
                        <div className="text-3xl font-black tabular-nums">{k.value}</div>
                        <div className="text-sm font-medium opacity-80">{k.label}</div>
                    </div>
                ))}
            </div>
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>{t.cols.map(c => <th key={c} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                        {list.map(a => {
                            const n = byId.get(a.noticeId)!;
                            return (
                                <tr key={a.noticeId} onClick={() => onOpen(a.noticeId)} className="border-t border-slate-100 cursor-pointer hover:bg-orange-50/50">
                                    <td className="px-3 py-2 font-semibold whitespace-nowrap">{a.noticeId}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{equipmentById.get(n.equipmentId)?.tag}</td>
                                    <td className="px-3 py-2 tabular-nums">{n.score}</td>
                                    <td className="px-3 py-2 text-slate-600 min-w-[200px]">{a.action || n.symptom}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{OWNER_LABEL[lang][a.owner]}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap ${isOverdue(a) ? 'text-red-700 font-semibold' : 'text-slate-600'}`}>
                                        {a.due || '—'} {isOverdue(a) && <span className="inline-flex items-center gap-1 text-xs"><AlertTriangle size={12} /> {t.late}</span>}
                                    </td>
                                    <td className="px-3 py-2"><span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[a.status]}`}>{STATUS_LABEL[lang][a.status]}</span></td>
                                </tr>
                            );
                        })}
                        {list.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">{t.empty}</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                <p className="text-xs text-slate-500">{t.reference(STUDY_DATE)}</p>
                <button onClick={onReset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
                    <RotateCcw size={13} /> {t.reset}
                </button>
            </div>
        </div>
    );
}
