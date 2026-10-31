import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, AlertTriangle, Plus, Trash2, CheckCircle2, Download, Mail, Loader2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { generateRadarPDF } from '../utils/pdfGenerator';
import html2canvas from 'html2canvas';

import API_URL from '../utils/apiUrl';
import EmailModal from './EmailModal';
import { useLang } from '../utils/useLang';

const translations = {
    en: {
        title: "Decision Radar",
        subtitle: "The Priority Filter",
        desc: "Score and prioritize operational friction to align cross-functional teams.",
        step1: "Step 1: Input Topics (2 to 5)",
        step1Desc: "Identify the top operational issues draining your resources (e.g., Quality drift, production variability).",
        topicPlaceholder: "Enter a topic...",
        addTopic: "Add Topic",
        step2: "Step 2: Scoring (1 to 5)",
        step2Desc: "Rate each variable based on the definitions.",
        impact: "Economic Impact (1: Negligible | 5: Critical/Strategic)",
        frequency: "Frequency (1: Rare | 5: Chronic/Daily)",
        crossFunc: "Cross-functionality (1: Siloed/Local | 5: Multi-departmental)",
        anticipation: "Anticipation Level (1: Crisis/Firefighting | 5: Planned/Controlled)",
        step3: "Step 3: Radar Chart",
        step3Desc: "Visualizing the surface area of your operational friction. Note: For visual priority, Anticipation is inverted (5 - score) so that 'Low Anticipation' creates a larger Red Zone.",
        step4: "Step 4: AI Diagnostic",
        step4Desc: "Get a mini-diagnostic synthesizing these profiles.",
        submitBtn: "Generate AI Diagnostic",
        loading: "Analyzing Matrix...",
        diagnosticTitle: "Executive Diagnostic",
        remove: "Remove",
        minTopicsErr: "Please add at least 2 topics to proceed.",
        maxTopicsErr: "Maximum 5 topics allowed.",
        emptyTopicErr: "Topic names cannot be empty.",
        apiErr: "Failed to generate diagnostic. Please try again."
    },
    fr: {
        title: "Radar de Décision",
        subtitle: "Le Filtre de Priorité",
        desc: "Évaluez et hiérarchisez les frictions opérationnelles pour aligner les équipes.",
        step1: "Étape 1 : Saisir les Sujets (2 à 5)",
        step1Desc: "Identifiez les principaux problèmes opérationnels (ex: Dérive qualité, variabilité de production).",
        topicPlaceholder: "Entrer un sujet...",
        addTopic: "Ajouter un Sujet",
        step2: "Étape 2 : Évaluation (1 à 5)",
        step2Desc: "Évaluez chaque variable en fonction de sa définition.",
        impact: "Impact Économique (1: Négligeable | 5: Critique/Stratégique)",
        frequency: "Fréquence (1: Rare | 5: Chronique/Quotidien)",
        crossFunc: "Transversalité (1: Silo/Local | 5: Multi-départements)",
        anticipation: "Niveau d'Anticipation (1: Crise/Pompier | 5: Planifié/Contrôlé)",
        step3: "Étape 3 : Graphique Radar",
        step3Desc: "Visualisation de la surface de friction. Note : Pour une question de priorité, l'Anticipation est inversée (5 - score) pour que les cas de 'Faible Anticipation' créent une Zone Rouge plus large.",
        step4: "Étape 4 : Diagnostic de l'IA",
        step4Desc: "Obtenez un mini-diagnostic synthétisant ces profils.",
        submitBtn: "Générer le Diagnostic IA",
        loading: "Analyse de la Matrice...",
        diagnosticTitle: "Diagnostic Exécutif",
        remove: "Supprimer",
        minTopicsErr: "Veuillez ajouter au moins 2 sujets pour continuer.",
        maxTopicsErr: "Maximum 5 sujets autorisés.",
        emptyTopicErr: "Les noms des sujets ne peuvent pas être vides.",
        apiErr: "Échec de la génération du diagnostic. Veuillez réessayer."
    }
};

interface Topic {
    id: string;
    name: string;
    topic_context?: string;
    rating_context?: string;
    impact: number;
    frequency: number;
    cross_functionality: number;
    anticipation: number;
}

const DecisionRadar = () => {
    const navigate = useNavigate();
    const [lang] = useLang();

    // Auth guard: require login
    useEffect(() => {
        const stored = localStorage.getItem('proextract_user');
        if (!stored) {
            navigate('/login');
        }
    }, [navigate]);

    const t = translations[lang];

    const [topics, setTopics] = useState<Topic[]>([
        { id: '1', name: '', impact: 3, frequency: 3, cross_functionality: 3, anticipation: 3 },
        { id: '2', name: '', impact: 3, frequency: 3, cross_functionality: 3, anticipation: 3 },
        { id: '3', name: '', impact: 3, frequency: 3, cross_functionality: 3, anticipation: 3 },
    ]);
    
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);
    const [diagnostic, setDiagnostic] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [emailPdfData, setEmailPdfData] = useState({ 
        base64: '', 
        filename: '', 
        reportType: 'decision_radar' as 'proextract' | 'decision_radar',
        language: 'en',
        reportTitle: '',
        overallOutcomes: ''
    });

    const handleTopicChange = (id: string, field: keyof Topic, value: string | number) => {
        setTopics(topics.map(topic => topic.id === id ? { ...topic, [field]: value } : topic));
        setError(null);
    };

    const addTopic = () => {
        if (topics.length >= 5) {
            setError(t.maxTopicsErr);
            return;
        }
        setTopics([...topics, { id: Date.now().toString(), name: '', impact: 3, frequency: 3, cross_functionality: 3, anticipation: 3 }]);
        setError(null);
    };

    const removeTopic = (id: string) => {
        if (topics.length <= 2) {
            setError(t.minTopicsErr);
            return;
        }
        setTopics(topics.filter(t => t.id !== id));
        setError(null);
    };

    const nextStep = () => {
        if (step === 1) {
            if (topics.some(t => t.name.trim() === '')) {
                setError(t.emptyTopicErr);
                return;
            }
            if (topics.length < 2) {
                setError(t.minTopicsErr);
                return;
            }
        }
        setError(null);
        setStep(prev => (prev < 3 ? prev + 1 : prev) as 1 | 2 | 3);
    };

    const prevStep = () => {
        setStep(prev => (prev > 1 ? prev - 1 : prev) as 1 | 2 | 3);
        setError(null);
    };

    const generateDiagnostic = async () => {
        setIsSubmitting(true);
        setError(null);
        
        try {
            const storedUser = localStorage.getItem('proextract_user');
            const user = storedUser ? JSON.parse(storedUser) : null;

            const payload = {
                user_id: user?.user_id,
                language: lang,
                topics: topics.map(topic => ({
                    name: topic.name,
                    topic_context: topic.topic_context,
                    rating_context: topic.rating_context,
                    impact: topic.impact,
                    frequency: topic.frequency,
                    cross_functionality: topic.cross_functionality,
                    anticipation: topic.anticipation
                }))
            };

            const response = await fetch(`${API_URL}/api/decision-radar/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "API Request failed");
            }

            const data = await response.json();
            setDiagnostic(data.overall_diagnostic);
        } catch (err: any) {
            console.error(err);
            setError(err.message || t.apiErr);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate chart data based on topics.
    // We invert 'anticipation' visually so low anticipation means high risk/red zone.
    // We'll normalize to 0-4 visually from 1-5 scale, so (5 - anticipation).
    
    // Instead of doing it by topic as category, it's better to show radar where each axis is a dimension 
    // and each topic is a distinct polygon (web), OR each axis is a topic and each dimension is a polygon.
    // "each topic is a distinct web" -> Polyons = topics. Axes = Dimensions.
    const dimensions = [
        { key: 'impact', label: lang === 'en' ? 'Impact' : 'Impact', fullLabel: t.impact },
        { key: 'frequency', label: lang === 'en' ? 'Frequency' : 'Fréquence', fullLabel: t.frequency },
        { key: 'cross_functionality', label: lang === 'en' ? 'Cross-Func' : 'Transversalité', fullLabel: t.crossFunc },
        { key: 'inverse_anticipation', label: lang === 'en' ? 'Low Anticipation' : 'Faible Anticipation', fullLabel: t.anticipation },
    ];

    const chartData = dimensions.map(dim => {
        const dataPoint: any = { dimension: dim.label };
        topics.forEach(topic => {
            if (dim.key === 'inverse_anticipation') {
                 // Invert so 1 (Crisis) -> 5 (High Risk), 5 (Planned) -> 1 (Low Risk)
                 dataPoint[topic.name] = (6 - topic.anticipation);
            } else {
                 dataPoint[topic.name] = topic[dim.key as keyof Topic];
            }
        });
        return dataPoint;
    });

    const colors = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6"];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/20 pb-20">

            {/* Main Content */}
            <main className="max-w-4xl mx-auto mt-10 px-6">
                
                {/* Intro */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.title}</h1>
                    <p className="text-slate-500 font-medium">{t.desc}</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-10">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {num}
                            </div>
                            {num < 3 && (
                                <div className={`w-16 h-1 mx-2 rounded-full ${step > num ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6 border border-red-200 font-medium text-sm">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {/* Step 1: Input */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-bold mb-2">{t.step1}</h2>
                        <p className="text-slate-500 text-sm mb-6">{t.step1Desc}</p>

                        <div className="space-y-4">
                            {topics.map((topic, index) => (
                                <div key={topic.id} className="flex items-start gap-3">
                                    <div className="bg-slate-100 text-slate-500 font-bold w-8 h-8 mt-2 rounded-lg flex items-center justify-center text-sm shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                value={topic.name}
                                                onChange={(e) => handleTopicChange(topic.id, 'name', e.target.value)}
                                                placeholder={t.topicPlaceholder}
                                                className="flex-1 border p-3 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                            />
                                            {topics.length > 2 && (
                                                <button onClick={() => removeTopic(topic.id)} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={topic.topic_context || ''}
                                            onChange={(e) => handleTopicChange(topic.id, 'topic_context', e.target.value)}
                                            placeholder={lang === 'fr' ? 'Contexte / Détails (Optionnel)' : 'Context / Details (Optional)'}
                                            className="w-full text-xs border p-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-slate-600 font-medium"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {topics.length < 5 && (
                            <button onClick={addTopic} className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-lg">
                                <Plus size={16} /> {t.addTopic}
                            </button>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button onClick={nextStep} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                                {lang === 'en' ? 'Next: Scoring' : 'Suivant: Évaluation'} <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Scoring */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-bold mb-2">{t.step2}</h2>
                        <p className="text-slate-500 text-sm mb-8">{t.step2Desc}</p>

                        <div className="space-y-12">
                            {topics.map((topic, index) => (
                                <div key={topic.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <div className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-md flex items-center justify-center text-sm">
                                            {index + 1}
                                        </div>
                                        {topic.name || `Topic ${index + 1}`}
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                                                <span>{t.impact.split(' (')[0]}</span>
                                                <span className="text-indigo-600">{topic.impact}/5</span>
                                            </label>
                                            <p className="text-[10px] text-slate-400 mb-2">{t.impact}</p>
                                            <input type="range" min="1" max="5" value={topic.impact} onChange={(e) => handleTopicChange(topic.id, 'impact', parseInt(e.target.value))} className="w-full accent-indigo-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                                                <span>{t.frequency.split(' (')[0]}</span>
                                                <span className="text-indigo-600">{topic.frequency}/5</span>
                                            </label>
                                            <p className="text-[10px] text-slate-400 mb-2">{t.frequency}</p>
                                            <input type="range" min="1" max="5" value={topic.frequency} onChange={(e) => handleTopicChange(topic.id, 'frequency', parseInt(e.target.value))} className="w-full accent-indigo-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                                                <span>{t.crossFunc.split(' (')[0]}</span>
                                                <span className="text-indigo-600">{topic.cross_functionality}/5</span>
                                            </label>
                                            <p className="text-[10px] text-slate-400 mb-2">{t.crossFunc}</p>
                                            <input type="range" min="1" max="5" value={topic.cross_functionality} onChange={(e) => handleTopicChange(topic.id, 'cross_functionality', parseInt(e.target.value))} className="w-full accent-indigo-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                                                <span>{t.anticipation.split(' (')[0]}</span>
                                                <span className="text-indigo-600">{topic.anticipation}/5</span>
                                            </label>
                                            <p className="text-[10px] text-slate-400 mb-2">{t.anticipation}</p>
                                            <input type="range" min="1" max="5" value={topic.anticipation} onChange={(e) => handleTopicChange(topic.id, 'anticipation', parseInt(e.target.value))} className="w-full accent-indigo-600" />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 border-t border-slate-200 pt-4">
                                        <textarea
                                            value={topic.rating_context || ''}
                                            onChange={(e) => handleTopicChange(topic.id, 'rating_context', e.target.value)}
                                            placeholder={lang === 'fr' ? 'Contexte additionnel et justification de vos notes (Optionnel)' : 'Additional context or rationale for these ratings (Optional)'}
                                            className="w-full text-sm border border-slate-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none min-h-[80px] text-slate-700 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button onClick={prevStep} className="text-slate-500 px-6 py-3 font-bold hover:text-slate-800 transition-colors">
                            {lang === 'en' ? 'Back' : 'Retour'}
                            </button>
                            <button onClick={nextStep} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                                {lang === 'en' ? 'View Radar' : 'Voir le Radar'} <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Result & Diagnostic */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                        
                        {/* Radar Chart Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold mb-2">{t.step3}</h2>
                            <p className="text-slate-500 text-sm mb-8">{t.step3Desc}</p>

                            <div id="radar-chart-container-live" className="h-[400px] w-full bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#cbd5e1' }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        {topics.map((topic, index) => (
                                            <Radar
                                                key={topic.id}
                                                name={topic.name}
                                                dataKey={topic.name}
                                                stroke={colors[index % colors.length]}
                                                fill={colors[index % colors.length]}
                                                fillOpacity={0.4}
                                                isAnimationActive={false}
                                            />
                                        ))}
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-4 mt-6">
                                {topics.map((topic, index) => (
                                    <div key={topic.id} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                                        {topic.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Diagnostic Section */}
                        <div className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Zap className="text-amber-400" /> {t.step4}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        {diagnostic && !isSubmitting && (
                                            <>
                                                <button 
                                                    disabled={exportLoading}
                                                    onClick={async () => {
                                                        setExportLoading(true);
                                                        try {
                                                                let chartImage = undefined;
                                                                try {
                                                                    const chartElement = document.getElementById('radar-chart-container-live');
                                                                    if (chartElement) {
                                                                        await new Promise(resolve => setTimeout(resolve, 300));
                                                                        const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true, logging: false });
                                                                        chartImage = canvas.toDataURL('image/png');
                                                                    }
                                                                } catch (canvasErr) {
                                                                    console.error("html2canvas failed, proceeding without chart:", canvasErr);
                                                                }
                                                                
                                                                const result = await generateRadarPDF({ topics, overall_diagnostic: diagnostic, language: lang, created_at: new Date().toISOString() }, true, chartImage);
                                                                if (result) {
                                                                    setEmailPdfData({
                                                                        base64: result.base64,
                                                                        filename: result.filename,
                                                                        reportType: 'decision_radar',
                                                                        language: lang,
                                                                        reportTitle: 'Decision Radar Analysis',
                                                                        overallOutcomes: diagnostic?.substring(0, 500) || "Decision Radar Output"
                                                                    });
                                                                    setIsEmailModalOpen(true);
                                                                }
                                                            } catch (error) {
                                                            console.error("Failed to generate PDF with chart", error);
                                                        } finally {
                                                            setExportLoading(false);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                                                >
                                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email
                                                </button>
                                                <button 
                                                    disabled={exportLoading}
                                                    onClick={async () => {
                                                        setExportLoading(true);
                                                        try {
                                                                let chartImage = undefined;
                                                                try {
                                                                    const chartElement = document.getElementById('radar-chart-container-live');
                                                                    if (chartElement) {
                                                                        await new Promise(resolve => setTimeout(resolve, 300));
                                                                        const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true, logging: false });
                                                                        chartImage = canvas.toDataURL('image/png');
                                                                    }
                                                                } catch (canvasErr) {
                                                                    console.error("html2canvas failed, proceeding without chart:", canvasErr);
                                                                }
                                                                await generateRadarPDF({ topics, overall_diagnostic: diagnostic, language: lang, created_at: new Date().toISOString() }, false, chartImage);
                                                            } catch (error) {
                                                            console.error("Failed to generate PDF with chart", error);
                                                        } finally {
                                                            setExportLoading(false);
                                                        }
                                                    }} 
                                                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors border border-slate-700 disabled:opacity-50"
                                                >
                                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                                                </button>
                                            </>
                                        )}
                                        {!diagnostic && !isSubmitting && (
                                            <button onClick={generateDiagnostic} className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors">
                                                {t.submitBtn}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm">{t.step4Desc}</p>
                            </div>

                            <div className="p-8 bg-slate-800/50 min-h-[200px] flex flex-col justify-center relative">
                                {isSubmitting ? (
                                    <div className="text-center">
                                        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-slate-300 font-semibold">{t.loading}</p>
                                    </div>
                                ) : diagnostic ? (
                                    <div className="animate-in fade-in">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-green-500/20 text-green-400 p-2 rounded-lg">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">{t.diagnosticTitle}</h3>
                                                <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-slate-300">
                                                    {diagnostic.split('\n').map((para, i) => (
                                                        <p key={i}>{para}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-500">
                                        <AlertTriangle className="mx-auto mb-3 opacity-50" size={32} />
                                        <p>{lang === 'en' ? 'Click "Generate AI Diagnostic" to interpret the matrix above.' : 'Cliquez sur "Générer le Diagnostic IA" pour interpréter la matrice.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="pb-8 flex items-center justify-between">
                            <button onClick={prevStep} className="text-slate-500 px-6 py-3 font-bold hover:text-slate-800 transition-colors">
                                {lang === 'en' ? 'Back' : 'Retour'}
                            </button>
                            <button 
                                onClick={() => {
                                    setStep(1);
                                    setDiagnostic(null);
                                    setTopics([
                                        { id: Date.now().toString() + '1', name: '', impact: 3, frequency: 3, cross_functionality: 3, anticipation: 3 },
                                        { id: Date.now().toString() + '2', name: '', impact: 3, frequency: 3, cross_functionality: 3, anticipation: 3 },
                                    ]);
                                }} 
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-slate-200"
                            >
                                <Plus size={18} /> {lang === 'en' ? 'New Radar Analysis' : 'Nouvelle Analyse'}
                            </button>
                        </div>
                    </div>
                )}
                
            </main>

            {/* Email Modal */}
            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                userEmail={localStorage.getItem('proextract_user') ? JSON.parse(localStorage.getItem('proextract_user') || '{}').email : undefined}
                recipientName={localStorage.getItem('proextract_user') ? (() => {
                    const u = JSON.parse(localStorage.getItem('proextract_user') || '{}');
                    return u.first_name ? `${u.first_name} ${u.last_name || ''}` : '';
                })() : ''}
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

export default DecisionRadar;
