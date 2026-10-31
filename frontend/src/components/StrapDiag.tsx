import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, ArrowRight, Zap, Target, Search, Menu, X, CheckCircle2, Activity, RefreshCw, TrendingDown, Radar, ShieldCheck, AlertTriangle } from 'lucide-react';
import Footer from './Footer';
import { logout as endSession } from '../utils/apiClient';

const translations = {
    en: {
        back: "Back",
        logIn: "Log In",
        logOut: "Log out",
        dashboard: "Dashboard",
        menu: "Menu",
        tagline: "Discover What Your Operations Are Really Costing You",
        description: "A fast, AI-powered diagnostic that evaluates your organization across 5 critical performance dimensions—pilotage, anticipation, loss management, operational discipline, and reactivity. In just 3 minutes, get your StrAP Index, identify hidden inefficiencies, and estimate the financial impact of your operational losses.",
        point1: "Identify invisible inefficiencies",
        point2: "Benchmark your operational maturity",
        point3: "Estimate financial losses (€ / year)",
        invisibleLossesTitle: "Most operational losses are invisible",
        pain1: "Recurring problems",
        pain2: "Lack of real-time visibility",
        pain3: "Losses not quantified",
        transitionText: "The StrAP Performance Diagnostic™ gives you a fast, structured way to assess your operational maturity and identify where performance is leaking.",
        howItWorksTag: "HOW IT WORKS",
        howItWorksTitle: "A diagnosis based on 5 critical dimensions",
        dim1: "Pilotage (real-time visibility)",
        dim2: "Incident recurrence",
        dim3: "Loss quantification",
        dim4: "Anticipation capability",
        dim5: "Operational discipline",
        cta: "Open StrAP Diagnosis",
        ctaLoggedIn: "Go to Dashboard",
        feature1Title: "AI Root Cause Extraction",
        feature1Desc: "Paste chaotic notes, meeting transcripts, or vague problem statements. The AI structures them into actionable root causes.",
        feature2Title: "Lean Six Sigma Mapping",
        feature2Desc: "Automatically maps identified issues to established Lean Six Sigma frameworks (e.g., DMAIC, 5 Whys, Ishikawa).",
        feature3Title: "Instant Action Plans",
        feature3Desc: "Generates structured, step-by-step action plans to resolve the issue, bridging the gap between analysis and execution.",
        whoIsThisFor: "Who is this for?",
        whoIsThisForDesc: "Plant Managers, Operations Leads, and Continuous Improvement Engineers who need to rapidly diagnose and structure operational friction."
    },
    fr: {
        back: "Retour",
        logIn: "Connexion",
        logOut: "Déconnexion",
        dashboard: "Tableau de Bord",
        menu: "Menu",
        tagline: "Découvrez ce que vos opérations vous coûtent réellement",
        description: "Un diagnostic rapide par IA qui évalue votre organisation selon 5 dimensions critiques de performance—pilotage, anticipation, gestion des pertes, discipline opérationnelle et réactivité. En seulement 3 minutes, obtenez votre Indice StrAP, identifiez les inefficacités cachées et estimez l'impact financier de vos pertes opérationnelles.",
        point1: "Identifier les inefficacités invisibles",
        point2: "Évaluer votre maturité opérationnelle",
        point3: "Estimer les pertes financières (€ / an)",
        invisibleLossesTitle: "La plupart des pertes opérationnelles sont invisibles",
        pain1: "Problèmes récurrents",
        pain2: "Manque de visibilité en temps réel",
        pain3: "Pertes non quantifiées",
        transitionText: "Le Diagnostic de Performance StrAP™ vous offre un moyen rapide et structuré d'évaluer votre maturité opérationnelle et d'identifier où la performance fuit.",
        howItWorksTag: "COMMENT ÇA MARCHE",
        howItWorksTitle: "Un diagnostic axé sur 5 dimensions critiques",
        dim1: "Pilotage (visibilité temps réel)",
        dim2: "Récurrence des incidents",
        dim3: "Quantification des pertes",
        dim4: "Capacité d'anticipation",
        dim5: "Discipline opérationnelle",
        cta: "Ouvrir StrAP Diagnosis",
        ctaLoggedIn: "Accéder au Tableau de Bord",
        feature1Title: "Extraction de Causes par l'IA",
        feature1Desc: "Copiez des notes chaotiques, des transcriptions de réunions, ou des problèmes vagues. L'IA les structure en causes racines actionnables.",
        feature2Title: "Cartographie Lean Six Sigma",
        feature2Desc: "Associe automatiquement les problèmes identifiés aux cadres Lean Six Sigma reconnus (ex: DMAIC, 5 Pourquoi, Ishikawa).",
        feature3Title: "Plans d'Action Instantanés",
        feature3Desc: "Génère des plans d'action structurés, étape par étape, pour résoudre le problème, comblant l'écart entre l'analyse et l'exécution.",
        whoIsThisFor: "Pour qui est-ce ?",
        whoIsThisForDesc: "Directeurs d'usine, responsables des opérations et ingénieurs en amélioration continue qui doivent diagnostiquer rapidement les frictions opérationnelles."
    }
};

const StrapDiag = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ first_name?: string } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [lang] = useState<'en' | 'fr'>(() => {
        const saved = localStorage.getItem('strap_lang');
        return (saved === 'fr' ? 'fr' : 'en');
    });

    const t = translations[lang];

    useEffect(() => {
        window.scrollTo(0, 0);
        const stored = localStorage.getItem('proextract_user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#FF6B00]/20">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
                    <ArrowLeft size={18} /> <span className="hidden sm:inline">{t.back}</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-slate-900">StrAP Tools</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-3">
                    {user ? (
                        <>
                            <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-slate-700 hover:text-[#FF6B00] transition-colors underline-offset-4 hover:underline">
                                Hi, {user.first_name}
                            </button>
                            <button
                                onClick={() => {
                                    endSession('user');
                                    setUser(null);
                                }}
                                className="bg-slate-100 text-slate-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-slate-200 transition-all shadow-sm"
                            >
                                {t.logOut}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} className="bg-[#FF6B00] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#E66000] transition-all shadow-sm">
                            {t.logIn}
                        </button>
                    )}
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu size={24} />
                </button>
            </nav>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="relative w-4/5 max-w-sm ml-auto bg-white h-full shadow-2xl flex flex-col pt-6 pb-8 px-6 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-xl font-bold tracking-tight text-slate-900">{t.menu}</span>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6 flex-1">
                            {user ? (
                                <div className="flex flex-col gap-4 mt-2">
                                    <button
                                        onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                                        className="text-left text-lg font-medium text-slate-900"
                                    >
                                        {t.dashboard} (Hi, {user.first_name})
                                    </button>
                                    <button
                                        onClick={() => {
                                            endSession('user');
                                            setUser(null);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all text-center mt-2"
                                    >
                                        {t.logOut}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 mt-2">
                                    <button
                                        onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                                        className="bg-[#FF6B00] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#E66000] transition-all text-center"
                                    >
                                        {t.logIn}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <header className="py-24 px-6 max-w-5xl mx-auto text-center">
                <div className="bg-[#FF6B00]/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <Brain className="text-[#FF6B00]" size={40} />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-tight">
                    StrAP Performance Diagnostic
                </h1>
                <p className="text-lg sm:text-xl text-[#FF6B00] font-bold mb-8 uppercase tracking-widest relative inline-block">
                    {t.tagline}
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF6B00] rounded-full"></span>
                </p>
                <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                    {t.description}
                </p>

                {/* KPI Points */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-12 max-w-4xl mx-auto text-left">
                    {[t.point1, t.point2, t.point3].map((point, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto overflow-hidden group hover:border-[#FF6B00]/30 hover:shadow-md transition-all">
                            <div className="bg-[#FF6B00]/10 text-[#FF6B00] rounded-full p-1 shrink-0 group-hover:scale-110 transition-transform">
                                <CheckCircle2 size={18} className="stroke-[3px]" />
                            </div>
                            <span className="font-semibold text-slate-700 text-sm md:text-base">{point}</span>
                        </div>
                    ))}
                </div>
                {user ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/submit')}
                            className="bg-[#FF6B00] hover:bg-[#E66000] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF6B00]/30 text-lg w-full sm:w-auto"
                        >
                            {t.cta} <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-white hover:bg-slate-50 border-2 border-[#FF6B00] text-[#FF6B00] px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-lg shadow-sm w-full sm:w-auto"
                        >
                            {t.ctaLoggedIn}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-[#FF6B00] hover:bg-[#E66000] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-[#FF6B00]/30 text-lg w-full sm:w-auto"
                    >
                        {t.cta} <ArrowRight size={20} />
                    </button>
                )}
            </header>

            {/* Invisible Losses & How it Works */}
            <section className="py-24 px-6 bg-slate-50 border-y border-slate-200">
                <div className="max-w-6xl mx-auto">
                    {/* Pain Points */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
                                {t.invisibleLossesTitle}
                            </h2>
                            <div className="space-y-4 mb-10">
                                {[t.pain1, t.pain2, t.pain3].map((pain, i) => (
                                    <div key={i} className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="bg-red-50 text-red-500 rounded-xl p-3 shrink-0">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <span className="text-lg font-bold text-slate-800">{pain}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pl-6 border-l-4 border-[#FF6B00]">
                                <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
                                    {t.transitionText}
                                </p>
                            </div>
                        </div>
                        {/* Abstract visual for losses */}
                        <div className="order-1 lg:order-2 relative h-[300px] lg:h-[400px] bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                            <svg className="absolute inset-0 w-full h-full opacity-10 text-slate-900" viewBox="0 0 400 300" preserveAspectRatio="none">
                                <path d="M0 250 Q 100 250 200 150 T 400 50 L 400 300 L 0 300 Z" fill="currentColor"/>
                            </svg>
                            <TrendingDown size={80} className="text-red-400 absolute opacity-80" strokeWidth={1} />
                        </div>
                    </div>

                    {/* How It Works - Circular Diagram */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                            <span className="w-6 h-px bg-[#FF6B00]"></span> {t.howItWorksTag} <span className="w-6 h-px bg-[#FF6B00]"></span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">{t.howItWorksTitle}</h2>
                    </div>

                    <div className="flex flex-col items-center justify-center py-10 overflow-x-hidden">
                        <div className="relative w-80 h-80 sm:w-96 sm:h-96 shrink-0 flex items-center justify-center">
                            {/* SVG connections */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" className="animate-[spin_40s_linear_infinite]" />
                                {/* Pentagon lines connecting icons to center optionally, or letting them orbit */}
                                <polygon points="50,12 86,38 72,80 28,80 14,38" fill="none" stroke="#FF6B00" strokeWidth="0.5" strokeOpacity="0.3" />
                            </svg>
                            
                            {/* Center Node */}
                            <div className="relative z-10 w-28 h-28 bg-white rounded-full shadow-lg border-4 border-[#FF6B00]/20 flex flex-col items-center justify-center">
                                <Brain className="text-[#FF6B00]" size={36} />
                                <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">System</span>
                            </div>
                            
                            {/* Orbiting Nodes */}
                            {[
                                { icon: Activity, title: t.dim1, top: '0%', left: '50%' },
                                { icon: RefreshCw, title: t.dim2, top: '38%', left: '97.5%' },
                                { icon: TrendingDown, title: t.dim3, top: '90.5%', left: '79.4%' },
                                { icon: Radar, title: t.dim4, top: '90.5%', left: '20.6%' },
                                { icon: ShieldCheck, title: t.dim5, top: '38%', left: '2.5%' }
                            ].map((node, i) => (
                                <div key={i} className="absolute w-20 flex flex-col items-center group cursor-pointer" style={{ top: node.top, left: node.left, transform: 'translate(-50%, -50%)' }}>
                                    <div className="w-14 h-14 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-[#FF6B00] group-hover:border-[#FF6B00] group-hover:scale-110 group-hover:shadow-[#FF6B00]/20 transition-all duration-300 relative z-10">
                                        <node.icon size={24} />
                                    </div>
                                    <span className="absolute top-[60px] text-xs font-bold text-slate-700 text-center w-32 md:w-40 leading-tight drop-shadow-sm group-hover:text-[#FF6B00] transition-colors">{node.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-6 bg-white border-y border-slate-200">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
                    <div className="text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <Search className="text-[#FF6B00]" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t.feature1Title}</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {t.feature1Desc}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <Target className="text-[#FF6B00]" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t.feature2Title}</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {t.feature2Desc}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <Zap className="text-[#FF6B00]" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t.feature3Title}</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {t.feature3Desc}
                        </p>
                    </div>
                </div>
            </section>

            {/* Target Audience */}
            <section className="py-20 px-6 max-w-4xl mx-auto text-center">
                <div className="bg-[#FFF8F4] rounded-2xl p-8 border border-orange-100">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.whoIsThisFor}</h2>
                    <p className="text-lg text-slate-700 font-medium">
                        {t.whoIsThisForDesc}
                    </p>
                </div>
            </section>

            {/* Footer */}
            <Footer lang={lang as 'en' | 'fr'} />
        </div>
    );
};

export default StrapDiag;
