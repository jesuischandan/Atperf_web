import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { api, type Dataset } from './api';
import { fmtDate } from './texts';
import { ErrorBox, Loading } from './ui';
import OverviewTab from './OverviewTab';
import PrioritiesTab from './PrioritiesTab';
import ReplayTab from './ReplayTab';
import BacktestTab from './BacktestTab';
import SettingsTab from './SettingsTab';
import JournalTab from './JournalTab';
import { useLang } from '../../../utils/useLang';

/* ─────────────────────────────────────────────────────────────
   STRAP Maintenance cockpit for one dataset
───────────────────────────────────────────────────────────── */

type Tab = 'overview' | 'priorities' | 'replay' | 'backtest' | 'settings' | 'journal';

const T = {
    fr: {
        back: 'Jeux de données', internal: 'Interne Atperf', study: 'Date d’étude', export: 'Exporter (Excel)',
        tabs: { overview: 'Vue d’ensemble', priorities: 'Avis jaunes priorisés', replay: 'Rejeu d’une panne', backtest: 'Mesure des alertes', settings: 'Paramètres', journal: 'Journal' } as Record<Tab, string>,
        scope: 'Prototype : import Excel / CSV, pas de connexion SAP temps réel, pas de création automatique d’OT. Un Avis jaune antérieur ne prouve pas qu’il a causé la panne : chaque rapprochement reste à valider par un expert.',
    },
    en: {
        back: 'Datasets', internal: 'Atperf internal', study: 'Study date', export: 'Export (Excel)',
        tabs: { overview: 'Overview', priorities: 'Prioritised yellows', replay: 'Replay a breakdown', backtest: 'Alert measurement', settings: 'Parameters', journal: 'Log' } as Record<Tab, string>,
        scope: 'Prototype: Excel / CSV import, no real-time SAP connection, no automatic work orders. An earlier yellow notification does not prove it caused the breakdown: every match must be validated by an expert.',
    },
};

export default function MaintenanceCockpit() {
    const { id = '' } = useParams();
    const [lang] = useLang();
    const t = T[lang];
    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<Tab>('overview');
    const [version, setVersion] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [replayWo, setReplayWo] = useState<string | null>(null);

    const reload = useCallback(() => {
        api.dataset(id).then(setDataset).catch(e => setError(e.message));
    }, [id]);
    useEffect(() => { reload(); }, [reload]);

    const onChanged = () => { setVersion(v => v + 1); reload(); };
    const openNotice = (code: string) => { setSelected(code); setTab('priorities'); };
    const openReplay = (wo: string) => { setReplayWo(wo); setTab('replay'); };

    if (error) return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10"><ErrorBox message={error} /></main>;
    if (!dataset) return <Loading />;

    const common = { datasetId: id, lang, version, onChanged };

    return (
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <Link to="/tool/strap-maintenance" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#FF6B00] mb-3">
                <ArrowLeft size={15} /> {t.back}
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{dataset.name}</h1>
                    <p className="text-sm text-slate-500">{dataset.company_name ?? t.internal} · {t.study} : {fmtDate(dataset.study_date, lang)}</p>
                </div>
                <a href={api.exportUrl(id)} className="inline-flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 font-semibold px-4 py-2.5 rounded-xl text-sm">
                    <Download size={16} /> {t.export}
                </a>
            </div>
            <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">{t.scope}</p>

            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-6" role="tablist">
                {(Object.keys(t.tabs) as Tab[]).map(k => (
                    <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                        className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        {t.tabs[k]}
                    </button>
                ))}
            </div>

            {tab === 'overview' && <OverviewTab {...common} onOpenNotice={openNotice} />}
            {tab === 'priorities' && <PrioritiesTab {...common} selected={selected} onSelect={setSelected} />}
            {tab === 'replay' && <ReplayTab key={replayWo ?? 'default'} {...common} defaultThreshold={dataset.thresholds.high} onOpenNotice={openNotice} initialWo={replayWo} />}
            {tab === 'backtest' && <BacktestTab {...common} defaultThreshold={dataset.thresholds.high} defaultHorizon={dataset.windows.horizon_days ?? 90}
                onOpenNotice={openNotice} onOpenReplay={openReplay} />}
            {tab === 'settings' && <SettingsTab {...common} dataset={dataset} />}
            {tab === 'journal' && <JournalTab {...common} onOpenNotice={openNotice} />}
        </main>
    );
}
