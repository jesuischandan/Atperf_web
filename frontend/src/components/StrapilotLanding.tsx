import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, ArrowRight, CheckCircle2, BarChart3, Menu, X, Brain } from 'lucide-react';
import Footer from './Footer';
import { logout as endSession } from '../utils/apiClient';

const translations = {
    en: {
        back: "Back",
        logIn: "Log In",
        logOut: "Log out",
        dashboard: "Dashboard",
        menu: "Menu",
        tagline: "The AI Copilot for Your Data",
        description: "Upload your structural data (CSV/Excel) and let AI combine it with your context to perform a deep predictive STRAP analysis, detecting weak signals and performance levers in seconds.",
        ctaLoggedIn: "Launch StrAPilot",
        ctaLoggedOut: "Try StrAPilot Now",
        dashboardBtn: "Go to Dashboard",
        feature1Title: "Auto-Detected Headers",
        feature1Desc: "No more mapping columns. StrAPilot's AI reads your data snippet and instantly understands your operational variables.",
        feature2Title: "AI Suggested KPIs",
        feature2Desc: "Stop guessing what to chart. Our AI analyzes your data structure and proposes the 2-3 most impactful visual metrics.",
        feature3Title: "Overall Executive Analysis",
        feature3Desc: "Get a plain-text, high-level summary of exactly what the data means, ready for your next management review.",
        whoIsThisFor: "Who is this for?",
        whoIsThisForDesc: "Plant Managers, Continuous Improvement Leads, and Operations Directors who have the data but no time to build the dashboard."
    },
    fr: {
        back: "Retour",
        logIn: "Connexion",
        logOut: "Déconnexion",
        dashboard: "Tableau de Bord",
        menu: "Menu",
        tagline: "Le Copilote IA de vos Données",
        description: "Uploadez vos données structurées (CSV/Excel) et laissez l'IA les croiser avec votre contexte pour générer une analyse STRAP prédictive, détectant les signaux faibles et leviers de performance en quelques secondes.",
        ctaLoggedIn: "Lancer StrAPilot",
        ctaLoggedOut: "Essayer StrAPilot Maintenant",
        dashboardBtn: "Accéder au Tableau de Bord",
        feature1Title: "Détection Auto des Colonnes",
        feature1Desc: "Fini le mappage manuel. L'IA de StrAPilot lit un extrait de vos données et comprend instantanément vos variables opérationnelles.",
        feature2Title: "KPIs Suggérés par l'IA",
        feature2Desc: "Ne devinez plus quoi grapher. Notre IA analyse la structure de vos données et propose les 2 à 3 métriques visuelles les plus impactantes.",
        feature3Title: "Analyse Exécutive Globale",
        feature3Desc: "Obtenez un résumé textuel synthétique de ce que signifient réellement vos données, prêt pour votre prochaine revue de direction.",
        whoIsThisFor: "Pour qui est-ce ?",
        whoIsThisForDesc: "Directeurs d'Usine, Responsables Amélioration Continue et Directeurs des Opérations qui ont les données mais pas le temps de construire le tableau de bord."
    }
};

const StrapilotLanding = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ first_name?: string } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [lang, setLang] = useState<'en' | 'fr'>(() => {
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
                        <button onClick={() => navigate('/login')} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm">
                            {t.logIn}
                        </button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div 
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
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
                                        className="bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all text-center"
                                    >
                                        {t.logIn}
                                    </button>
                                </div>
                            )}

                            <div className="mt-auto pt-6 border-t border-slate-100">
                                <p className="text-sm font-medium text-slate-500 mb-4 px-2 tracking-wide uppercase">Language / Langue</p>
                                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                                    <button
                                        onClick={() => {
                                            setLang('en');
                                            localStorage.setItem('strap_lang', 'en');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                                            lang === 'en' 
                                                ? 'bg-white text-[#FF6B00] shadow-sm ring-1 ring-black/5' 
                                                : 'text-slate-500 hover:bg-slate-200/50'
                                        }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLang('fr');
                                            localStorage.setItem('strap_lang', 'fr');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                                            lang === 'fr' 
                                                ? 'bg-white text-[#FF6B00] shadow-sm ring-1 ring-black/5' 
                                                : 'text-slate-500 hover:bg-slate-200/50'
                                        }`}
                                    >
                                        Français
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <header className="py-24 px-6 max-w-5xl mx-auto text-center">
                <div className="bg-slate-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <Bot className="text-slate-700" size={40} />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
                    StrAPilot
                </h1>
                <p className="text-xl text-slate-600 font-semibold mb-8 uppercase tracking-widest">
                    {t.tagline}
                </p>
                <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-3xl mx-auto leading-relaxed">
                    {t.description}
                </p>
                {user ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => navigate('/tool/strapilot/app')}
                            className="bg-[#FF6B00] hover:bg-[#e66000] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF6B00]/30 text-lg w-full sm:w-auto"
                        >
                            {t.ctaLoggedIn} <ArrowRight size={20} />
                        </button>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="bg-white hover:bg-slate-50 border-2 border-[#FF6B00] text-[#FF6B00] px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-lg shadow-sm w-full sm:w-auto"
                        >
                            {t.dashboardBtn}
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => navigate('/login?redirect=/tool/strapilot/app')}
                        className="bg-[#FF6B00] hover:bg-[#e66000] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-[#FF6B00]/30 text-lg w-full sm:w-auto"
                    >
                        {t.ctaLoggedOut} <ArrowRight size={20} />
                    </button>
                )}
            </header>

            {/* Features Section */}
            <section className="py-16 px-6 bg-white border-y border-slate-200">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 opacity-80">
                    <div className="text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <Brain className="text-[#FF6B00]" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">{t.feature1Title}</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {t.feature1Desc}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <BarChart3 className="text-[#FF6B00]" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">{t.feature2Title}</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {t.feature2Desc}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <CheckCircle2 className="text-[#FF6B00]" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">{t.feature3Title}</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {t.feature3Desc}
                        </p>
                    </div>
                </div>
            </section>

            {/* Target Audience */}
            <section className="py-20 px-6 max-w-4xl mx-auto text-center">
                <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">{t.whoIsThisFor}</h2>
                    <p className="text-lg text-slate-600 font-medium">
                        {t.whoIsThisForDesc}
                    </p>
                </div>
            </section>

            {/* Footer */}
            <Footer lang={lang as 'en'|'fr'} />
        </div>
    );
};

export default StrapilotLanding;
