import { useEffect, useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { OWNERS, OWNER_LABEL, STATUSES, STATUS_LABEL, STATUS_STYLE, type DemoAction } from './actions';
import { STUDY_DATE } from '../scoring';

/* Action, owner, due date and status for one yellow notice (demonstrator). */

const T = {
    fr: {
        title: 'Action et suivi', action: 'Action décidée', actionPh: 'Ex. : contrôle vibratoire à la prochaine fenêtre d’arrêt', owner: 'Responsable',
        due: 'Échéance', status: 'Statut', comment: 'Commentaire (optionnel)', save: 'Enregistrer', saved: 'Enregistré',
        note: 'Démonstrateur : le suivi reste dans votre navigateur et n’est envoyé nulle part. Aucun OT n’est créé.',
        example: 'Exemple pré-rempli', reference: 'Date de référence du démonstrateur',
    },
    en: {
        title: 'Action and follow-up', action: 'Decided action', actionPh: 'e.g. vibration check at the next stoppage window', owner: 'Owner',
        due: 'Due date', status: 'Status', comment: 'Comment (optional)', save: 'Save', saved: 'Saved',
        note: 'Demonstrator: follow-up stays in your browser and is not sent anywhere. No work order is created.',
        example: 'Pre-filled example', reference: 'Demonstrator reference date',
    },
};

export default function ActionEditor({ noticeId, lang, value, suggestion, onSave }: {
    noticeId: string; lang: 'fr' | 'en'; value?: DemoAction; suggestion?: string; onSave: (a: DemoAction) => void;
}) {
    const t = T[lang];
    const blank: DemoAction = { noticeId, action: '', owner: 'maintenance_manager', due: '', status: 'to_review', comment: '', updatedAt: STUDY_DATE };
    const [draft, setDraft] = useState<DemoAction>(value ?? blank);
    const [saved, setSaved] = useState(false);

    // Reset the form only when another notice is opened.
    useEffect(() => { setDraft(value ?? { ...blank, noticeId }); setSaved(false); }, [noticeId]);

    const set = <K extends keyof DemoAction>(k: K, v: DemoAction[K]) => { setDraft(d => ({ ...d, [k]: v })); setSaved(false); };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.title}</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[draft.status]}`}>{STATUS_LABEL[lang][draft.status]}</span>
            </div>
            {value?.example && <p className="text-xs text-slate-400 mb-2">{t.example}</p>}
            <div className="space-y-3">
                <label className="block text-xs">
                    <span className="block font-semibold text-slate-600 mb-1">{t.action}</span>
                    <textarea value={draft.action || ''} onChange={e => set('action', e.target.value)} rows={2} placeholder={suggestion || t.actionPh}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs">
                        <span className="block font-semibold text-slate-600 mb-1">{t.owner}</span>
                        <select value={draft.owner} onChange={e => set('owner', e.target.value as DemoAction['owner'])} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm">
                            {OWNERS.map(o => <option key={o} value={o}>{OWNER_LABEL[lang][o]}</option>)}
                        </select>
                    </label>
                    <label className="block text-xs">
                        <span className="block font-semibold text-slate-600 mb-1">{t.due}</span>
                        <input type="date" value={draft.due} onChange={e => set('due', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
                    </label>
                </div>
                <label className="block text-xs">
                    <span className="block font-semibold text-slate-600 mb-1">{t.status}</span>
                    <select value={draft.status} onChange={e => set('status', e.target.value as DemoAction['status'])} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm">
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[lang][s]}</option>)}
                    </select>
                </label>
                <label className="block text-xs">
                    <span className="block font-semibold text-slate-600 mb-1">{t.comment}</span>
                    <input value={draft.comment} onChange={e => set('comment', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </label>
                <button onClick={() => { onSave({ ...draft, action: draft.action || suggestion || '', example: false, updatedAt: new Date().toISOString().slice(0, 10) }); setSaved(true); }}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2">
                    {saved ? <CheckCircle2 size={15} /> : <Save size={15} />} {saved ? t.saved : t.save}
                </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">{t.note} {t.reference} : {STUDY_DATE}.</p>
        </div>
    );
}
