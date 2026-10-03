import LandingPageNav from "./LandingPageNav";
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, Brain, ArrowRight, Navigation, TrendingUp, Users, Award, ChevronRight } from 'lucide-react';
import Footer from './Footer';

/* ─────────────────────────────────────────────────────────────
   Translations
───────────────────────────────────────────────────────────── */
const T = {
    en: {
        tagline: 'Atperf Conseil',
        heroBold: 'Activate the Performance',
        heroLight: 'you’re already losing',
        heroDesc: 'Most manufacturers lose between 15% and 30% of their performance without even realizing it. ATPERF identifies, unlocks, and secures these gains in less than 90 days.',
        accessBtn: 'Try the StrAP® diagnosis',
        discoverBtn: 'Discover the method',
        stat1: '$10M+',
        stat1Label: 'avg. yearly savings per programme',
        stat2: '98%',
        stat2Label: 'client re-engagement rate',
        stat3: '18 wks',
        stat3Label: 'average time-to-first-result',
        trustedBy: 'Trusted by industry leaders worldwide',
        businessStressTitle: 'BUSINESS STRESS',
        businessStressSubtitle1: 'The real problem isn’t performance',
        businessStressSubtitle2: 'It’s a problem of anticipation',
        businessStressToday: 'Today, organizations:',
        businessStressList: [
            'detect problems too late',
            'make decisions after the fact',
            'suffer invisible losses',
            'repeat the same incidents',
            'operate in misaligned silos'
        ],
        businessStressConclusion: 'What you don’t have under control today is exactly what’s undermining your performance.',
        serviceTitle: 'The StrAP Tool Suite',
        serviceSubtitle: 'Precision instruments built on the StrAP\u00ae methodology—turning operational friction into competitive edge.',
        targetUser: 'Built for',
        learnMore: 'Get Started',
        StrapDiagTitle: 'StrAP Perf Diagnostic™',
        StrapDiagTag: 'Performance Decoder',
        StrapDiagDesc: 'A fast, AI-powered diagnostic that evaluates your organization across 5 critical performance dimensions—pilotage, anticipation, loss management, operational discipline, and reactivity.',
        StrapDiagUser: 'Plant Managers · Ops Leads',
        radarTitle: 'Decision Radar',
        radarTag: 'Priority Filter',
        radarDesc: 'Input conflicting projects and the Radar ranks them based on ROI, effort, and strategic alignment—no more endless debates.',
        radarUser: 'Executives · COOs',
        anchorTitle: 'StrAPilot Dashboard',
        anchorTag: 'AI Data Strategy',
        anchorDesc: 'Upload raw datasets and let our AI engine generate strategic KPIs, analyze trends, and identify hidden focal points automatically.',
        anchorUser: 'Data Leads · Analysts',
        methodTitleTag: 'The StrAP® Method',
        methodTitle: 'Underperformance is not an operational problem',
        methodAccent: 'It is a problem of anticipation',
        methodDesc: 'Every deviation, incident, or loss could be anticipated before it impacted your operations.',
        methodDesignTitle: 'A structured methodology designed to:',
        methodDesignList: [
            'Anticipate deviations',
            'Manage operations in real time',
            'Secure lasting performance'
        ],
        strTitlePart1: 'Str — ',
        strWord1: 'Strict',
        strWord2: 'Strategic',
        strDesc: 'A disciplined approach that ensures any deviation is detected and addressed before it impacts operations.',
        aTitle: 'A — Anticipation',
        aDesc: 'Identify early warning signs to prevent disruptions and losses before they affect your business.',
        pTitle: 'P — Process',
        pDesc: 'Apply a structured and repeatable methodology to manage operations in real time and ensure sustainable performance.',
        quoteBody: '"Consulting reports often sit in drawers—because they lack the tools to sustain change."',
        quoteAuthor: '— ATPERF Conseil',
        ctaTitle: 'Ready to turn insight into action?',
        ctaDesc: 'Join industry leaders already using StrAP Tools to close the gap between the boardroom and the shop floor.',
        ctaBtn: 'Start for Free',
        ctaSecondary: 'Book a demo',
        navHome: 'Home',
        navService: 'Service',
        navUseCases: 'Use Cases',
        navContact: 'Contact',
        navDashboard: 'StrAP Tools',
        hi: 'Hi',
        logOut: 'Log out',
        logIn: 'Log in',
        signUp: 'Sign up',
        admin: 'Admin',
        staffPortal: 'Staff Portal',
        copyright: `\u00a9 ${new Date().getFullYear()} Atperf Conseil\u00a0·\u00a0All rights reserved`,
    },
    fr: {
        tagline: 'Atperf Conseil',
        heroBold: 'Activez la Performance',
        heroLight: 'que vous perdez déjà',
        heroDesc: 'La plupart des industriels perdent entre 15% et 30% de performance sans le voir. ATPERF identifie, active et sécurise ces gains en moins de 90 jours.',
        accessBtn: 'Faire le diagnostic StrAP®',
        discoverBtn: 'Découvrir la méthode',
        stat1: '10M\u00a0€+',
        stat1Label: '\u00e9conomies annuelles moyennes',
        stat2: '98\u00a0%',
        stat2Label: 'taux de fid\u00e9lisation client',
        stat3: '18\u00a0sem.',
        stat3Label: 'jusqu\u2019au premier r\u00e9sultat',
        trustedBy: 'Choisi par les leaders industriels du monde entier',
        businessStressTitle: 'TENSION BUSINESS',
        businessStressSubtitle1: 'Le vrai problème n’est pas la performance.',
        businessStressSubtitle2: 'C’est l’absence d’anticipation.',
        businessStressToday: 'Aujourd’hui, les organisations :',
        businessStressList: [
            'détectent les problèmes trop tard',
            'prennent des décisions après impact',
            'subissent des pertes invisibles',
            'répètent les mêmes incidents',
            'fonctionnent en silos désalignés'
        ],
        businessStressConclusion: 'Ce que vous ne maîtrisez pas aujourd’hui est exactement ce qui dégrade votre performance.',
        serviceTitle: 'La Suite StrAP Tools',
        serviceSubtitle: 'Des instruments pr\u00e9cis con\u00e7us sur la m\u00e9thodologie StrAP\u00ae—transformant les frictions op\u00e9rationnelles en avantage concurrentiel.',
        mostPopular: 'Le plus populaire',
        targetUser: 'Con\u00e7u pour',
        learnMore: 'Commencer',
        StrapDiagTitle: 'StrAP Perf Diagnostic\u2122',
        StrapDiagTag: 'D\u00e9codeur de performance',
        StrapDiagDesc: 'Un diagnostic rapide, aliment\u00e9 par l\'IA, qui \u00e9value votre organisation selon 5 dimensions critiques de performance\u2014pilotage, anticipation, gestion des pertes, discipline op\u00e9rationnelle et r\u00e9activit\u00e9.',
        StrapDiagUser: 'Responsables de site · Ops',
        radarTitle: 'Decision Radar',
        radarTag: 'Filtre de priorit\u00e9',
        radarDesc: 'Entrez vos projets conflictuels et le Radar les classe selon le ROI, l\u2019effort et l\u2019alignement strat\u00e9gique\u2014fini les d\u00e9bats sans fin.',
        radarUser: 'Dirigeants · COO',
        anchorTitle: 'StrAPilot Dashboard',
        anchorTag: 'Stratégie de Données IA',
        anchorDesc: 'Téléchargez vos jeux de données bruts et laissez notre IA générer des KPIs stratégiques, analyser les tendances et identifier les angles morts automatiquement.',
        anchorUser: 'Data Leads · Analystes',
        methodTitleTag: 'La méthode StrAP®',
        methodTitle: 'La non-performance n’est pas un problème opérationnel.',
        methodAccent: 'C’est un problème d’anticipation.',
        methodDesc: 'Chaque déviation, incident ou perte pouvait être anticipé avant d’impacter vos opérations.',
        methodDesignTitle: 'Une méthodologie structurée conçue pour :',
        methodDesignList: [
            'Anticiper les déviations',
            'Gérer les opérations en temps réel',
            'Sécuriser la performance durable'
        ],
        strTitlePart1: 'Str — ',
        strWord1: 'Strict',
        strWord2: 'Strat\u00e9gique',
        strDesc: 'Une approche disciplinée qui garantit que toute déviation est détectée et traitée avant d’impacter les opérations.',
        aTitle: 'A — Anticipation',
        aDesc: 'Identifier tôt les signaux faibles pour prévenir les perturbations et les pertes avant qu’elles n’affectent votre activité.',
        pTitle: 'P — Processus',
        pDesc: 'Appliquer une méthodologie structurée et répétable pour gérer les opérations en temps réel et assurer une performance durable.',
        quoteBody: '\u00ab\u00a0Les rapports de conseil restent souvent dans les tiroirs\u2014faute d\u2019outils pour ancrer le changement.\u00a0\u00bb',
        quoteAuthor: '— ATPERF Conseil',
        ctaTitle: 'Pr\u00eat \u00e0 transformer l\u2019analyse en action\u00a0?',
        ctaDesc: 'Rejoignez les leaders industriels qui utilisent d\u00e9j\u00e0 StrAP Tools pour combler le foss\u00e9 entre le COMEX et l\u2019atelier.',
        ctaBtn: 'Commencer gratuitement',
        ctaSecondary: 'Demander une d\u00e9mo',
        navHome: 'Accueil',
        navService: 'Services',
        navUseCases: 'Cas d\u2019usage',
        navContact: 'Contact',
        navDashboard: 'StrAP Tools',
        hi: 'Bonjour',
        logOut: 'D\u00e9connexion',
        logIn: 'Connexion',
        signUp: 'S\u2019inscrire',
        admin: 'Admin',
        staffPortal: 'Portail Interne',
        copyright: `\u00a9 ${new Date().getFullYear()} Atperf Conseil\u00a0·\u00a0Tous droits r\u00e9serv\u00e9s`,
    },
};

/* ─────────────────────────────────────────────────────────────
   Animated gradient panel (replaces static orange bands)
───────────────────────────────────────────────────────────── */
function OrangeGraphic() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let id: number;
        let t = 0;
        const tick = () => {
            t += 0.018;
            if (ref.current) {
                const els = ref.current.querySelectorAll<HTMLElement>('.grad-band');
                els.forEach((el, i) => {
                    const wave = Math.sin(t + i * 0.9) * 22;
                    const scale = 1 + Math.cos(t * 0.7 + i * 0.5) * 0.025;
                    el.style.transform = `skewX(-8deg) translateY(${wave}px) scaleX(${scale})`;
                });
            }
            id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, []);

    const bands = [
        'from-[#FFF3EC] to-[#FFD8B8]',
        'from-[#FFE5CE] to-[#FFC08A]',
        'from-[#FFCFAA] to-[#FF9F50]',
        'from-[#FFB870] to-[#FF7820]',
        'from-[#FF9644] to-[#FF6B00]',
    ];

    return (
        <div ref={ref} className="absolute inset-0 flex items-stretch overflow-hidden">
            {bands.map((cls, i) => (
                <div
                    key={i}
                    className={`grad-band flex-1 bg-gradient-to-b ${cls} will-change-transform`}
                    style={{
                        transition: 'none',
                        marginLeft: i === 0 ? '-10%' : '-2%',
                        marginRight: i === bands.length - 1 ? '-10%' : '0',
                        boxShadow: 'inset -2px 0 12px rgba(0,0,0,0.04)',
                    }}
                />
            ))}
            {/* dot grid overlay */}
            <div
                className="absolute inset-0 opacity-15 mix-blend-soft-light"
                style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)',
                    backgroundSize: '22px 22px',
                }}
            />
            {/* fade to white on left edge */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent hidden lg:block" />
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   FadeIn Scroll Animation Component
───────────────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className = "", direction = "up" }: { children: React.ReactNode, delay?: number, className?: string, direction?: "up" | "left" }) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const transformStart = direction === "up" ? "translate-y-8" : "-translate-x-8";
    const transformEnd = direction === "up" ? "translate-y-0" : "translate-x-0";

    return (
        <div ref={ref} className={`transition-all duration-1000 ease-out ${isVisible ? `opacity-100 ${transformEnd}` : `opacity-0 ${transformStart}`} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Typewriter Animation Component
───────────────────────────────────────────────────────────── */
function TypewriterWord({ word1, word2 }: { word1: string, word2: string }) {
    const [text, setText] = useState(word1);
    const [isDeleting, setIsDeleting] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);

    // Reset when words change (e.g., lang switch)
    useEffect(() => {
        setText(word1);
        setIsDeleting(false);
        setWordIndex(0);
    }, [word1, word2]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const words = [word1, word2];
        const currentWord = words[wordIndex];

        if (isDeleting) {
            timer = setTimeout(() => {
                setText((prev) => prev.slice(0, prev.length - 1));
                if (text.length <= 1) {
                    setIsDeleting(false);
                    setWordIndex((prev) => (prev === 0 ? 1 : 0));
                }
            }, 60);
        } else {
            if (text.length < currentWord.length) {
                timer = setTimeout(() => {
                    setText(currentWord.slice(0, text.length + 1));
                }, 80);
            } else {
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, 3000);
            }
        }

        return () => clearTimeout(timer);
    }, [text, isDeleting, wordIndex, word1, word2]);

    return (
        <span className="inline-flex items-center">
            {text}
            <span className="w-[2px] h-[1em] bg-slate-900 ml-[2px] animate-pulse"></span>
        </span>
    );
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [lang, setLang] = useState<'en' | 'fr'>(() =>
        (localStorage.getItem('strap_lang') === 'fr' ? 'fr' : 'en'),
    );
    const [_user, _setUser] = useState<{
        user_id?: string; first_name?: string; last_name?: string;
        email?: string; role?: string; status?: string; company_id?: string;
    } | null>(null);
    const [_staffUser, _setStaffUser] = useState<{ first_name?: string } | null>(null);
    const [_isProfileOpen, _setIsProfileOpen] = useState(false);
    const [_isMobileMenuOpen, _setIsMobileMenuOpen] = useState(false);
    const [_scrolled, _setScrolled] = useState(false);

    const switchLang = (l: 'en' | 'fr') => {
        setLang(l);
        localStorage.setItem('strap_lang', l);
        const fav = document.getElementById('favicon') as HTMLLinkElement | null;
        if (fav) fav.href = l === 'fr' ? '/favicon.png' : '/favicon.png';
    };

    useEffect(() => {
        try {
            const u = localStorage.getItem('proextract_user');
            if (u) _setUser(JSON.parse(u));
            const s = localStorage.getItem('proextract_staff');
            if (s) _setStaffUser(JSON.parse(s));
        } catch { /* ignore */ }

        const onScroll = () => _setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('scrollTo') === 'tools') {
            setTimeout(() => {
                document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }, [location]);

    const t = T[lang];



    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

            <LandingPageNav lang={lang} onLangChange={switchLang} />

            {/* ══════════════════════════════════════════════════════════
                HERO
            ══════════════════════════════════════════════════════════ */}
            <section className="relative min-h-screen bg-white flex items-center pt-16 overflow-hidden">
                {/* Orange animated graphic — right side */}
                <div className="absolute right-0 top-0 bottom-0 w-[48%] hidden lg:block">
                    <OrangeGraphic />
                </div>

                {/* Left content */}
                <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-10 py-12 lg:py-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <FadeIn delay={100} className="w-full min-w-0">
                        {/* Eyebrow */}
                        <div className="inline-flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                            <span className="w-6 h-px bg-[#FF6B00]" />
                            {t.tagline}
                        </div>

                        {/* Headline */}
                        <h1 className="font-extrabold text-slate-900 text-3xl sm:text-5xl xl:text-[3.75rem] leading-[1.2] sm:leading-[1.1] tracking-tight mb-6">
                            {t.heroBold}{' '}
                            <span className="block font-light text-slate-700 mt-1 break-words whitespace-pre-wrap">{t.heroLight}</span>
                        </h1>

                        {/* Description */}
                        <p className="text-slate-500 text-base xl:text-lg leading-relaxed max-w-lg mb-10">
                            {t.heroDesc}
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-10 sm:mb-14">
                            <button
                                onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-[#FF6B00]/25 transition-all hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {t.accessBtn} <ArrowRight size={17} />
                            </button>
                            <button
                                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-slate-600 font-semibold px-7 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                                onClick={() => navigate('/discover')}
                            >
                                {t.discoverBtn} <ChevronRight size={16} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Client logos */}
                        <div className="w-full relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] mt-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-6 pl-4">{t.trustedBy}</p>

                            <div className="flex w-max animate-marquee-ltr opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-500">
                                {[
                                    ['/media/logos/Logo_Alstom_color.png', 'Alstom'],
                                    ['/media/logos/Logo_aperam_color.png', 'Aperam'],
                                    ['/media/logos/Logo_Kandil_Steel_color.png', 'Kandil Steel'],
                                    ['/media/logos/Logo_Florette_color.png', 'Florette'],
                                    ['/media/logos/Logo_Lee_Cooper_color.png', 'Lee Cooper'],
                                    ['/media/logos/Logo_Oxford_color.png', 'Oxford'],
                                    ['/media/logos/Logo_Alstom_color.png', 'Alstom'],
                                    ['/media/logos/Logo_aperam_color.png', 'Aperam'],
                                    ['/media/logos/Logo_Kandil_Steel_color.png', 'Kandil Steel'],
                                    ['/media/logos/Logo_Florette_color.png', 'Florette'],
                                    ['/media/logos/Logo_Lee_Cooper_color.png', 'Lee Cooper'],
                                    ['/media/logos/Logo_Oxford_color.png', 'Oxford'],
                                ].map(([src, alt], i) => (
                                    <div key={`${alt}-${i}`} className="w-[33.33vw] sm:w-[160px] shrink-0 flex justify-center items-center px-4">
                                        <img src={src} alt={alt} className="h-7 w-auto object-contain" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    {/* Right: mobile orange block */}
                    <div className="lg:hidden w-full h-48 rounded-2xl overflow-hidden relative">
                        <OrangeGraphic />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                STATS BAR
            ══════════════════════════════════════════════════════════ */}
            <div className="bg-slate-900 text-white py-12 px-6">
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 text-center">
                    {[
                        { value: t.stat1, label: t.stat1Label, icon: <TrendingUp size={20} className="text-[#FF6B00]" /> },
                        { value: t.stat2, label: t.stat2Label, icon: <Users size={20} className="text-[#FF6B00]" /> },
                        { value: t.stat3, label: t.stat3Label, icon: <Award size={20} className="text-[#FF6B00]" /> },
                    ].map(({ value, label, icon }, i) => (
                        <FadeIn key={label} delay={i * 150} className="flex flex-col items-center gap-2">
                            {icon}
                            <div className="text-4xl font-black tracking-tight">{value}</div>
                            <div className="text-sm text-slate-400 max-w-[180px]">{label}</div>
                        </FadeIn>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                BUSINESS STRESS
            ══════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
                <div className="max-w-5xl mx-auto">
                    <FadeIn delay={100} className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                            <span className="w-5 h-px bg-[#FF6B00]" /> {t.businessStressTitle} <span className="w-5 h-px bg-[#FF6B00]" />
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                            {t.businessStressSubtitle1}<br />
                            <span className="text-slate-500 font-light">{t.businessStressSubtitle2}</span>
                        </h2>
                    </FadeIn>

                    <FadeIn delay={200} className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 text-slate-50 opacity-50 rotate-12">
                            <TrendingUp size={240} strokeWidth={1} />
                        </div>

                        <p className="text-lg font-semibold text-slate-800 mb-6 relative z-10">{t.businessStressToday}</p>
                        <ul className="space-y-4 mb-10 relative z-10 w-full overflow-hidden">
                            {t.businessStressList.map((item, i) => (
                                <FadeIn key={i} delay={300 + i * 150} direction="left">
                                    <li className="flex items-start gap-4">
                                        <span className="mt-1 shrink-0 w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </span>
                                        <span className="text-slate-600 text-lg">{item}</span>
                                    </li>
                                </FadeIn>
                            ))}
                        </ul>
                        <div className="pt-8 border-t border-slate-100 relative z-10">
                            <p className="text-xl font-bold text-slate-900 leading-relaxed border-l-4 border-[#FF6B00] pl-6 py-2">
                                {t.businessStressConclusion}
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                METHOD
            ══════════════════════════════════════════════════════════ */}
            <section id="method" className="py-32 px-6 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-br from-slate-50 to-white -z-10 [clip-path:polygon(0_0,100%_0,100%_80%,0_100%)]" />

                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    <FadeIn delay={100} className="lg:sticky lg:top-32 pr-0 lg:pr-8">
                        <div className="inline-flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                            <span className="w-6 h-px bg-[#FF6B00]" /> {t.methodTitleTag}
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-medium text-slate-900 mb-6 leading-[1.15] tracking-tight">
                            {t.methodTitle}<br />
                            <span className="text-[#FF6B00] text-4xl">{t.methodAccent}</span>
                        </h2>
                        <p className="text-slate-500 leading-relaxed text-lg sm:text-xl mb-10">{t.methodDesc}</p>

                        <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl shadow-sm mb-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                                {t.methodDesignTitle}
                            </h3>
                            <ul className="space-y-5">
                                {t.methodDesignList.map((item, i) => (
                                    <li key={i} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <span className="text-slate-700 font-medium text-lg">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#FF6B00]/25 transition-all hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5 active:translate-y-0"
                            onClick={() => navigate('/discover')}
                        >
                            {t.learnMore} <ArrowRight size={17} />
                        </button>
                    </FadeIn>

                    <div className="flex flex-col gap-6 relative">
                        {/* Connecting line */}
                        <div className="absolute left-[39px] sm:left-[47px] top-12 bottom-12 w-px bg-slate-200 -z-10 hidden sm:block" />

                        {[
                            {
                                key: 'Str',
                                title: <>{t.strTitlePart1}<TypewriterWord word1={t.strWord1} word2={t.strWord2} /></>,
                                desc: t.strDesc
                            },
                            { key: 'A', title: t.aTitle, desc: t.aDesc },
                            { key: 'P', title: t.pTitle, desc: t.pDesc },
                        ].map(({ key, title, desc }, i) => (
                            <FadeIn key={i} delay={i * 150} direction="left" className="group">
                                <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#FF6B00]/5 hover:border-orange-200 transition-all duration-300">
                                    <div className="shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#FF6B00] font-black text-2xl sm:text-3xl group-hover:bg-[#FF6B00] group-hover:text-white group-hover:border-[#FF6B00] group-hover:-rotate-3 transition-all duration-300 shadow-sm">
                                        {key}
                                    </div>
                                    <div className="flex-1 mt-1 sm:mt-2">
                                        <h4 className="font-extrabold text-slate-900 text-xl sm:text-2xl mb-3 group-hover:text-[#FF6B00] transition-colors">{title}</h4>
                                        <p className="text-slate-500 text-base leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                TOOL SUITE
            ══════════════════════════════════════════════════════════ */}
            <section id="tools" className="py-28 px-6 bg-green-50">
                <div className="max-w-6xl mx-auto">
                    <FadeIn delay={100} className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                            <span className="w-5 h-px bg-[#FF6B00]" /> {t.serviceTitle} <span className="w-5 h-px bg-[#FF6B00]" />
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{t.serviceTitle}</h2>
                        <p className="text-slate-500 max-w-xl mx-auto text-base sm:text-lg">{t.serviceSubtitle}</p>
                    </FadeIn>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* StrAP Perf Diagnostic™ */}
                        <FadeIn delay={200} className="h-full">
                            <div onClick={() => navigate('/tool/strap-diagnosis')} className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col group hover:shadow-md hover:border-orange-200 hover:bg-[#FFF8F4] transition-all cursor-pointer">
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="bg-slate-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#FF6B00]/10 transition-colors">
                                        <Brain className="text-slate-500 group-hover:text-[#FF6B00] transition-colors" size={22} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">{t.StrapDiagTag}</p>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-3">{t.StrapDiagTitle}</h3>
                                    <p className="text-slate-500 leading-relaxed flex-1">{t.StrapDiagDesc}</p>
                                    <div className="mt-6 pt-5 border-t border-slate-100">
                                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">{t.targetUser}</span>
                                        <span className="text-sm text-slate-700 font-medium">{t.StrapDiagUser}</span>
                                    </div>
                                </div>
                                <div className="px-8 pb-8">
                                    <span className="w-full bg-slate-100 group-hover:bg-[#FF6B00] text-slate-700 group-hover:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                                        {t.learnMore} <ArrowRight size={17} />
                                    </span>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Decision Radar */}
                        <FadeIn delay={300} className="h-full">
                            <div onClick={() => navigate('/tool/decision-radar')} className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col group hover:shadow-md hover:border-orange-200 hover:bg-[#FFF8F4] transition-all cursor-pointer">
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="bg-slate-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#FF6B00]/10 transition-colors">
                                        <Navigation className="text-slate-500 group-hover:text-[#FF6B00] transition-colors" size={22} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">{t.radarTag}</p>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-3">{t.radarTitle}</h3>
                                    <p className="text-slate-500 leading-relaxed flex-1">{t.radarDesc}</p>
                                    <div className="mt-6 pt-5 border-t border-slate-100">
                                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">{t.targetUser}</span>
                                        <span className="text-sm text-slate-700 font-medium">{t.radarUser}</span>
                                    </div>
                                </div>
                                <div className="px-8 pb-8">
                                    <span className="w-full bg-slate-100 group-hover:bg-[#FF6B00] text-slate-700 group-hover:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                                        {t.learnMore} <ArrowRight size={17} />
                                    </span>
                                </div>
                            </div>
                        </FadeIn>

                        {/* StrAPilot */}
                        <FadeIn delay={400} className="h-full">
                            <div onClick={() => navigate('/tool/strapilot')} className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col group hover:shadow-md hover:border-orange-200 hover:bg-[#FFF8F4] transition-all cursor-pointer">
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="bg-slate-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#FF6B00]/10 transition-colors">
                                        <Bot className="text-slate-500 group-hover:text-[#FF6B00] transition-colors" size={22} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">{t.anchorTag}</p>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-3">{t.anchorTitle}</h3>
                                    <p className="text-slate-500 leading-relaxed flex-1">{t.anchorDesc}</p>
                                    <div className="mt-6 pt-5 border-t border-slate-100">
                                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">{t.targetUser}</span>
                                        <span className="text-sm text-slate-700 font-medium">{t.anchorUser}</span>
                                    </div>
                                </div>
                                <div className="px-8 pb-8">
                                    <span className="w-full bg-slate-100 group-hover:bg-[#FF6B00] text-slate-700 group-hover:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                                        {t.learnMore} <ArrowRight size={17} />
                                    </span>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                QUOTE
            ══════════════════════════════════════════════════════════ */}
            <div className="bg-[#FFF8F4] py-20 px-6 border-y border-orange-100">
                <FadeIn delay={100} className="max-w-3xl mx-auto text-center">
                    <p className="text-2xl md:text-3xl font-light text-slate-800 leading-relaxed italic mb-6">{t.quoteBody}</p>
                    <span className="text-sm font-semibold text-[#FF6B00] tracking-wider uppercase">{t.quoteAuthor}</span>
                </FadeIn>
            </div>

            {/* ══════════════════════════════════════════════════════════
                FINAL CTA BAND
            ══════════════════════════════════════════════════════════ */}
            <section className="relative py-24 px-6 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #FF6B00 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <FadeIn delay={100} className="relative max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">{t.ctaTitle}</h2>
                    <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed">{t.ctaDesc}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#FF6B00]/30 transition-all hover:-translate-y-0.5">
                            {t.ctaBtn} <ArrowRight size={17} />
                        </button>
                        <button onClick={() => navigate('/contact')}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-transparent border border-slate-600 text-slate-300 font-semibold px-8 py-4 rounded-xl hover:bg-white/5 hover:border-slate-500 transition-all">
                            {t.ctaSecondary}
                        </button>
                    </div>
                </FadeIn>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────── */}
            <Footer lang={lang} />
        </div>
    );
};

export default LandingPage;