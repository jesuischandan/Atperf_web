import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, X } from 'lucide-react';
import { api, type ImportPreview, type ImportReport, type ImportTable } from './api';
import { FIELD_LABEL, ISSUE_LABEL, TABLE_LABEL, type Lang } from './texts';

/* ─────────────────────────────────────────────────────────────
   Import: upload → check the column mapping → import report
───────────────────────────────────────────────────────────── */

const T = {
    fr: {
        title: 'Importer des historiques Avis / OT',
        step1: 'Déposez un classeur Excel (une feuille par table) ou jusqu’à quatre fichiers CSV : équipements, Avis, OT et, si vous en avez, rapprochements déjà expertisés.',
        choose: 'Choisir des fichiers', analysing: 'Analyse du fichier…', analyse: 'Analyser',
        step2: 'Vérifiez la correspondance des colonnes. Les champs marqués * sont obligatoires.',
        source: 'Feuille / fichier', none: '— Aucun —', notMapped: '— Non utilisé —',
        name: 'Nom du jeu de données', company: 'Entreprise', internal: 'Interne Atperf (équipe uniquement)',
        sample: 'Aperçu', importBtn: 'Importer', importing: 'Import…', back: 'Retour',
        done: 'Import terminé', counts: (c: ImportReport['counts']) => `${c.equipments} équipements, ${c.notices} Avis, ${c.work_orders} OT, ${c.links} rapprochements`,
        issues: (n: number) => `${n} point(s) à vérifier`, noIssue: 'Aucune anomalie détectée.', open: 'Ouvrir le cockpit',
        row: 'ligne', privacy: 'Les données importées restent rattachées à l’entreprise choisie : seuls ses utilisateurs pilotes et l’équipe Atperf y ont accès.',
    },
    en: {
        title: 'Import notification / work-order history',
        step1: 'Drop one Excel workbook (one sheet per table) or up to four CSV files: assets, notifications, work orders and, if you have them, matches already reviewed by experts.',
        choose: 'Choose files', analysing: 'Reading the file…', analyse: 'Analyse',
        step2: 'Check how columns are mapped. Fields marked * are required.',
        source: 'Sheet / file', none: '— None —', notMapped: '— Not used —',
        name: 'Dataset name', company: 'Company', internal: 'Atperf internal (staff only)',
        sample: 'Preview', importBtn: 'Import', importing: 'Importing…', back: 'Back',
        done: 'Import complete', counts: (c: ImportReport['counts']) => `${c.equipments} assets, ${c.notices} notifications, ${c.work_orders} WOs, ${c.links} matches`,
        issues: (n: number) => `${n} item(s) to check`, noIssue: 'No issue detected.', open: 'Open the cockpit',
        row: 'row', privacy: 'Imported data stays attached to the selected company: only its pilot users and the Atperf team can access it.',
    },
};

const TABLES: ImportTable[] = ['notices', 'work_orders', 'equipments', 'links'];

export default function ImportWizard({ lang, isStaff, companies, onClose, onImported }: {
    lang: Lang; isStaff: boolean; companies: { company_id: string; company_name: string }[];
    onClose: () => void; onImported: (id: string) => void;
}) {
    const t = T[lang];
    const [files, setFiles] = useState<File[]>([]);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [tables, setTables] = useState<ImportPreview['tables'] | null>(null);
    const [name, setName] = useState('');
    const [companyId, setCompanyId] = useState<string>(isStaff ? '' : companies[0]?.company_id ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ id: string; report: ImportReport } | null>(null);

    const analyse = async () => {
        setBusy(true); setError('');
        try {
            const p = await api.preview(files);
            setPreview(p);
            setTables(p.tables);
            setName(files[0]?.name.replace(/\.(xlsx|xlsm|xls|csv|txt)$/i, '') ?? '');
        } catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    };

    const setSource = (table: ImportTable, source: number | null) => {
        if (!tables || !preview) return;
        const cols = source === null ? [] : preview.sources[source].columns;
        // Keep mapped columns that still exist in the new source.
        const mapping = Object.fromEntries(Object.entries(tables[table].mapping).map(([f, c]) => [f, c && cols.includes(c) ? c : null]));
        setTables({ ...tables, [table]: { ...tables[table], source, mapping } });
    };

    const setColumn = (table: ImportTable, field: string, column: string | null) => {
        if (!tables) return;
        setTables({ ...tables, [table]: { ...tables[table], mapping: { ...tables[table].mapping, [field]: column } } });
    };

    const commit = async () => {
        if (!preview || !tables) return;
        setBusy(true); setError('');
        try {
            const body = Object.fromEntries(TABLES.map(tb => [tb, { source: tables[tb].source, mapping: tables[tb].mapping }]));
            setResult(await api.commit({ token: preview.token, name: name.trim(), company_id: companyId || null, tables: body }));
        } catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    };

    const missingRequired = tables ? TABLES.some(tb => tables[tb].source !== null &&
        tables[tb].fields.some(f => f.required && !tables[tb].mapping[f.name])) || tables.notices.source === null : true;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" role="dialog" aria-modal="true">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100" aria-label="Close"><X size={20} /></button>
                <h2 className="text-xl font-extrabold mb-4 pr-10">{t.title}</h2>
                {error && <div className="mb-4 flex gap-2 items-start rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"><AlertTriangle size={16} className="shrink-0 mt-0.5" />{error}</div>}

                {/* Step 3 — report */}
                {result ? (
                    <div>
                        <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2"><CheckCircle2 size={20} /> {t.done}</div>
                        <p className="text-slate-700 mb-4">{t.counts(result.report.counts)}</p>
                        {result.report.issue_count === 0 ? <p className="text-sm text-slate-500 mb-6">{t.noIssue}</p> : (
                            <div className="mb-6">
                                <p className="text-sm font-semibold text-amber-800 mb-2">{t.issues(result.report.issue_count)}</p>
                                <ul className="max-h-60 overflow-y-auto text-sm text-slate-600 border border-slate-200 rounded-xl divide-y divide-slate-100">
                                    {result.report.issues.map((i, k) => (
                                        <li key={k} className="px-3 py-1.5">
                                            <b>{TABLE_LABEL[lang][i.table]}</b> · {t.row} {i.row}{i.code ? ` · ${i.code}` : ''} — {ISSUE_LABEL[lang][i.issue] ?? i.issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button onClick={() => onImported(result.id)} className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-6 py-3 rounded-xl">{t.open}</button>
                    </div>
                ) : !preview || !tables ? (
                    /* Step 1 — upload */
                    <div>
                        <p className="text-slate-600 mb-5">{t.step1}</p>
                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl p-8 cursor-pointer hover:border-[#FF6B00] hover:bg-orange-50/40">
                            <UploadCloud size={32} className="text-slate-400" />
                            <span className="font-semibold text-slate-700">{t.choose}</span>
                            <span className="text-xs text-slate-500">.xlsx · .csv — 20 MB max</span>
                            <input type="file" multiple accept=".xlsx,.xlsm,.xls,.csv,.txt" className="sr-only"
                                onChange={e => setFiles(Array.from(e.target.files ?? []).slice(0, 4))} />
                        </label>
                        {files.length > 0 && (
                            <ul className="mt-4 space-y-1 text-sm text-slate-700">
                                {files.map(f => <li key={f.name} className="flex items-center gap-2"><FileSpreadsheet size={15} className="text-emerald-600" /> {f.name}</li>)}
                            </ul>
                        )}
                        <p className="text-xs text-slate-500 mt-4">{t.privacy}</p>
                        <button disabled={!files.length || busy} onClick={analyse}
                            className="mt-6 inline-flex items-center gap-2 bg-slate-900 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl">
                            {busy && <Loader2 size={16} className="animate-spin" />} {busy ? t.analysing : t.analyse}
                        </button>
                    </div>
                ) : (
                    /* Step 2 — mapping */
                    <div>
                        <p className="text-slate-600 mb-5">{t.step2}</p>
                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                            <label className="block text-sm">
                                <span className="block font-semibold mb-1">{t.name}</span>
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                            </label>
                            <label className="block text-sm">
                                <span className="block font-semibold mb-1">{t.company}</span>
                                <select value={companyId} onChange={e => setCompanyId(e.target.value)} disabled={!isStaff}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50">
                                    {isStaff && <option value="">{t.internal}</option>}
                                    {companies.map(c => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
                                </select>
                            </label>
                        </div>

                        <div className="space-y-5">
                            {TABLES.map(tb => {
                                const spec = tables[tb];
                                const src = spec.source === null ? null : preview.sources[spec.source];
                                return (
                                    <section key={tb} className="border border-slate-200 rounded-xl p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                            <h3 className="font-bold">{TABLE_LABEL[lang][tb]}{tb === 'notices' ? ' *' : ''}</h3>
                                            <select value={spec.source ?? ''} onChange={e => setSource(tb, e.target.value === '' ? null : Number(e.target.value))}
                                                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm max-w-full" aria-label={`${TABLE_LABEL[lang][tb]} — ${t.source}`}>
                                                <option value="">{t.none}</option>
                                                {preview.sources.map(s => <option key={s.index} value={s.index}>{s.name} ({s.rows})</option>)}
                                            </select>
                                        </div>
                                        {src && (
                                            <>
                                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {spec.fields.map(f => (
                                                        <label key={f.name} className="block text-xs">
                                                            <span className="block font-semibold text-slate-600 mb-1">{FIELD_LABEL[lang][f.name] ?? f.name}{f.required ? ' *' : ''}</span>
                                                            <select value={spec.mapping[f.name] ?? ''} onChange={e => setColumn(tb, f.name, e.target.value || null)}
                                                                className={`w-full border rounded-lg px-2 py-1.5 text-sm ${f.required && !spec.mapping[f.name] ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                                                                <option value="">{t.notMapped}</option>
                                                                {src.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </label>
                                                    ))}
                                                </div>
                                                <details className="mt-3">
                                                    <summary className="text-xs font-semibold text-slate-500 cursor-pointer">{t.sample}</summary>
                                                    <div className="overflow-x-auto mt-2">
                                                        <table className="text-xs text-slate-600">
                                                            <thead><tr>{src.columns.map(c => <th key={c} className="text-left font-semibold px-2 py-1 whitespace-nowrap">{c}</th>)}</tr></thead>
                                                            <tbody>{src.sample.map((r, i) => <tr key={i} className="border-t border-slate-100">{src.columns.map(c => <td key={c} className="px-2 py-1 whitespace-nowrap max-w-[200px] truncate">{r[c] ?? ''}</td>)}</tr>)}</tbody>
                                                        </table>
                                                    </div>
                                                </details>
                                            </>
                                        )}
                                    </section>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-6">
                            <button onClick={() => { setPreview(null); setTables(null); }} className="px-5 py-3 rounded-xl border border-slate-200 font-semibold">{t.back}</button>
                            <button disabled={busy || missingRequired || !name.trim() || (!isStaff && !companyId)} onClick={commit}
                                className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl">
                                {busy && <Loader2 size={16} className="animate-spin" />} {busy ? t.importing : t.importBtn}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
