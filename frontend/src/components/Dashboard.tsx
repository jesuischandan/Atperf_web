import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Zap, AlertCircle, Loader2, LayoutDashboard, Navigation, Download, Mail, Activity, TrendingDown, Brain, BarChart3, Target, AlertTriangle, ShieldAlert, Flag } from 'lucide-react';
import ProfileModal from './ProfileModal';
import EmailModal, { type ReportType } from './EmailModal';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import html2canvas from 'html2canvas';

import API_URL from '../utils/apiUrl';
import { generateRadarPDF, generateStrapDiagPDF, generateStrapAnalysisPDF, generateStrapilotPDF } from '../utils/pdfGenerator';
import { logout as endSession } from '../utils/apiClient';

interface RadarTopic {
    id: string;
    name: string;
    impact: number;
    frequency: number;
    cross_functionality: number;
    anticipation: number;
}

interface RadarSubmission {
    id: string;
    user_id: string | null;
    language: string;
    overall_diagnostic: string | null;
    created_at: string;
    topics: RadarTopic[];
}

interface StrapDiagnostic {
    id: string;
    score_100: number;
    category_result: string;
    loss_estimation_min: number;
    loss_estimation_max: number;
    loss_pct_min?: number;
    loss_pct_max?: number;
    ai_advice: string;
    created_at: string;
}

interface StrapilotSession {
    id: string;
    file_name: string;
    status: string;
    created_at: string;
    dashboard_payload: any | null;
    strap_analysis_payload?: any | null;
    analysis_mode?: 'strap_analysis' | 'standard';
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [radarHistory, setRadarHistory] = useState<RadarSubmission[]>([]);
    const [strapHistory, setStrapHistory] = useState<StrapDiagnostic[]>([]);
    const [pilotHistory, setPilotHistory] = useState<StrapilotSession[]>([]);
    const [activeTab, setActiveTab] = useState<'radar' | 'strap' | 'pilot'>('pilot');
    const [selectedRadar, setSelectedRadar] = useState<RadarSubmission | null>(null);
    const [selectedStrap, setSelectedStrap] = useState<StrapDiagnostic | null>(null);
    const [selectedPilot, setSelectedPilot] = useState<StrapilotSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<{ user_id?: string, first_name?: string, last_name?: string, email?: string, role?: string, status?: string, company_id?: string } | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [emailPdfData, setEmailPdfData] = useState({
        base64: '',
        filename: '',
        reportType: 'strap' as ReportType,
        language: 'en',
        reportTitle: '',
        overallOutcomes: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('proextract_user');
        let currentUser = null;
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                setUser(currentUser);
            } catch (e) {
                // Ignore
            }
        }

        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch Decision Radar history
                const radarUrl = `${API_URL}/api/decision-radar/history?user_id=${currentUser.user_id}&t=${Date.now()}`;
                const radarRes = await fetch(radarUrl, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                });
                if (radarRes.ok) {
                    setRadarHistory(await radarRes.json());
                }

                // Fetch StrAP history
                const strapUrl = `${API_URL}/api/strap-diagnostics/history?user_id=${currentUser.user_id}&t=${Date.now()}`;
                const strapRes = await fetch(strapUrl, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                });
                if (strapRes.ok) {
                    setStrapHistory(await strapRes.json());
                }

                // Fetch StrAPilot history
                const pilotUrl = `${API_URL}/api/strapilot/history?user_id=${currentUser.user_id}&t=${Date.now()}`;
                const pilotRes = await fetch(pilotUrl, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                });
                if (pilotRes.ok) {
                    setPilotHistory(await pilotRes.json());
                }
            } catch (err: any) {
                setError(err.message || 'Could not connect to the backend.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

    const getControlColorStyles = (color: string) => {
        if (color === 'red') return 'bg-red-500 shadow-red-500/20';
        if (color === 'green') return 'bg-emerald-500 shadow-emerald-500/20';
        return 'bg-amber-500 shadow-amber-500/20';
    };
    const getRadarChartData = (topics: RadarTopic[], language: string = 'en') => {
        const dimensions = [
            { key: 'impact', label: language === 'en' ? 'Impact' : 'Impact' },
            { key: 'frequency', label: language === 'en' ? 'Frequency' : 'Fréquence' },
            { key: 'cross_functionality', label: language === 'en' ? 'Cross-Func' : 'Transversalité' },
            { key: 'inverse_anticipation', label: language === 'en' ? 'Low Anticipation' : 'Faible Anticipation' },
        ];

        return dimensions.map(dim => {
            const dataPoint: any = { dimension: dim.label };
            topics.forEach(topic => {
                if (dim.key === 'inverse_anticipation') {
                    // Invert anticipation: 1 -> 5, 5 -> 1
                    dataPoint[topic.name] = (6 - topic.anticipation);
                } else {
                    dataPoint[topic.name] = topic[dim.key as keyof RadarTopic];
                }
            });
            return dataPoint;
        });
    };

    const handleRadarPdf = async (radar: RadarSubmission, asBase64: boolean = false) => {
        setExportLoading(true);
        try {
            const chartElement = document.getElementById('radar-chart-container');
            let chartImage = undefined;

            if (chartElement) {
                await new Promise(resolve => setTimeout(resolve, 300));
                const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true, logging: false });
                chartImage = canvas.toDataURL('image/png');
            }

            return await generateRadarPDF(radar, asBase64, chartImage);
        } catch (error) {
            console.error("Failed to generate PDF with chart", error);
            return await generateRadarPDF(radar, asBase64);
        } finally {
            setExportLoading(false);
        }
    };



    const handlePilotPdfExport = async (forEmail: boolean = false) => {
        if (!selectedPilot) return null;
        setExportLoading(true);
        try {
            const sessionData = {
                created_at: selectedPilot.created_at || new Date().toISOString(),
                file_name: selectedPilot.file_name || "Dataset",
                dashboard_payload: selectedPilot.dashboard_payload,
                strap_analysis_payload: selectedPilot.strap_analysis_payload
            };

            if (selectedPilot.analysis_mode === 'strap_analysis') {
                const result = await generateStrapAnalysisPDF(sessionData, forEmail);
                if (forEmail && result) {
                    setEmailPdfData({
                        base64: result.base64,
                        filename: result.filename,
                        reportType: 'strap_analysis',
                        language: 'fr',
                        reportTitle: `Analyse STRAP: ${sessionData.file_name}`,
                        overallOutcomes: "StrAP Analyse Output"
                    });
                    setIsEmailModalOpen(true);
                }
                return result;
            } else {
                const result = await generateStrapilotPDF(sessionData, forEmail, []);
                if (forEmail && result) {
                    setEmailPdfData({
                        base64: result.base64,
                        filename: result.filename,
                        reportType: 'strapilot',
                        language: 'en',
                        reportTitle: `Dashboard: ${sessionData.file_name}`,
                        overallOutcomes: "Dashboard Output"
                    });
                    setIsEmailModalOpen(true);
                }
                return result;
            }
        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setExportLoading(false);
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Nav */}
            <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 sticky top-0 z-10">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> Home
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-[#FF6B00] p-1.5 rounded-lg"><Zap size={16} className="fill-white" /></div>
                    <span className="font-bold text-slate-900 tracking-tight">Welcome to your dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                    {user && (
                        <>
                            <button
                                onClick={() => setIsProfileOpen(true)}
                                className="text-sm font-medium text-slate-700 hover:text-[#FF6B00] transition-colors hidden sm:inline-block cursor-pointer decoration-orange-200 underline-offset-4 hover:underline"
                            >
                                Hi, {user.first_name}
                            </button>
                            {(user.role === 'admin' || user.role === 'super_admin') && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-700 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    Admin
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    endSession('user');
                                    setUser(null);
                                    navigate('/');
                                }}
                                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-200 transition-all shadow-sm hidden sm:inline-flex"
                            >
                                Log out
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Profile Modal */}
            {isProfileOpen && user && user.user_id && (
                <ProfileModal
                    user={user as any}
                    onClose={() => setIsProfileOpen(false)}
                    onUpdate={(updatedUser) => {
                        setUser(updatedUser);
                        localStorage.setItem('proextract_user', JSON.stringify(updatedUser));
                    }}
                />
            )}

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
                {/* Title */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-orange-100 p-2 rounded-xl"><LayoutDashboard size={24} className="text-[#FF6B00]" /></div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard | StrAP Tools</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('strap')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${activeTab === 'strap'
                            ? 'border-[#FF6B00] text-[#FF6B00]'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Activity size={16} />
                        StrAP Diagnostic
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'strap' ? 'bg-orange-100 text-[#FF6B00]' : 'bg-slate-100 text-slate-500'
                            }`}>{strapHistory.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('radar')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${activeTab === 'radar'
                            ? 'border-[#FF6B00] text-[#FF6B00]'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Navigation size={16} />
                        Decision Radar
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'radar' ? 'bg-orange-100 text-[#FF6B00]' : 'bg-slate-100 text-slate-500'
                            }`}>{radarHistory.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pilot')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${activeTab === 'pilot'
                            ? 'border-[#FF6B00] text-[#FF6B00]'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Brain size={16} />
                        StrAPilot
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'pilot' ? 'bg-orange-100 text-[#FF6B00]' : 'bg-slate-100 text-slate-500'
                            }`}>{pilotHistory.length}</span>
                    </button>

                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                        <Loader2 size={32} className="animate-spin mb-4 text-[#FF6B00]" />
                        <p>Loading your data...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 rounded-2xl bg-red-50 border border-red-200 flex flex-col items-center text-center">
                        <AlertCircle size={32} className="text-red-500 mb-2" />
                        <h3 className="text-lg font-bold text-red-900 mb-1">Failed to load data</h3>
                        <p className="text-red-700">{error}</p>
                    </div>
                ) : (
                    <>


                        {/* ======== Decision Radar Tab ======== */}
                        {activeTab === 'radar' && (
                            <>
                                <div className="flex justify-end mb-6">
                                    <button onClick={() => navigate('/decision-radar')} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E66000] transition-all flex items-center gap-2 shadow-sm">
                                        <Plus size={16} /> New Radar Analysis
                                    </button>
                                </div>

                                {radarHistory.length === 0 ? (
                                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center max-w-2xl mx-auto bg-white/50">
                                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Navigation size={24} className="text-slate-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-2">No radar analyses yet</h2>
                                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Use the Decision Radar to score and prioritize your operational friction points.</p>
                                        <button onClick={() => navigate('/decision-radar')} className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#E66000] transition-all inline-flex items-center gap-2 shadow-lg shadow-[#FF6B00]/20">
                                            <Navigation size={18} /> Start First Analysis
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {radarHistory.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => setSelectedRadar(sub)}
                                                className="text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex flex-col w-full"
                                            >
                                                <div className="flex justify-between items-start mb-4 gap-4">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 leading-tight mb-1">
                                                            Radar Analysis
                                                        </h3>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            {new Date(sub.created_at).toLocaleDateString()} · {sub.language.toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-orange-100 text-[#FF6B00] border-orange-200 shrink-0">
                                                        {sub.topics.length} topics
                                                    </div>
                                                </div>

                                                {/* Topic pills */}
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    {sub.topics.map(topic => (
                                                        <span key={topic.id} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600">
                                                            {topic.name}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Diagnostic preview */}
                                                {sub.overall_diagnostic && (
                                                    <p className="text-sm text-slate-500 line-clamp-3 flex-1">
                                                        {sub.overall_diagnostic}
                                                    </p>
                                                )}

                                                <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                                                    {new Date(sub.created_at).toLocaleString()}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {/* ======== StrAP Diagnostic Tab ======== */}
                        {activeTab === 'strap' && (
                            <>
                                <div className="flex justify-end mb-6">
                                    <button onClick={() => navigate('/tool/strap-diagnosis')} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E66000] transition-all flex items-center gap-2 shadow-sm">
                                        <Plus size={16} /> New StrAP Diagnosis
                                    </button>
                                </div>

                                {strapHistory.length === 0 ? (
                                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center max-w-2xl mx-auto bg-white/50">
                                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Activity size={24} className="text-slate-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-2">Pas encore de diagnostic</h2>
                                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Évaluez vos pertes invisibles avec le diagnostic StrAP.</p>
                                        <button onClick={() => navigate('/tool/strap-diagnosis')} className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#E66000] transition-all inline-flex items-center gap-2 shadow-lg shadow-[#FF6B00]/20">
                                            <Activity size={18} /> Démarrer le Diagnostic
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {strapHistory.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => setSelectedStrap(sub)}
                                                className="text-left bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col h-[280px] group"
                                            >
                                                <div className="flex items-start justify-between mb-4 w-full">
                                                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Activity size={20} />
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-slate-900">{sub.score_100}</span>
                                                        <span className="text-sm font-bold text-slate-400">/ 100</span>
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{sub.category_result}</h3>

                                                <div className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg mb-4 inline-flex items-center gap-1.5">
                                                    <TrendingDown size={14} />
                                                    {sub.loss_pct_min != null ? `${sub.loss_pct_min}% - ${sub.loss_pct_max}% de pertes` : `${sub.loss_estimation_min} - ${sub.loss_estimation_max} M€ de pertes`}
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                                                    {new Date(sub.created_at).toLocaleDateString()}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {/* ======== StrAPilot Tab ======== */}
                        {activeTab === 'pilot' && (
                            <>
                                <div className="flex justify-end mb-6">
                                    <button onClick={() => navigate('/tool/strapilot/app')} className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E66000] transition-all flex items-center gap-2 shadow-sm">
                                        <Plus size={16} /> New StrAPilot Dashboard
                                    </button>
                                </div>

                                {pilotHistory.length === 0 ? (
                                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center max-w-2xl mx-auto bg-white/50">
                                        <h2 className="text-xl font-bold text-slate-900 mb-2">No StrAPilot sessions yet</h2>
                                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Upload your data and let AI generate KPIs for you.</p>
                                        <button onClick={() => navigate('/tool/strapilot/app')} className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#E66000] transition-all inline-flex items-center gap-2 shadow-lg shadow-[#FF6B00]/20">
                                            Start AI Analysis
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pilotHistory.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => {
                                                    if (sub.status === 'dashboard_ready' || sub.status === 'strap_ready') {
                                                        setSelectedPilot(sub);
                                                    } else {
                                                        alert("Analysis was not completed for this session.");
                                                    }
                                                }}
                                                className={`text-left bg-white border ${(sub.status === 'dashboard_ready' || sub.status === 'strap_ready') ? 'border-slate-200 hover:border-orange-200 hover:shadow-md cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'} rounded-2xl p-6 shadow-sm transition-all flex flex-col w-full`}
                                            >
                                                <div className="flex justify-between items-start mb-4 gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {sub.analysis_mode === 'strap_analysis' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold tracking-wider uppercase">
                                                                    <Brain size={10} /> Analyse STRAP
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold tracking-wider uppercase">
                                                                    <BarChart3 size={10} /> Dashboard
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-bold text-slate-900 leading-tight mb-1 truncate">
                                                            {sub.file_name}
                                                        </h3>
                                                        <p className="text-xs font-bold text-slate-400 tracking-widest">
                                                            {sub.status.replace('_', ' ').toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium flex justify-between">
                                                    <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </main>


            {/* Decision Radar Detail Modal */}
            {selectedRadar && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
                        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Decision Radar</p>
                                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">Radar Analysis</h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {new Date(selectedRadar.created_at).toLocaleString()} · {selectedRadar.language.toUpperCase()}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        const result = await handleRadarPdf(selectedRadar, true);
                                        if (result) {
                                            setEmailPdfData({
                                                base64: result.base64,
                                                filename: result.filename,
                                                reportType: 'decision_radar',
                                                language: selectedRadar.language,
                                                reportTitle: 'Decision Radar Analysis',
                                                overallOutcomes: selectedRadar.overall_diagnostic?.substring(0, 500) || "Decision Radar Output"
                                            });
                                            setIsEmailModalOpen(true);
                                        }
                                    }}
                                    disabled={exportLoading}
                                    className="flex items-center gap-1.5 bg-[#FF6B00] hover:bg-[#E66000] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email
                                </button>
                                <button
                                    onClick={() => handleRadarPdf(selectedRadar)}
                                    disabled={exportLoading}
                                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors border border-slate-700 disabled:opacity-50"
                                >
                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                                </button>
                                <button
                                    onClick={() => setSelectedRadar(null)}
                                    className="text-slate-400 hover:text-slate-700 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5 text-sm text-slate-700">
                            {/* Topics Grid */}
                            <section>
                                <p className="text-[11px] font-bold uppercase text-slate-400 mb-3">Topics Scored</p>
                                <div className="space-y-3">
                                    {selectedRadar.topics.map(topic => (
                                        <div key={topic.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <h4 className="font-bold text-slate-800 mb-2">{topic.name}</h4>
                                            <div className="grid grid-cols-4 gap-3">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Impact</p>
                                                    <p className="text-lg font-extrabold text-[#FF6B00]">{topic.impact}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Frequency</p>
                                                    <p className="text-lg font-extrabold text-pink-600">{topic.frequency}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cross-Func</p>
                                                    <p className="text-lg font-extrabold text-amber-600">{topic.cross_functionality}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Anticipation</p>
                                                    <p className="text-lg font-extrabold text-emerald-600">{topic.anticipation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Radar Graph */}
                            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 mt-6">
                                <h2 className="text-xl font-bold mb-2">Radar Capabilities</h2>
                                <div id="radar-chart-container" className="h-[400px] w-full bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarChartData(selectedRadar.topics, selectedRadar.language)}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#cbd5e1' }} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            {selectedRadar.topics.map((topic, index) => (
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
                                <div className="flex flex-wrap justify-center gap-4 mt-4">
                                    {selectedRadar.topics.map((topic, index) => (
                                        <div key={topic.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                                            {topic.name}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* AI Diagnostic */}
                            {selectedRadar.overall_diagnostic && (
                                <section className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden mt-6">
                                    <div className="p-8 border-b border-slate-800">
                                        <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                                            <Zap className="text-amber-400" /> AI Diagnostic
                                        </h2>
                                        <p className="text-slate-400 text-sm">Strategic insights based on your scored topics.</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-8">
                                        <div className="prose prose-invert max-w-none text-slate-300">
                                            {selectedRadar.overall_diagnostic.split('\n').map((para: string, i: number) => (
                                                <p key={i} className="mb-4 leading-relaxed">{para}</p>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* StrAP Detail Modal */}
            {selectedStrap && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
                        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Diagnostic StrAP</p>
                                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{selectedStrap.category_result}</h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {new Date(selectedStrap.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        setExportLoading(true);
                                        try {
                                            const pdfResult = await generateStrapDiagPDF(selectedStrap, true);
                                            if (pdfResult) {
                                                setEmailPdfData({
                                                    base64: pdfResult.base64,
                                                    filename: pdfResult.filename,
                                                    reportType: 'strap',
                                                    language: 'fr',
                                                    reportTitle: 'Diagnostic StrAP',
                                                    overallOutcomes: selectedStrap.category_result
                                                });
                                                setIsEmailModalOpen(true);
                                            }
                                        } finally {
                                            setExportLoading(false);
                                        }
                                    }}
                                    disabled={exportLoading}
                                    className="flex items-center gap-1.5 text-[#FF6B00] hover:text-[#E66000] text-sm font-bold bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email
                                </button>
                                <button
                                    onClick={async () => {
                                        setExportLoading(true);
                                        try {
                                            await generateStrapDiagPDF(selectedStrap);
                                        } finally {
                                            setExportLoading(false);
                                        }
                                    }}
                                    disabled={exportLoading}
                                    className="flex items-center gap-1.5 text-[#FF6B00] hover:text-[#E66000] text-sm font-bold bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                                </button>
                                <button
                                    onClick={() => setSelectedStrap(null)}
                                    className="text-slate-400 hover:text-slate-700 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5 text-sm text-slate-700">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                                    <p className="text-[11px] font-bold uppercase text-indigo-700 mb-1">Score</p>
                                    <p className="text-3xl font-black text-indigo-900">{selectedStrap.score_100} / 100</p>
                                </div>
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                                    <p className="text-[11px] font-bold uppercase text-red-700 mb-1">Pertes Estimées</p>
                                    <p className="text-xl font-black text-red-900">
                                        {selectedStrap.loss_pct_min != null ? `${selectedStrap.loss_pct_min}% - ${selectedStrap.loss_pct_max}%` : `${selectedStrap.loss_estimation_min} - ${selectedStrap.loss_estimation_max} M€`}
                                    </p>
                                </div>
                            </div>

                            {selectedStrap.ai_advice && (
                                <section className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden mt-6">
                                    <div className="p-6 border-b border-slate-800">
                                        <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                                            <Brain className="text-amber-400" size={18} /> Recommandation Stratégique
                                        </h2>
                                    </div>
                                    <div className="bg-slate-800/50 p-6">
                                        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
                                            {selectedStrap.ai_advice.split('\n').map((para: string, i: number) => (
                                                <p key={i} className={para.trim() ? "mb-3" : "mb-0"}>{para}</p>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* StrAPilot Detail Modal */}
            {selectedPilot && (selectedPilot.dashboard_payload || selectedPilot.strap_analysis_payload) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
                        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                                    {selectedPilot.analysis_mode === 'strap_analysis' ? 'Analyse STRAP' : 'StrAPilot Dashboard'}
                                </p>
                                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{selectedPilot.file_name}</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handlePilotPdfExport(true)}
                                    disabled={exportLoading}
                                    className="flex items-center gap-1.5 text-[#FF6B00] hover:text-[#E66000] text-sm font-bold bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email
                                </button>
                                <button
                                    onClick={() => handlePilotPdfExport(false)}
                                    disabled={exportLoading}
                                    className="flex items-center gap-1.5 text-[#FF6B00] hover:text-[#E66000] text-sm font-bold bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                                </button>
                                <button
                                    onClick={() => setSelectedPilot(null)}
                                    className="text-slate-400 hover:text-slate-700 text-sm font-medium ml-2"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-6">
                            {selectedPilot.analysis_mode === 'strap_analysis' && selectedPilot.strap_analysis_payload ? (
                                <div className="space-y-6">
                                    {/* 1. Synthèse (HERO) */}
                                    <div className={`rounded-3xl p-6 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 ${getControlColorStyles(selectedPilot.strap_analysis_payload.summary.control_color)} shadow-sm`}>
                                        <div className="max-w-xl z-10">
                                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                                                Niveau de maîtrise : {selectedPilot.strap_analysis_payload.summary.control_level}
                                            </span>
                                            <div className="space-y-2 mt-2 text-white/90 text-sm">
                                                <p className="flex gap-2 items-start"><Target className="shrink-0 mt-0.5" size={16} /> <strong>Problème :</strong> {selectedPilot.strap_analysis_payload.summary.main_problem}</p>
                                                <p className="flex gap-2 items-start"><Zap className="shrink-0 mt-0.5" size={16} /> <strong>Levier :</strong> {selectedPilot.strap_analysis_payload.summary.key_lever}</p>
                                                <p className="flex gap-2 items-start"><AlertTriangle className="shrink-0 mt-0.5" size={16} /> <strong>Risque :</strong> {selectedPilot.strap_analysis_payload.summary.risk}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 rounded-2xl w-full md:w-64 z-10">
                                            <p className="text-[10px] uppercase tracking-wider font-bold mb-1">Action Prioritaire</p>
                                            <p className="text-sm font-bold">{selectedPilot.strap_analysis_payload.summary.priority_action}</p>
                                        </div>
                                    </div>

                                    {/* 2. KPI Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedPilot.strap_analysis_payload.kpi_cards.map((kpi: any, idx: number) => (
                                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                                <p className="text-slate-500 font-medium text-xs mb-1">{kpi.label}</p>
                                                <p className={`text-2xl font-black ${kpi.color === 'red' ? 'text-red-500' : kpi.color === 'green' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {kpi.value}
                                                </p>
                                                <div className={`mt-1 flex items-center gap-1 text-xs font-bold ${kpi.trend_direction === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {kpi.trend}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* 3. Variables Influentes */}
                                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                                            <h3 className="text-md font-bold flex items-center gap-2 mb-2 text-slate-800">
                                                <Target size={16} className="text-indigo-500" /> Variables Influentes
                                            </h3>
                                            {selectedPilot.strap_analysis_payload.influential_variables.map((v: any, idx: number) => (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className="text-slate-700">{v.name}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${v.impact === 'high' ? 'bg-red-100 text-red-700' : v.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                                            {v.impact}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">{v.reason}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 4. Signaux Faibles */}
                                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                                            <h3 className="text-md font-bold flex items-center gap-2 mb-2 text-slate-800">
                                                <Activity size={16} className="text-amber-500" /> Signaux Faibles
                                            </h3>
                                            {selectedPilot.strap_analysis_payload.weak_signals.map((ws: any, idx: number) => (
                                                <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex gap-2 items-start">
                                                    <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={14} />
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-xs mb-0.5">{ws.title}</p>
                                                        <p className="text-[10px] text-slate-600">{ws.detail}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* 7. Actions */}
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h3 className="text-md font-bold flex items-center gap-2 mb-4 text-slate-800">
                                            <Flag size={16} className="text-[#FF6B00]" /> Actions Recommandées
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-3">
                                            {selectedPilot.strap_analysis_payload.actions.map((act: any, idx: number) => (
                                                <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                                                    <p className="font-bold text-slate-800 text-xs mb-1">{act.title}</p>
                                                    <p className="text-[10px] text-slate-500">{act.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {selectedPilot.dashboard_payload?.stats?.map((stat: any, i: number) => (
                                            <div key={i} className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                                                <p className="text-[11px] font-bold uppercase text-orange-700 mb-1 truncate">{stat.label}</p>
                                                <p className="text-2xl font-black text-orange-900 truncate">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Overall Analysis */}
                                    {selectedPilot.dashboard_payload?.overall_analysis && (
                                        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-sm text-sm leading-relaxed">
                                            <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Brain size={16} className="text-orange-400"/> Executive Analysis</h3>
                                            <p>{selectedPilot.dashboard_payload.overall_analysis}</p>
                                        </div>
                                    )}

                                    {/* Charts Info (Just text for history preview, full charts in tool) */}
                                    {selectedPilot.dashboard_payload?.kpis && (
                                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                                            <h3 className="font-bold text-slate-900 mb-4 text-lg">Exported KPIs</h3>
                                            <div className="space-y-6">
                                                {selectedPilot.dashboard_payload.kpis.map((kpi: any, i: number) => (
                                                    <div key={i} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <BarChart3 size={16} className="text-[#FF6B00]" />
                                                            <h4 className="font-bold text-slate-800">{kpi.title}</h4>
                                                            <span className="text-[10px] uppercase font-bold bg-slate-100 px-2 rounded-full tracking-wider">{kpi.chart_type}</span>
                                                        </div>
                                                        <p className="text-slate-500 text-sm mb-4 pl-6">{kpi.explanation}</p>
                                                        <div className="h-[250px] w-full pl-6 mt-2">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                {kpi.chart_type === 'line' ? (
                                                                    <LineChart data={kpi.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                        <XAxis dataKey="x" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                                                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                                                        <RechartsTooltip 
                                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                                            cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                                                                        />
                                                                        <Line type="monotone" dataKey="y" stroke="#FF6B00" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                                                    </LineChart>
                                                                ) : (
                                                                    <BarChart data={kpi.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                        <XAxis dataKey="x" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                                                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                                                        <RechartsTooltip 
                                                                            cursor={{ fill: '#f8fafc' }}
                                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                                        />
                                                                        <Bar dataKey="y" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                                                                    </BarChart>
                                                                )}
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Open Questions */}
                                    {selectedPilot.dashboard_payload?.open_questions && selectedPilot.dashboard_payload.open_questions.length > 0 && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                            <h3 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2"><AlertCircle size={18} className="text-amber-500" /> Open Questions</h3>
                                            <div className="space-y-3">
                                                {selectedPilot.dashboard_payload.open_questions.map((oq: any, i: number) => (
                                                    <div key={i} className="flex gap-4 items-start">
                                                        <span className="font-mono text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 font-bold shrink-0">{oq.column_name}</span>
                                                        <p className="text-slate-600">{oq.question}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                userEmail={user?.email}
                recipientName={user?.first_name ? `${user.first_name} ${user.last_name || ''}` : ''}
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
