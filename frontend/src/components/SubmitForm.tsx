import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Brain, AlertCircle, Activity, TrendingDown, Download, Mail } from 'lucide-react';
import EmailModal from './EmailModal';
import { generateStrapDiagPDF } from '../utils/pdfGenerator';

import API_URL from '../utils/apiUrl';

interface FormData {
    q_pilotage: string;
    q_incidents: string;
    q_pertes: string;
    q_anticipation: string;
    q_organisation: string;
}

interface DiagnosticResult {
    id: string;
    score_100: number;
    category_result: string;
    loss_estimation_min: number;
    loss_estimation_max: number;
    loss_pct_min?: number;
    loss_pct_max?: number;
    ai_advice: string;
}

const STEPS = ['Pilotage', 'Incidents', 'Pertes', 'Anticipation', 'Organisation'];

export default function SubmitForm() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<DiagnosticResult | null>(null);
    const [form, setForm] = useState<FormData>({
        q_pilotage: '',
        q_incidents: '',
        q_pertes: '',
        q_anticipation: '',
        q_organisation: '',
    });

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [emailPdfData, setEmailPdfData] = useState({
        base64: '',
        filename: '',
        reportType: 'proextract' as 'proextract' | 'decision_radar',
        language: 'en',
        reportTitle: '',
        overallOutcomes: ''
    });

    useEffect(() => {
        const raw = localStorage.getItem('proextract_user');
        if (!raw) {
            navigate('/login');
        }
    }, [navigate]);

    const update = (field: keyof FormData, value: string | number) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const canAdvance = () => {
        if (step === 0) return form.q_pilotage !== '';
        if (step === 1) return form.q_incidents !== '';
        if (step === 2) return form.q_pertes !== '';
        if (step === 3) return form.q_anticipation !== '';
        if (step === 4) return form.q_organisation !== '';
        return false;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const rawUser = localStorage.getItem('proextract_user');
            let company_id = null;
            let user_id = null;
            if (rawUser) {
                try {
                    const parsed = JSON.parse(rawUser);
                    company_id = parsed.company_id || null;
                    user_id = parsed.user_id || null;
                } catch (e) {
                    console.error("Failed to parse user details from local storage", e);
                }
            }

            const payloadData = { 
                ...form, 
                company_id,
                user_id,
                revenue: 0
            };

            const res = await fetch(`${API_URL}/analyze-strap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadData),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Server error: ${res.status}`);
            }
            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const renderOptions = (field: keyof FormData, options: string[]) => {
        return (
            <div className="flex flex-col gap-3">
                {options.map(opt => (
                    <button key={opt} onClick={() => update(field, opt)}
                        className={`py-3.5 px-4 rounded-xl text-left text-sm font-semibold border transition-all
                            ${form[field] === opt ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}
                        `}>
                        {opt}
                    </button>
                ))}
            </div>
        );
    };

    if (result) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Activity size={200} />
                    </div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Résultat du Diagnostic</h2>
                        <p className="text-slate-500 mb-8 font-medium">Votre performance opérationnelle évaluée par l'IA StrAP.</p>
                        
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-8">
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Votre Score StrAP</p>
                            <div className="flex items-end justify-center gap-2 mb-4">
                                <span className="text-6xl font-black text-indigo-600 leading-none">{result.score_100}</span>
                                <span className="text-xl font-bold text-slate-400 mb-1">/ 100</span>
                            </div>
                            <div className="inline-block bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                                {result.category_result}
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8 text-left relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-red-500">
                                <TrendingDown size={120} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm text-red-600 font-bold uppercase tracking-wider mb-2">Pertes Invisibles Estimées 💣</p>
                                <p className="text-2xl font-extrabold text-slate-900 mb-2">
                                    Entre <span className="text-red-500">{result.loss_pct_min}%</span> et <span className="text-red-500">{result.loss_pct_max}%</span> du chiffre d'affaires
                                </p>
                                <p className="text-sm text-slate-600">Ces pertes sont diluées dans l'inefficacité, la non-qualité et le manque d'anticipation de votre organisation.</p>
                            </div>
                        </div>

                        <div className="text-left bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <Brain size={20} className="text-indigo-600" />
                                <h3 className="text-sm font-bold uppercase text-slate-700 tracking-wider">Recommandation Stratégique</h3>
                            </div>
                            <p className="text-slate-800 font-medium leading-relaxed">
                                {result.ai_advice}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={async () => {
                                    setExportLoading(true);
                                    try {
                                        await generateStrapDiagPDF(result);
                                    } finally {
                                        setExportLoading(false);
                                    }
                                }}
                                disabled={exportLoading}
                                className="border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} PDF
                            </button>
                            <button
                                onClick={async () => {
                                    setExportLoading(true);
                                    try {
                                        const pdfResult = await generateStrapDiagPDF(result, true);
                                        if (pdfResult) {
                                            setEmailPdfData({
                                                base64: pdfResult.base64,
                                                filename: pdfResult.filename,
                                                reportType: 'proextract',
                                                language: 'fr',
                                                reportTitle: 'Diagnostic StrAP',
                                                overallOutcomes: result.category_result
                                            });
                                            setIsEmailModalOpen(true);
                                        }
                                    } finally {
                                        setExportLoading(false);
                                    }
                                }}
                                disabled={exportLoading}
                                className="border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} Email
                            </button>
                            <button
                                onClick={() => { setResult(null); setStep(0); }}
                                className="border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all"
                            >
                                Recommencer
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-[#FF6B00] text-white py-3.5 rounded-xl font-bold hover:bg-[#E66000] transition-all shadow-lg shadow-orange-500/30"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
                {/* Email Modal */}
                <EmailModal
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    userEmail={''}
                    recipientName={''}
                    pdfBase64={emailPdfData.base64}
                    filename={emailPdfData.filename}
                    reportType={emailPdfData.reportType}
                    language={emailPdfData.language}
                    reportTitle={emailPdfData.reportTitle}
                    overallOutcomes={emailPdfData.overallOutcomes}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 max-w-lg w-full">
                    {/* Progress Bar */}
                    <div className="mb-10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-500">Étape {step + 1} sur {STEPS.length}</span>
                            <span className="text-sm font-bold text-indigo-600">{STEPS[step]}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {step === 0 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">1. Pilotage</h2>
                                <p className="text-sm text-slate-500 font-medium">Avez-vous une visibilité en temps réel de votre performance ?</p>
                            </div>
                            {renderOptions('q_pilotage', ['Oui', 'Partiellement', 'Non'])}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">2. Incidents</h2>
                                <p className="text-sm text-slate-500 font-medium">Les problèmes sont-ils récurrents dans vos opérations ?</p>
                            </div>
                            {renderOptions('q_incidents', ['Rarement', 'Parfois', 'Fréquemment'])}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">3. Pertes</h2>
                                <p className="text-sm text-slate-500 font-medium">Êtes-vous capable de quantifier financièrement vos pertes ?</p>
                            </div>
                            {renderOptions('q_pertes', ['Oui précisément', 'Approximativement', 'Non'])}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">4. Anticipation</h2>
                                <p className="text-sm text-slate-500 font-medium">Détectez-vous les dérives avant qu'elles n'impactent vos résultats ?</p>
                            </div>
                            {renderOptions('q_anticipation', ['Oui', 'Parfois', 'Non'])}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">5. Organisation</h2>
                                <p className="text-sm text-slate-500 font-medium">Vos équipes suivent-elles des routines de performance unifiées ?</p>
                            </div>
                            {renderOptions('q_organisation', ['Oui', 'Partiellement', 'Non'])}
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                            <AlertCircle size={20} className="text-red-500 shrink-0" />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-4 mt-10">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)}
                                className="flex-1 border-2 border-slate-200 text-slate-600 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                <ArrowLeft size={18} /> Retour
                            </button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
                                className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20">
                                Suivant <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={!canAdvance() || loading}
                                className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20">
                                {loading ? <><Loader2 size={18} className="animate-spin" /> Analyse StrAP...</> : <><Brain size={18} /> Lancer le Diagnostic</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
