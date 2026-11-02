import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Database, FlaskConical, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { api, type Dataset } from './api';
import ImportWizard from './ImportWizard';
import { fmtDateTime } from './texts';
import { useLang } from '../../../utils/useLang';
import { STAFF_KEY } from '../../../utils/apiClient';

/* ─────────────────────────────────────────────────────────────
   STRAP Maintenance — datasets list (entry point of the cockpit)
───────────────────────────────────────────────────────────── */

const T = {
    fr: {
        title: 'STRAP Maintenance', badge: 'Prototype',
        intro: 'Importez vos historiques d’Avis et d’OT, puis priorisez les Avis jaunes à risque de panne rouge. Les scores sont calculés par des règles explicables et chaque décision est tracée.',
        import: 'Importer des données', sample: 'Charger le jeu fictif', loading: 'Chargement…',
        empty: 'Aucun jeu de données pour l’instant.', emptyHint: 'Importez un fichier Excel / CSV ou chargez le jeu de démonstration fictif.',
        internal: 'Interne Atperf', notices: 'Avis', wos: 'OT', by: 'par', delete: 'Supprimer', confirm: 'Supprimer définitivement ce jeu de données et toutes ses décisions ?',
        forCompany: 'Rattacher à', denied: 'STRAP Maintenance n’est pas activé pour votre entreprise. Contactez Atperf pour lancer un pilote.',
        simulator: 'Voir le simulateur public',
    },
    en: {
        title: 'STRAP Maintenance', badge: 'Prototype',
        intro: 'Import your notification and work-order history, then prioritise yellow notifications at risk of a red breakdown. Scores come from explainable rules and every decision is logged.',
        import: 'Import data', sample: 'Load the fictive dataset', loading: 'Loading…',
        empty: 'No dataset yet.', emptyHint: 'Import an Excel / CSV file or load the fictive demonstration dataset.',
        internal: 'Atperf internal', notices: 'notifications', wos: 'WOs', by: 'by', delete: 'Delete', confirm: 'Permanently delete this dataset and all its decisions?',
        forCompany: 'Attach to', denied: 'STRAP Maintenance is not enabled for your company. Contact Atperf to start a pilot.',
        simulator: 'See the public simulator',
    },
};

export default function MaintenanceHome() {
    const navigate = useNavigate();
    const [lang] = useLang();
    const t = T[lang];
    const isStaff = !!localStorage.getItem(STAFF_KEY);

    const [datasets, setDatasets] = useState<Dataset[] | null>(null);
    const [companies, setCompanies] = useState<{ company_id: string; company_name: string }[]>([]);
    const [sampleCompany, setSampleCompany] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [importing, setImporting] = useState(false);

    const load = useCallback(async () => {
        try {
            const [ds, cs] = await Promise.all([api.datasets(), api.companies()]);
            setDatasets(ds);
            setCompanies(cs);
            if (!isStaff && cs[0]) setSampleCompany(cs[0].company_id);
        } catch (e) { setError((e as Error).message); setDatasets([]); }
    }, [isStaff]);

    useEffect(() => { load(); }, [load]);

    const loadSample = async () => {
        setBusy(true); setError('');
        try {
            const { id } = await api.loadSample(sampleCompany || null);
            navigate(`/tool/strap-maintenance/${id}`);
        } catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    };

    const remove = async (ds: Dataset) => {
        if (!window.confirm(t.confirm)) return;
        try { await api.deleteDataset(ds.id); load(); } catch (e) { setError((e as Error).message); }
    };

    const denied = error && datasets?.length === 0 && /not enabled/i.test(error);

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t.title}</h1>
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-1 rounded">{t.badge}</span>
            </div>
            <p className="text-slate-600 max-w-3xl mb-8">{t.intro}</p>

            {denied ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                    <p className="mb-3">{t.denied}</p>
                    <Link to="/strap-software/maintenance/demo" className="font-semibold underline">{t.simulator}</Link>
                </div>
            ) : (
                <>
                    {error && <div className="mb-6 flex gap-2 items-start rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"><AlertTriangle size={16} className="shrink-0 mt-0.5" />{error}</div>}

                    <div className="flex flex-wrap items-end gap-3 mb-8">
                        <button onClick={() => setImporting(true)} className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-5 py-3 rounded-xl">
                            <UploadCloud size={18} /> {t.import}
                        </button>
                        <div className="flex flex-wrap items-end gap-2">
                            {isStaff && (
                                <label className="text-xs text-slate-500">
                                    <span className="block mb-1">{t.forCompany}</span>
                                    <select value={sampleCompany} onChange={e => setSampleCompany(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2.5 text-sm text-slate-700">
                                        <option value="">{t.internal}</option>
                                        {companies.map(c => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
                                    </select>
                                </label>
                            )}
                            <button onClick={loadSample} disabled={busy} className="inline-flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 font-semibold px-5 py-3 rounded-xl disabled:opacity-50">
                                {busy ? <Loader2 size={18} className="animate-spin" /> : <FlaskConical size={18} />} {busy ? t.loading : t.sample}
                            </button>
                        </div>
                    </div>

                    {datasets === null ? (
                        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
                    ) : datasets.length === 0 ? (
                        <div className="border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500">
                            <Database size={32} className="mx-auto mb-3 opacity-40" />
                            <p className="font-semibold text-slate-700">{t.empty}</p>
                            <p className="text-sm">{t.emptyHint}</p>
                        </div>
                    ) : (
                        <ul className="grid md:grid-cols-2 gap-4">
                            {datasets.map(ds => (
                                <li key={ds.id} className="relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all">
                                    <Link to={`/tool/strap-maintenance/${ds.id}`} className="block pr-10">
                                        <h2 className="font-bold text-lg text-slate-900">{ds.name}</h2>
                                        <p className="text-sm text-slate-500 mb-3">{ds.company_name ?? t.internal}</p>
                                        {ds.counts && (
                                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                                <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded">{ds.counts.flux.JAUNE ?? 0} {lang === 'fr' ? 'jaunes' : 'yellow'}</span>
                                                <span className="bg-red-50 text-red-700 px-2 py-1 rounded">{ds.counts.flux.ROUGE ?? 0} {lang === 'fr' ? 'rouges' : 'red'}</span>
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">{ds.counts.flux.VERT ?? 0} {lang === 'fr' ? 'verts' : 'green'}</span>
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">{ds.counts.equipments} {lang === 'fr' ? 'équipements' : 'assets'}</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-400 mt-3">{fmtDateTime(ds.created_at, lang)}{ds.created_by_name ? ` · ${t.by} ${ds.created_by_name}` : ''}</p>
                                    </Link>
                                    <button onClick={() => remove(ds)} title={t.delete} aria-label={t.delete}
                                        className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            {importing && (
                <ImportWizard lang={lang} isStaff={isStaff} companies={companies} onClose={() => setImporting(false)}
                    onImported={id => navigate(`/tool/strap-maintenance/${id}`)} />
            )}
        </main>
    );
}
