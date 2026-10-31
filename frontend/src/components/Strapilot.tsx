import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Loader2, Sparkles, AlertCircle, BarChart3, ChevronRight, Check, Download, Mail, Zap, Goal, Target, Crosshair, AlertTriangle, Activity, ShieldAlert, Flag } from 'lucide-react';

import API_URL from '../utils/apiUrl';
import { generateStrapAnalysisPDF } from '../utils/pdfGenerator';
import EmailModal from './EmailModal';
import { useLang } from '../utils/useLang';

interface ColumnMeta {
    name: string;
    type: string;
    description: string;
}

const TRANSLATIONS = {
    en: {
        back: "Back",
        stepStr: "Step",
        processContext: "Process Context",
        processType: "Process Type",
        optApprovisionnement: "Procurement / Sourcing",
        optProduction: "Production / Manufacturing",
        optMaintenance: "Maintenance",
        optLabo: "Laboratory / Quality",
        optSupply: "Supply Chain / Logistics",
        optAutre: "Other",
        specifyProcess: "Specify the process type...",
        mainObjective: "Main performance objective",
        objPlaceholder: "Ex: Reduce scrap by 5%",
        orgConstraints: "Org Constraints",
        orgPlaceholder: "Ex: 3 shifts...",
        resConstraints: "Res Constraints",
        resPlaceholder: "Ex: Lack of experience...",
        envConstraints: "Env Constraints",
        envPlaceholder: "Ex: Temperature...",
        currentKpi: "Currently tracked KPIs (optional)",
        kpiPlaceholder: "Ex: OEE, Scrap rate...",
        next: "Next",
        provideData: "Provide your data",
        fileReq: "File and description are required.",
        fileUploadLabel: "File",
        clickUpload: "Click to upload",
        dataContextTitle: "Data Context",
        dataContextDesc: "What does this file represent?",
        dataContextPlace: "Ex: Downtime extract from line 4...",
        analyzeCols: "Analyze Columns",
        dataVerification: "Data Verification",
        noHeaders: "No headers detected. Generic names have been assigned.",
        column: "Column",
        descAi: "Description (AI)",
        colsFound: "columns found",
        generateStrap: "Generate STRAP Analysis (1 credit)",
        exportPdf: "Export PDF",
        emailPdf: "Email PDF",
        finishAnalysis: "Finish Analysis",
        insufficientCredits: "Insufficient credits"
    },
    fr: {
        back: "Retour",
        stepStr: "Étape",
        processContext: "Contexte du Processus",
        processType: "Type de processus",
        optApprovisionnement: "Approvisionnement",
        optProduction: "Production / Fabrication",
        optMaintenance: "Maintenance",
        optLabo: "Laboratoire / Qualité",
        optSupply: "Supply Chain / Logistique",
        optAutre: "Autre",
        specifyProcess: "Précisez le type de processus...",
        mainObjective: "Objectif principal de la performance",
        objPlaceholder: "Ex: Réduire les rebuts de 5%",
        orgConstraints: "Contraintes Org.",
        orgPlaceholder: "Ex: 3x8...",
        resConstraints: "Contraintes Ress.",
        resPlaceholder: "Ex: Manque XP...",
        envConstraints: "Contraintes Env.",
        envPlaceholder: "Ex: Température...",
        currentKpi: "KPIs actuellement suivis (optionnel)",
        kpiPlaceholder: "Ex: TRS, Taux de rebut...",
        next: "Suivant",
        provideData: "Associez vos données",
        fileReq: "Fichier et description requis.",
        fileUploadLabel: "Fichier",
        clickUpload: "Cliquez pour uploader",
        dataContextTitle: "Contexte des données",
        dataContextDesc: "Que représente ce fichier ?",
        dataContextPlace: "Ex: Extract des rejets machines...",
        analyzeCols: "Analyser les colonnes",
        dataVerification: "Vérification des données",
        noHeaders: "Aucun en-tête détecté. Des noms génériques ont été assignés.",
        column: "Colonne",
        descAi: "Description (IA)",
        colsFound: "colonnes trouvées",
        generateStrap: "Générer l'Analyse STRAP (1 crédit)",
        exportPdf: "Exporter PDF",
        emailPdf: "Envoyer par Email",
        finishAnalysis: "Terminer l'Analyse",
        insufficientCredits: "Crédits insuffisants"
    }
};

const Strapilot = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ user_id?: string, first_name?: string, email?: string } | null>(null);
    
    // 1 = Questionnaire, 2 = Upload, 3 = Columns, 4 = STRAP Output
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lang] = useLang();

    const t = TRANSLATIONS[lang];

    // File Upload State
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Columns Review State
    const [columns, setColumns] = useState<ColumnMeta[]>([]);
    const [hasHeaders, setHasHeaders] = useState(true);


    
    // Output State (STRAP)
    const [strapPayload, setStrapPayload] = useState<any>(null);

    // Extra STRAP state
    const [questionnaire, setQuestionnaire] = useState({
        process_type: 'production',
        custom_process_type: '',
        objective: '',
        constraint_org: '',
        constraint_res: '',
        constraint_env: '',
        current_kpis: ''
    });

    const [exportLoading, setExportLoading] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailPdfData, setEmailPdfData] = useState<any>({});


    const handlePdfExportStrap = async (forEmail: boolean = false) => {
        if (!strapPayload) return null;
        setExportLoading(true);
        try {
            const sessionData = {
                created_at: new Date().toISOString(),
                file_name: file ? file.name : "Dataset",
                strap_analysis_payload: strapPayload
            };

            const result = await generateStrapAnalysisPDF(sessionData, forEmail);
            
            if (forEmail && result) {
                setEmailPdfData({
                    base64: result.base64,
                    filename: result.filename,
                    reportType: 'strap_analysis',
                    language: lang,
                    reportTitle: `Analyse STRAP: ${sessionData.file_name}`
                });
                setIsEmailModalOpen(true);
            }
            return result;
        } catch (e) {
            console.error("STRAP PDF generation failed:", e);
        } finally {
            setExportLoading(false);
        }
        return null;
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        const stored = localStorage.getItem('proextract_user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
        } else {
            navigate('/login?redirect=/tool/strapilot');
        }
    }, [navigate]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const handleUpload = async () => {
        if (!file || !description.trim()) {
            setError(t.fileReq);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', description);
            
            const upRes = await fetch(`${API_URL}/api/strapilot/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!upRes.ok) {
                const errData = await upRes.json();
                throw new Error(errData.detail || "Upload failed");
            }
            
            const session = await upRes.json();
            setSessionId(session.id);
            
            const analyzeRes = await fetch(`${API_URL}/api/strapilot/${session.id}/analyze-columns?language=${lang}`, {
                method: 'POST',
            });
            
            if (!analyzeRes.ok) throw new Error("Column analysis failed");
            
            const colsData = await analyzeRes.json();
            setHasHeaders(colsData.has_headers);
            setColumns(colsData.columns);
            
            setStep(3);
            window.scrollTo(0, 0);
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateStrapAnalysis = async () => {
        if (!sessionId) return;
        setLoading(true);
        setError(null);

        try {
            const saveRes = await fetch(`${API_URL}/api/strapilot/${sessionId}/save-columns`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ columns })
            });
            
            if (!saveRes.ok) throw new Error("Failed to save columns");

            const strapRes = await fetch(`${API_URL}/api/strapilot/${sessionId}/generate-strap-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    language: lang,
                    questionnaire
                })
            });

            if (!strapRes.ok) {
                if (strapRes.status === 402) throw new Error(t.insufficientCredits);
                throw new Error("STRAP analysis generation failed");
            }

            const data = await strapRes.json();
            setStrapPayload(data);

            try {
                if (user) {
                    const u = { ...user, credit_balance: (user as any).credit_balance - 1 };
                    setUser(u);
                    localStorage.setItem('proextract_user', JSON.stringify(u));
                }
            } catch(e) {}

            setStep(4);
            window.scrollTo(0, 0);

        } catch(err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getControlColorStyles = (color: string) => {
        if (color === 'red') return 'bg-red-500 shadow-red-500/20';
        if (color === 'green') return 'bg-emerald-500 shadow-emerald-500/20';
        return 'bg-amber-500 shadow-amber-500/20';
    };

    const renderFileUpload = () => (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <div className="space-y-8">
                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">
                        1. {t.fileUploadLabel} (CSV, XLSX)
                    </label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#FF6B00] hover:bg-orange-50 transition-all flex flex-col items-center justify-center group"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".csv, .xlsx, .xls"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <UploadCloud className="text-slate-400 group-hover:text-[#FF6B00] transition-colors" size={32} />
                        </div>
                        {file ? (
                            <div className="text-[#FF6B00] font-bold text-lg">{file.name}</div>
                        ) : (
                            <>
                                <p className="font-bold text-slate-700 text-lg mb-1">{t.clickUpload}</p>
                                <p className="text-slate-500 text-sm">Max 10 MB</p>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">
                        2. {t.dataContextTitle}
                    </label>
                    <p className="text-slate-500 text-sm mb-3">
                        {t.dataContextDesc}
                    </p>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:bg-white transition-all resize-none text-slate-700"
                        placeholder={t.dataContextPlace}
                    />
                </div>
            </div>
            
            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                <button
                    onClick={handleUpload}
                    disabled={loading || !file || !description.trim()}
                    className="bg-[#FF6B00] hover:bg-[#E66000] text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-sm shadow-[#FF6B00]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {t.analyzeCols}
                </button>
            </div>
        </div>
    );

    const renderColumnReview = () => (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {!hasHeaders && (
                <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center gap-3">
                    <AlertCircle className="text-amber-500" />
                    <p className="text-amber-800 text-sm font-medium">
                        {t.noHeaders}
                    </p>
                </div>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[25%]">{t.column}</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[15%]">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[60%]">{t.descAi}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {columns.map((col, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                <td className="px-6 py-4 relative">
                                    <input 
                                        value={col.name} 
                                        onChange={(e) => {
                                            const nc = [...columns];
                                            nc[idx].name = e.target.value;
                                            setColumns(nc);
                                        }}
                                        className="w-full bg-transparent font-semibold border-b border-transparent focus:border-[#FF6B00] outline-none"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-tight">
                                        {col.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <textarea 
                                        value={col.description}
                                        onChange={(e) => {
                                            const nc = [...columns];
                                            nc[idx].description = e.target.value;
                                            setColumns(nc);
                                        }}
                                        className="w-full bg-slate-50 hover:bg-white border border-transparent hover:border-slate-300 focus:border-[#FF6B00] focus:bg-white p-2 rounded-lg text-sm text-slate-700 resize-none min-h-[60px] outline-none transition-colors"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Check size={16} /> {columns.length} {t.colsFound}
                </span>
                <button
                    onClick={handleGenerateStrapAnalysis}
                    disabled={loading}
                    className="bg-[#FF6B00] hover:bg-[#E66000] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm shadow-[#FF6B00]/20 disabled:opacity-50 transition-all"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <BarChart3 size={20} />}
                    {t.generateStrap}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#FF6B00]/20 pb-20">
            <div className="max-w-4xl mx-auto px-6 pt-8 w-full flex items-center justify-between">
                <button onClick={() => {
                    if (step > 1) {
                        setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
                    } else {
                        navigate('/dashboard');
                    }
                }} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> {t.back}
                </button>
                <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {t.stepStr} {step}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 mt-6 w-full">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0" />
                        <p className="text-red-700 text-sm font-medium mt-0.5">{error}</p>
                    </div>
                )}


                {/* STEP 1: QUESTIONNAIRE */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                            <h1 className="text-2xl font-extrabold text-slate-900 mb-6">
                                {t.processContext}
                            </h1>
                            <div className="space-y-6">
                                    {/* Process Type */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">{t.processType}</label>
                                        <select 
                                            value={questionnaire.process_type}
                                            onChange={(e) => setQuestionnaire({...questionnaire, process_type: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00]"
                                        >
                                            <option value="approvisionnement">{t.optApprovisionnement}</option>
                                            <option value="production">{t.optProduction}</option>
                                            <option value="maintenance">{t.optMaintenance}</option>
                                            <option value="labo">{t.optLabo}</option>
                                            <option value="supply">{t.optSupply}</option>
                                            <option value="autre">{t.optAutre}</option>
                                        </select>
                                        {questionnaire.process_type === 'autre' && (
                                            <input 
                                                type="text"
                                                value={questionnaire.custom_process_type || ''}
                                                onChange={(e) => setQuestionnaire({...questionnaire, custom_process_type: e.target.value})}
                                                placeholder={t.specifyProcess}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-3 outline-none focus:ring-2 focus:ring-[#FF6B00]"
                                            />
                                        )}
                                    </div>
                                    {/* Objective */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">{t.mainObjective}</label>
                                        <input 
                                            value={questionnaire.objective}
                                            onChange={(e) => setQuestionnaire({...questionnaire, objective: e.target.value})}
                                            type="text" 
                                            placeholder={t.objPlaceholder}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00]"
                                        />
                                    </div>
                                    {/* Constraints */}
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-2">{t.orgConstraints}</label>
                                            <textarea 
                                                value={questionnaire.constraint_org}
                                                onChange={(e) => setQuestionnaire({...questionnaire, constraint_org: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00] resize-none h-24 text-sm"
                                                placeholder={t.orgPlaceholder}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-2">{t.resConstraints}</label>
                                            <textarea 
                                                value={questionnaire.constraint_res}
                                                onChange={(e) => setQuestionnaire({...questionnaire, constraint_res: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00] resize-none h-24 text-sm"
                                                placeholder={t.resPlaceholder}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-2">{t.envConstraints}</label>
                                            <textarea 
                                                value={questionnaire.constraint_env}
                                                onChange={(e) => setQuestionnaire({...questionnaire, constraint_env: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00] resize-none h-24 text-sm"
                                                placeholder={t.envPlaceholder}
                                            />
                                        </div>
                                    </div>
                                    {/* KPIs */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">{t.currentKpi}</label>
                                        <textarea 
                                            value={questionnaire.current_kpis}
                                            onChange={(e) => setQuestionnaire({...questionnaire, current_kpis: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00] resize-none h-20 text-sm"
                                            placeholder={t.kpiPlaceholder}
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                                    >
                                        {t.next} <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                    </div>
                )}

                {/* STEP 2: UPLOAD */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-5xl">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                                {t.provideData}
                            </h1>
                        </div>
                        {renderFileUpload()}
                    </div>
                )}

                {/* STEP 3: COLUMNS REVIEW */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-5xl">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                                {t.dataVerification}
                            </h1>
                        </div>
                        {renderColumnReview()}
                    </div>
                )}

                {/* STEP 4: STRAP OUTPUT */}
                {step === 4 && strapPayload && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-4xl mx-auto space-y-6">
                        
                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analyse STRAP</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => handlePdfExportStrap(false)}
                                    disabled={exportLoading}
                                    className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                    {t.exportPdf}
                                </button>
                                <button
                                    onClick={() => handlePdfExportStrap(true)}
                                    disabled={exportLoading}
                                    className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                    {t.emailPdf}
                                </button>
                            </div>
                        </div>

                        {/* 1. Synthèse (HERO) */}
                        <div className={`rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 ${getControlColorStyles(strapPayload.summary.control_color)} shadow-xl`}>
                            <div className="absolute top-0 right-0 opacity-10 scale-150 -translate-y-10 translate-x-10">
                                {strapPayload.summary.control_color === 'red' ? <AlertTriangle size={240} /> : 
                                 strapPayload.summary.control_color === 'green' ? <Check size={240} /> : <Zap size={240} />}
                            </div>
                            
                            <div className="max-w-xl z-10">
                                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                                    Niveau de maîtrise : {strapPayload.summary.control_level}
                                </span>
                                <div className="space-y-2 mt-4 text-white/90">
                                    <p className="flex gap-2 items-start"><Goal className="shrink-0 mt-1" size={18} /> <strong>Problème :</strong> {strapPayload.summary.main_problem}</p>
                                    <p className="flex gap-2 items-start"><Zap className="shrink-0 mt-1" size={18} /> <strong>Levier :</strong> {strapPayload.summary.key_lever}</p>
                                    <p className="flex gap-2 items-start"><AlertTriangle className="shrink-0 mt-1" size={18} /> <strong>Risque :</strong> {strapPayload.summary.risk}</p>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl md:w-72 z-10">
                                <p className="text-xs uppercase tracking-wider font-bold mb-2">Action Prioritaire</p>
                                <p className="text-lg font-bold">{strapPayload.summary.priority_action}</p>
                            </div>
                        </div>

                        {/* 2. KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {strapPayload.kpi_cards.map((kpi: any, idx: number) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <p className="text-slate-500 font-medium text-sm mb-1">{kpi.label}</p>
                                    <p className={`text-3xl font-black ${kpi.color === 'red' ? 'text-red-500' : kpi.color === 'green' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {kpi.value}
                                    </p>
                                    <div className={`mt-2 flex items-center gap-1 text-sm font-bold ${kpi.trend_direction === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {kpi.trend}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* 3. Variables Influentes */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                                    <Target className="text-indigo-500" /> Variables Influentes
                                </h3>
                                <div className="space-y-4">
                                    {strapPayload.influential_variables.map((v: any, idx: number) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span>{v.name}</span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase ${v.impact === 'high' ? 'bg-red-100 text-red-700' : v.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    Impact {v.impact}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                <div className={`h-full ${v.impact === 'high' ? 'w-[90%] bg-red-400' : v.impact === 'medium' ? 'w-[50%] bg-amber-400' : 'w-[20%] bg-slate-300'}`}></div>
                                            </div>
                                            <p className="text-xs text-slate-500">{v.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Signaux Faibles */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                                    <Activity className="text-amber-500" /> Signaux Faibles
                                </h3>
                                <div className="space-y-3">
                                    {strapPayload.weak_signals.map((ws: any, idx: number) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex gap-3 items-start">
                                            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm mb-1">{ws.title}</p>
                                                <p className="text-xs text-slate-600">{ws.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* 5. KPI à suivre */}
                            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-100">
                                    <Crosshair className="text-emerald-400" /> KPI à Suivre
                                </h3>
                                <ul className="space-y-3">
                                    {strapPayload.kpi_to_track.map((kpi: string, idx: number) => (
                                        <li key={idx} className="flex gap-2 items-center text-sm font-medium text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            {kpi}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 6. Risques */}
                            <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-red-900">
                                    <AlertTriangle className="text-red-500" /> Risques Court-Terme
                                </h3>
                                <div className="space-y-4">
                                    {strapPayload.risks.map((risk: any, idx: number) => (
                                        <div key={idx}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-red-800 text-sm">{risk.title}</p>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-200 px-1.5 py-0.5 rounded bg-white">
                                                    {risk.horizon}
                                                </span>
                                            </div>
                                            <p className="text-xs text-red-600/80">{risk.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 7. Actions */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                                <Flag className="text-[#FF6B00]" /> Actions Recommandées
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {strapPayload.actions.map((act: any, idx: number) => (
                                    <div key={idx} className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors">
                                        <p className="font-bold text-slate-900 mb-2">{act.title}</p>
                                        <p className="text-sm text-slate-500 mb-4">{act.reason}</p>
                                        <button className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors inline-block w-full text-center">
                                            Créer action dans système (Demo)
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Done actions */}
                        <div className="flex justify-center mt-12 pb-12">
                            <button onClick={() => navigate('/dashboard')} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all">
                                {t.finishAnalysis}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                userEmail={user?.email || ''}
                recipientName={user?.first_name || ''}
                pdfBase64={emailPdfData.base64}
                filename={emailPdfData.filename}
                reportType={emailPdfData.reportType}
                language={emailPdfData.language}
                reportTitle={emailPdfData.reportTitle}
                overallOutcomes={emailPdfData.overallOutcomes}
            />
        </div>
    );
};

export default Strapilot;
