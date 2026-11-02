import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { api, CRITERIA, type Criterion, type Dataset } from './api';
import { CRITERION_LABEL } from './texts';
import { ErrorBox, type TabProps } from './ui';

const DEFAULT_WEIGHTS: Record<Criterion, number> = { criticality: 25, recurrence: 20, similarity: 20, age: 15, severity: 10, context: 10 };

const WINDOW_KEYS = ['recurrence_days', 'similarity_days', 'link_days', 'review_every_days', 'horizon_days'] as const;

const T = {
    fr: {
        weights: 'Pondérations (total = 100)', total: 'Total', mustTotal: 'Les pondérations doivent totaliser 100.',
        thresholds: 'Seuils de priorité', high: 'Priorité haute ≥', medium: 'Priorité moyenne ≥',
        windows: 'Fenêtres de calcul (jours)', comment: 'Motif du changement (tracé dans le journal)', save: 'Enregistrer', saved: 'Paramètres enregistrés — scores recalculés.',
        reset: 'Revenir aux pondérations par défaut',
        win: { recurrence_days: 'Récurrence : Avis antérieurs comptés sur', similarity_days: 'Similarité : pannes antérieures considérées sur', link_days: 'Rapprochement jaune → rouge : délai maximum', review_every_days: 'Rejeu : fréquence des revues', horizon_days: 'Mesure des alertes : horizon' },
        rules: 'Règles appliquées (V1, sans IA)',
        ruleList: [
            'Criticité : référentiel équipements (critique 5, élevée 4, moyenne 3, faible 1 ; 3 si non renseignée).',
            'Récurrence : nombre d’Avis jaunes antérieurs sur le même équipement dans la fenêtre (plafonné à 5).',
            'Similarité : 5 si une panne antérieure du même équipement partage une famille de symptômes, 3 si autre famille, 2 si même sous-ensemble et même famille.',
            'Ancienneté : 1 à 3 selon l’âge (≥ 15, 45, 90 jours) + 1 si reporté, + 2 si reporté 3 fois ou plus (plafonné à 5).',
            'Gravité : selon la famille de symptômes (thermique, pression 4 ; étanchéité, vibration, débit, mécanique 3 ; électrique 2) + 1 si le texte signale une aggravation.',
            'Contexte : saisie manuelle par un expert (0 si non renseigné).',
        ],
    },
    en: {
        weights: 'Weights (total = 100)', total: 'Total', mustTotal: 'Weights must add up to 100.',
        thresholds: 'Priority thresholds', high: 'High priority ≥', medium: 'Medium priority ≥',
        windows: 'Calculation windows (days)', comment: 'Reason for the change (kept in the log)', save: 'Save', saved: 'Parameters saved — scores recalculated.',
        reset: 'Back to default weights',
        win: { recurrence_days: 'Recurrence: earlier notifications counted over', similarity_days: 'Similarity: earlier breakdowns considered over', link_days: 'Yellow → red match: maximum delay', review_every_days: 'Replay: review frequency', horizon_days: 'Alert measurement: horizon' },
        rules: 'Rules applied (V1, no AI)',
        ruleList: [
            'Criticality: asset reference list (critical 5, high 4, medium 3, low 1; 3 when missing).',
            'Recurrence: number of earlier yellow notifications on the same asset within the window (capped at 5).',
            'Similarity: 5 if an earlier breakdown on the same asset shares a symptom family, 3 if another family, 2 if same sub-assembly and same family.',
            'Age: 1 to 3 by age (≥ 15, 45, 90 days) + 1 if postponed, + 2 if postponed 3 times or more (capped at 5).',
            'Severity: by symptom family (thermal, pressure 4; sealing, vibration, flow, mechanical 3; electrical 2) + 1 if the text reports worsening.',
            'Context: manual input by an expert (0 when not entered).',
        ],
    },
};

export default function SettingsTab({ dataset, lang, onChanged }: TabProps & { dataset: Dataset }) {
    const t = T[lang];
    const [weights, setWeights] = useState<Record<Criterion, number>>({ ...dataset.weights });
    const [thresholds, setThresholds] = useState({ ...dataset.thresholds });
    const [windows, setWindows] = useState<Record<string, number>>({ ...dataset.windows });
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const total = CRITERIA.reduce((s, c) => s + (weights[c] || 0), 0);

    const save = async () => {
        setBusy(true); setError(''); setSaved(false);
        try {
            await api.saveConfig(dataset.id, { weights, thresholds, windows, comment });
            setSaved(true); setComment(''); onChanged();
        } catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-8">
                {error && <ErrorBox message={error} />}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold">{t.weights}</h3>
                        <span className={`text-sm font-bold tabular-nums ${total === 100 ? 'text-slate-500' : 'text-red-600'}`}>{t.total} {total}/100</span>
                    </div>
                    <div className="space-y-4">
                        {CRITERIA.map(c => (
                            <label key={c} className="block text-sm">
                                <span className="flex justify-between text-slate-700 mb-1">{CRITERION_LABEL[lang][c]} <b className="tabular-nums">{weights[c]}</b></span>
                                <input type="range" min={0} max={50} value={weights[c]} className="w-full accent-[#FF6B00]"
                                    onChange={e => setWeights(w => ({ ...w, [c]: Number(e.target.value) }))} />
                            </label>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                        {total !== 100 ? <p className="text-sm text-red-600 inline-flex items-center gap-1.5"><AlertTriangle size={15} /> {t.mustTotal}</p> : <span />}
                        <button onClick={() => setWeights({ ...DEFAULT_WEIGHTS })} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50">
                            <RotateCcw size={13} /> {t.reset}
                        </button>
                    </div>
                </section>

                <section>
                    <h3 className="font-bold mb-3">{t.thresholds}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {(['high', 'medium'] as const).map(k => (
                            <label key={k} className="block text-sm">
                                <span className="block text-slate-700 mb-1">{t[k]}</span>
                                <input type="number" min={1} max={100} value={thresholds[k]} onChange={e => setThresholds(th => ({ ...th, [k]: Number(e.target.value) }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                            </label>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="font-bold mb-3">{t.windows}</h3>
                    <div className="space-y-3">
                        {WINDOW_KEYS.map(k => (
                            <label key={k} className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-slate-700">{t.win[k]}</span>
                                <input type="number" min={1} max={3650} value={windows[k] ?? ''} onChange={e => setWindows(w => ({ ...w, [k]: Number(e.target.value) }))}
                                    className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-right" />
                            </label>
                        ))}
                    </div>
                </section>

                <section>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t.comment} rows={2}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3" />
                    <div className="flex flex-wrap items-center gap-3">
                        <button disabled={busy || total !== 100} onClick={save}
                            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl">
                            {busy && <Loader2 size={16} className="animate-spin" />} {t.save}
                        </button>
                        {saved && <span className="text-sm text-emerald-700 inline-flex items-center gap-1.5"><CheckCircle2 size={16} /> {t.saved}</span>}
                    </div>
                </section>
            </div>

            <aside className="bg-slate-50 border border-slate-200 rounded-2xl p-6 self-start">
                <h3 className="font-bold mb-3">{t.rules}</h3>
                <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">{t.ruleList.map(r => <li key={r}>{r}</li>)}</ul>
            </aside>
        </div>
    );
}
