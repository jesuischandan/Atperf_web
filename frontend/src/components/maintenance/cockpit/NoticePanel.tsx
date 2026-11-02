import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { api, CRITERIA, type Criterion, type NoticeDetail } from './api';
import { CONFIDENCE, CRITERION_LABEL, DECISION_LABEL, explain, families, fmtDate, fmtDateTime, type Lang } from './texts';
import { DecisionIcon, ErrorBox, Loading, PriorityBadge } from './ui';

/* ─────────────────────────────────────────────────────────────
   Notice sheet: explainable score, history, links, checks, expert actions
───────────────────────────────────────────────────────────── */

const T = {
    fr: {
        why: 'Justification du score', history: 'Historique du même équipement', prior: 'Pannes rouges antérieures (utilisées)',
        later: 'Pannes rouges ultérieures (jamais utilisées dans le score)', none: 'Aucune', links: 'Rapprochements avec des pannes rouges',
        noLinks: 'Aucun rapprochement candidat.', imported: 'Fichier importé', engine: 'Proposé par les règles', days: 'j avant',
        checks: 'Vérifications suggérées', checksNote: 'À confirmer par un responsable Maintenance — aucun OT n’est créé automatiquement.',
        expert: 'Décision de l’expert Maintenance', comment: 'Commentaire (optionnel)', validate: 'Valider la priorité', reject: 'Rejeter',
        correct: 'Corriger les notes', auto: 'Auto', contextNone: 'Non renseigné', save: 'Enregistrer la correction', cancel: 'Annuler',
        journal: 'Historique des décisions', noJournal: 'Aucune décision pour l’instant.', families: 'Familles de symptômes',
        validateLink: 'Valider le lien', rejectLink: 'Rejeter le lien', proximity: 'Proximité ≠ causalité : chaque lien reste une hypothèse jusqu’à décision d’un expert.',
        postponements: 'reports', issuer: 'Émetteur',
    },
    en: {
        why: 'Score explanation', history: 'History of the same asset', prior: 'Earlier red breakdowns (used)',
        later: 'Later red breakdowns (never used in the score)', none: 'None', links: 'Matches with red breakdowns',
        noLinks: 'No candidate match.', imported: 'Imported file', engine: 'Suggested by the rules', days: 'd before',
        checks: 'Suggested checks', checksNote: 'To be confirmed by a maintenance manager — no work order is created automatically.',
        expert: 'Maintenance expert decision', comment: 'Comment (optional)', validate: 'Validate priority', reject: 'Reject',
        correct: 'Correct the notes', auto: 'Auto', contextNone: 'Not entered', save: 'Save correction', cancel: 'Cancel',
        journal: 'Decision history', noJournal: 'No decision yet.', families: 'Symptom families',
        validateLink: 'Validate match', rejectLink: 'Reject match', proximity: 'Proximity ≠ causality: each match stays a hypothesis until an expert decides.',
        postponements: 'postponements', issuer: 'Reported by',
    },
};

export default function NoticePanel({ datasetId, code, lang, version, onChanged }: {
    datasetId: string; code: string; lang: Lang; version: number; onChanged: () => void;
}) {
    const t = T[lang];
    const [d, setD] = useState<NoticeDetail | null>(null);
    const [error, setError] = useState('');
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<Partial<Record<Criterion, number | null>>>({});
    const [contextDraft, setContextDraft] = useState<number | null>(null);

    useEffect(() => {
        setD(null); setError(''); setEditing(false); setComment('');
        api.notice(datasetId, code, lang).then(setD).catch(e => setError(e.message));
    }, [datasetId, code, lang, version]);

    const run = async (fn: () => Promise<unknown>) => {
        setBusy(true); setError('');
        try { await fn(); setComment(''); setEditing(false); onChanged(); }
        catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    };

    if (error && !d) return <ErrorBox message={error} />;
    if (!d) return <Loading />;

    const startEditing = () => {
        setDraft(Object.fromEntries(CRITERIA.filter(c => c !== 'context').map(c => [c, d.notice.overrides?.[c] ?? null])));
        setContextDraft(d.notice.context_note);
        setEditing(true);
    };

    const saveCorrection = () => run(() => api.updateNotes(datasetId, code, {
        overrides: draft,
        ...(contextDraft === null ? { clear_context: true } : { context_note: contextDraft }),
        comment,
    }));

    const n = d.notice;
    return (
        <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-5">
            {error && <ErrorBox message={error} />}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xl font-extrabold">{n.code}</div>
                    <div className="text-sm text-slate-600">{n.equipment.tag} — {n.equipment.name}{n.equipment.subsystem ? ` · ${n.equipment.subsystem}` : ''}</div>
                    <div className="text-sm text-slate-500">{fmtDate(n.date, lang)} · {n.category} · {n.status} · {n.postponements} {t.postponements}</div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-3xl font-black tabular-nums">{d.score}</div>
                    <PriorityBadge priority={d.priority} lang={lang} />
                </div>
            </div>
            <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                <b>{n.symptom}</b>{n.description && n.description !== n.symptom ? ` — ${n.description}` : ''}
                {n.issuer && <span className="block text-xs text-slate-500 mt-1">{t.issuer} : {n.issuer}</span>}
                {n.families.length > 0 && <span className="block text-xs text-slate-500">{t.families} : {families(n.families, lang)}</span>}
            </div>

            {/* Score explanation / correction */}
            <section>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.why}</h4>
                    {!editing && <button onClick={startEditing} className="text-xs font-semibold text-[#FF6B00] hover:underline">{t.correct}</button>}
                </div>
                <div className="space-y-3">
                    {CRITERIA.map(c => {
                        const ev = d.evidence[c];
                        return (
                            <div key={c} className="text-sm">
                                <div className="flex justify-between gap-2 text-slate-800">
                                    <span className="font-medium">{CRITERION_LABEL[lang][c]} <span className="text-slate-400">· {ev.note}/5</span></span>
                                    <span className="tabular-nums font-semibold shrink-0">{Math.round(d.points[c])} / {d.weights[c]}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden my-1">
                                    <div className={`h-full ${ev.overridden ? 'bg-indigo-500' : 'bg-[#FF6B00]'}`} style={{ width: `${(ev.note / 5) * 100}%` }} />
                                </div>
                                <p className="text-xs text-slate-500">{explain(ev, lang)}</p>
                                {editing && (
                                    <select aria-label={CRITERION_LABEL[lang][c]} className="mt-1 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                        value={c === 'context' ? (contextDraft ?? '') : (draft[c] ?? '')}
                                        onChange={e => {
                                            const v = e.target.value === '' ? null : Number(e.target.value);
                                            if (c === 'context') setContextDraft(v); else setDraft(prev => ({ ...prev, [c]: v }));
                                        }}>
                                        <option value="">{c === 'context' ? t.contextNone : `${t.auto} (${ev.overridden ? (ev.detail.computed as number) : ev.note}/5)`}</option>
                                        {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}/5</option>)}
                                    </select>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* History */}
            <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.history}</h4>
                <p className="text-sm text-slate-700">{t.prior} :</p>
                <ul className="text-sm text-slate-600 mb-2 pl-5 list-disc">
                    {d.prior_reds.length ? d.prior_reds.map(o => <li key={o.code}>{o.code} · {fmtDate(o.date, lang)} · {o.symptom}{o.cause ? ` (${o.cause})` : ''}</li>) : <li className="list-none -ml-5 text-slate-400">{t.none}</li>}
                </ul>
                <p className="text-sm text-slate-400">{t.later} :</p>
                <ul className="text-sm text-slate-400 pl-5 list-disc">
                    {d.later_reds.length ? d.later_reds.map(o => <li key={o.code}>{o.code} · {fmtDate(o.date, lang)} · {o.symptom}</li>) : <li className="list-none -ml-5">{t.none}</li>}
                </ul>
            </section>

            {/* Links */}
            <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.links}</h4>
                {d.links.length === 0 ? <p className="text-sm text-slate-400">{t.noLinks}</p> : (
                    <ul className="space-y-2">
                        {d.links.map(l => (
                            <li key={l.work_order} className="text-sm border border-slate-100 rounded-lg p-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold">→ {l.work_order}{l.lead_days != null && <span className="font-normal text-slate-500"> · {l.lead_days} {t.days}</span>} <DecisionIcon decision={l.decision} lang={lang} /></span>
                                    <span className="flex gap-1">
                                        <button disabled={busy} onClick={() => run(() => api.decide(datasetId, { target_type: 'link', target: `${l.notice}>${l.work_order}`, decision: 'validated', comment }))}
                                            className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200" title={t.validateLink}><CheckCircle2 size={13} className="inline" /></button>
                                        <button disabled={busy} onClick={() => run(() => api.decide(datasetId, { target_type: 'link', target: `${l.notice}>${l.work_order}`, decision: 'rejected', comment }))}
                                            className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 hover:bg-red-50 hover:border-red-200" title={t.rejectLink}><XCircle size={13} className="inline" /></button>
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {l.confidence ? CONFIDENCE[lang][l.confidence] : t.imported}
                                    {l.imported_status ? ` · ${t.imported} : ${l.imported_status}` : ''}
                                    {l.decision ? ` · ${DECISION_LABEL[lang][l.decision.decision]} (${l.decision.actor_name})` : ''}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="text-xs text-slate-400 mt-2">{t.proximity}</p>
            </section>

            {d.checks.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.checks}</h4>
                    <ul className="text-sm text-slate-700 list-disc pl-5">{d.checks.map(c => <li key={c}>{c}</li>)}</ul>
                    <p className="text-xs text-slate-500 mt-1">{t.checksNote}</p>
                </section>
            )}

            {/* Expert decision */}
            <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.expert}</h4>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t.comment} rows={2} maxLength={2000}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2" />
                {editing ? (
                    <div className="flex flex-wrap gap-2">
                        <button disabled={busy} onClick={saveCorrection} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2">
                            {busy && <Loader2 size={14} className="animate-spin" />} {t.save}
                        </button>
                        <button onClick={() => setEditing(false)} className="text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2">{t.cancel}</button>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <button disabled={busy} onClick={() => run(() => api.decide(datasetId, { target_type: 'notice', target: code, decision: 'validated', comment }))}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2"><CheckCircle2 size={15} /> {t.validate}</button>
                        <button disabled={busy} onClick={() => run(() => api.decide(datasetId, { target_type: 'notice', target: code, decision: 'rejected', comment }))}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold border border-slate-200 hover:bg-slate-50 rounded-lg px-3 py-2"><XCircle size={15} /> {t.reject}</button>
                    </div>
                )}
            </section>

            <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.journal}</h4>
                {d.history.length === 0 ? <p className="text-sm text-slate-400">{t.noJournal}</p> : (
                    <ul className="space-y-1.5 text-sm">
                        {d.history.map(h => (
                            <li key={h.id} className="text-slate-600">
                                <DecisionIcon decision={h} lang={lang} /> <b>{DECISION_LABEL[lang][h.decision]}</b>
                                {h.target_type === 'link' ? ` · ${h.target.replace('>', ' → ')}` : ''}
                                {h.score_snapshot != null ? ` · ${h.score_snapshot}/100` : ''} — {h.actor_name}, {fmtDateTime(h.created_at, lang)}
                                {h.comment && <span className="block text-xs text-slate-500 pl-5">« {h.comment} »</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
