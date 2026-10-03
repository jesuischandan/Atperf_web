import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Lightbulb, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import LandingPageNav from './LandingPageNav';
import Footer from './Footer';

/* ─────────────────────────────────────────────────────────────
   Translations
───────────────────────────────────────────────────────────── */
const T = {
    en: {
        // Hero
        heroTitle: 'STRAP',
        heroSubtitle: 'Strict Anticipation Process',
        heroClaim: 'Industrial performance cannot be corrected.',
        heroClaimAccent: 'It must be anticipated.',

        // Problem
        problemTitle: 'The Problem',
        problemIntro: 'Industrial organizations:',
        problemList: [
            'React instead of anticipate',
            'Correct without understanding',
            'Pilot with a time lag',
        ],
        problemResultTitle: 'Result:',
        problemResultList: [
            '10 to 30% of invisible losses',
            'Permanent instability',
        ],

        // Revelation
        revelationTitle: 'The Revelation',
        revelationQuote: 'Every problem was visible before it existed.',
        revelationDesc: 'StrAP is built on a founding principle:',
        revelationPrinciple: 'every malfunction is preceded by weak signals.',

        // Method
        methodTitle: 'The StrAP® Method',
        methodSubtitle: 'A structured, repeatable approach to master operational performance.',
        steps: [
            {
                title: 'Anticipate',
                tagline: 'See before it impacts',
                arrow: 'From reaction → to anticipation',
            },
            {
                title: 'Diagnose',
                tagline: 'Understand root causes',
                arrow: 'From intuition → to mastery',
            },
            {
                title: 'Structure',
                tagline: 'Bring under control',
                arrow: 'From irregularity → to discipline',
            },
            {
                title: 'Pilot',
                tagline: 'Decide in real time',
                arrow: 'From reporting → to action',
            },
            {
                title: 'Anchor',
                tagline: 'Make it last',
                arrow: 'From project → to transformation',
            },
        ],

        // Demo
        demoTitle: 'See StrAP in Action',
        demoSubtitle: 'Discover the power of our platform in this short demonstration.',

        // Offers
        offersTitle: 'StrAP Offers',
        offersSubtitle: 'Choose your entry point',
        offers: [
            {
                name: 'StrAP Scan',
                tag: 'Identify your losses',
                desc: 'A rapid diagnostic to map your invisible performance gaps and quantify what you stand to recover.',
                highlight: false,
            },
            {
                name: 'StrAP Deploy',
                tag: 'Activate the levers',
                desc: 'Operational deployment of the StrAP method—structured, measurable, and anchored in your teams.',
                highlight: true,
            },
            {
                name: 'StrAP Scale',
                tag: 'Deploy at scale',
                desc: 'Roll out StrAP across multiple sites or business units and build a lasting culture of anticipation.',
                highlight: false,
            },
        ],

        // Impact
        impactTitle: 'Measurable Impact',
        impactList: [
            '+20 to +30% performance gains',
            'Rapid results, visible in the field',
            'Accelerated decision-making',
        ],

        // CTA
        ctaTitle: 'Ready to diagnose your performance?',
        ctaDesc: 'In less than 15 minutes, the StrAP diagnosis identifies your top performance leaks.',
        ctaBtn: 'Run the StrAP® diagnostic',
        ctaSecondary: 'Book a call',
    },
    fr: {
        heroTitle: 'STRAP',
        heroSubtitle: 'Strict Anticipation Process',
        heroClaim: 'La performance industrielle ne se corrige pas.',
        heroClaimAccent: `Elle s’anticipe.`,

        problemTitle: 'Le Problème',
        problemIntro: 'Les organisations industrielles :',
        problemList: [
            `Réagissent au lieu d’anticiper`,
            'Corrigent sans comprendre',
            'Pilotent avec retard',
        ],
        problemResultTitle: 'Résultat :',
        problemResultList: [
            '10 à 30% de pertes invisibles',
            'Instabilité permanente',
        ],

        revelationTitle: 'La Révélation',
        revelationQuote: `Chaque problème était visible avant d’exister.`,
        revelationDesc: 'StrAP repose sur un principe fondateur :',
        revelationPrinciple: 'tout dysfonctionnement est précédé de signaux faibles.',

        methodTitle: 'La Méthode StrAP®',
        methodSubtitle: `Une approche structurée et reproductible pour maîtriser la performance opérationnelle.`,
        steps: [
            {
                title: 'Anticiper',
                tagline: `Voir avant que cela n’impacte`,
                arrow: `De réaction → anticipation`,
            },
            {
                title: 'Diagnostiquer',
                tagline: 'Comprendre les causes sources',
                arrow: `D’intuition → maîtrise`,
            },
            {
                title: 'Structurer',
                tagline: 'Mettre sous contrôle',
                arrow: `D’irrégulier → discipline`,
            },
            {
                title: 'Piloter',
                tagline: 'Décider en temps réel',
                arrow: 'Du reporting → action',
            },
            {
                title: 'Ancrer',
                tagline: 'Rendre durable',
                arrow: 'Du projet → transformation',
            },
        ],

        demoTitle: 'Voir StrAP en Action',
        demoSubtitle: 'Découvrez la puissance de notre plateforme dans cette courte démonstration.',

        offersTitle: 'Offres StrAP',
        offersSubtitle: `Choisissez votre point d’entrée`,
        offers: [
            {
                name: 'StrAP Scan',
                tag: 'Identifier vos pertes',
                desc: 'Un diagnostic rapide pour cartographier vos pertes de performance invisibles et quantifier ce que vous pouvez récupérer.',
                highlight: false,
            },
            {
                name: 'StrAP Deploy',
                tag: 'Activer les leviers',
                desc: `Déploiement opérationnel de la méthode StrAP—structuré, mesurable et ancré dans vos équipes.`,
                highlight: true,
            },
            {
                name: 'StrAP Scale',
                tag: 'Déployer à grande échelle',
                desc: `Déployer StrAP sur plusieurs sites ou business units et construire une culture durable d’anticipation.`,
                highlight: false,
            },
        ],

        impactTitle: 'Impact Mesurable',
        impactList: [
            '+20 à +30% de gains de performance',
            'Résultats rapides, visibles sur le terrain',
            'Décisions accélérées',
        ],

        ctaTitle: 'Prêt à diagnostiquer votre performance ?',
        ctaDesc: 'En moins de 15 minutes, le diagnostic StrAP identifie vos principales fuites de performance.',
        ctaBtn: 'Faire le diagnostic StrAP®',
        ctaSecondary: 'Prendre un rendez-vous',
    },
};

/* ─────────────────────────────────────────────────────────────
   FadeIn Component
───────────────────────────────────────────────────────────── */
function FadeIn({
    children,
    delay = 0,
    className = '',
    direction = 'up',
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    direction?: 'up' | 'left';
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const transformStart = direction === 'up' ? 'translate-y-8' : '-translate-x-6';
    const transformEnd = direction === 'up' ? 'translate-y-0' : 'translate-x-0';

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${isVisible ? `opacity-100 ${transformEnd}` : `opacity-0 ${transformStart}`} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   AutoPlayVideo Component
───────────────────────────────────────────────────────────── */
function AutoPlayVideo({ src, poster }: { src: string; poster: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (videoRef.current) {
                    if (entry.isIntersecting) {
                        videoRef.current.volume = 0.1; // Minimum volume
                        videoRef.current.play().catch(err => {
                            console.log('Autoplay was prevented by browser:', err);
                        });
                    } else {
                        videoRef.current.pause();
                    }
                }
            },
            { threshold: 0.5 } // Trigger when 50% of the video is visible
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <video
            ref={videoRef}
            src={src}
            controls
            preload="metadata"
            className="w-full h-full object-cover rounded-3xl z-0"
            poster={poster}
        >
            Your browser does not support HTML5 video.
        </video>
    );
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
export default function DiscoverStrAP() {
    const navigate = useNavigate();
    const [lang, setLang] = useState<'en' | 'fr'>(() =>
        localStorage.getItem('strap_lang') === 'fr' ? 'fr' : 'en'
    );

    const switchLang = (l: 'en' | 'fr') => {
        setLang(l);
        localStorage.setItem('strap_lang', l);
    };

    const handleCtaClick = () => {
        const user = localStorage.getItem('proextract_user');
        if (user) {
            navigate('/?scrollTo=tools');
        } else {
            navigate('/login');
        }
    };

    const t = T[lang];

    return (
        <div
            className="min-h-screen bg-white text-slate-900 font-sans antialiased"
            style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        >
            <LandingPageNav lang={lang} onLangChange={switchLang} />

            {/* ══════════════════════════════════════════════════════════
                HERO
            ══════════════════════════════════════════════════════════ */}
            <section className="relative min-h-[80vh] flex items-center pt-16 overflow-hidden bg-slate-900">
                {/* Video background */}
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0 scale-111"
                    src="/media/videos/StrAP_hero_bg.mp4"
                />
                {/* Dark overlay so text stays readable */}
                <div className="absolute inset-0 bg-slate-900/70 z-10" />

                <div className="relative z-20 max-w-5xl mx-auto px-6 lg:px-10 py-20 lg:py-32">

                    <FadeIn delay={150}>
                        <div className="mb-4">
                            <span className="text-6xl sm:text-8xl lg:text-[9rem] font-black tracking-tight text-white leading-none">
                                {t.heroTitle}
                            </span>
                        </div>
                        <p className="text-[#FF6B00] font-bold text-xl sm:text-2xl tracking-widest uppercase mb-10">
                            — {t.heroSubtitle}
                        </p>
                    </FadeIn>

                    <FadeIn delay={300}>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-300 leading-snug max-w-3xl">
                            {t.heroClaim}
                            <br />
                            <span className="font-extrabold text-white">{t.heroClaimAccent}</span>
                        </p>
                    </FadeIn>

                    <FadeIn delay={450} className="mt-12">
                        <button
                            onClick={handleCtaClick}
                            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#FF6B00]/30 transition-all hover:-translate-y-0.5"
                        >
                            {t.ctaBtn} <ArrowRight size={18} />
                        </button>
                    </FadeIn>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                PROBLEM
            ══════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <FadeIn delay={100}>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                            {t.problemTitle}
                        </h2>
                        <p className="text-slate-500 text-lg mb-6">{t.problemIntro}</p>
                        <ul className="space-y-4">
                            {t.problemList.map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-1 shrink-0 w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </span>
                                    <span className="text-slate-700 text-lg font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </FadeIn>

                    <FadeIn delay={250} direction="left">
                        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 sm:p-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                    <AlertTriangle size={20} />
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900">{t.problemResultTitle}</h3>
                            </div>
                            <ul className="space-y-5">
                                {t.problemResultList.map((item, i) => (
                                    <li key={i} className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
                                        <span className="text-slate-800 font-bold text-xl sm:text-2xl">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                REVELATION
            ══════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <FadeIn delay={100}>
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                <Lightbulb size={32} />
                            </div>
                        </div>
                        <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-8">
                            "{t.revelationQuote}"
                        </blockquote>
                        <p className="text-slate-500 text-xl mb-4">{t.revelationDesc}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-[#FF6B00]">{t.revelationPrinciple}</p>
                    </FadeIn>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                METHOD STEPS
            ══════════════════════════════════════════════════════════ */}
            <section className="py-28 px-6 bg-slate-900 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #FF6B00 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
                <div className="relative z-10 max-w-5xl mx-auto">
                    <FadeIn delay={100} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">{t.methodTitle}</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">{t.methodSubtitle}</p>
                    </FadeIn>

                    <div className="relative">
                        {/* Vertical connecting line */}
                        <div className="absolute left-8 sm:left-10 top-8 bottom-8 w-px bg-[#FF6B00]/20 hidden sm:block" />

                        <div className="flex flex-col gap-4">
                            {t.steps.map((step, i) => (
                                <FadeIn key={i} delay={100 + i * 100} direction="left">
                                    <div className="flex gap-5 sm:gap-8 p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FF6B00]/40 transition-all duration-300 group cursor-default">
                                        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] font-black text-lg sm:text-2xl group-hover:bg-[#FF6B00] group-hover:text-white group-hover:border-[#FF6B00] transition-all duration-300">
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-extrabold text-white text-xl sm:text-2xl mb-1 group-hover:text-[#FF6B00] transition-colors">{step.title}</h3>
                                            <p className="text-slate-400 text-base mb-3">{step.tagline}</p>
                                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00]/70 group-hover:text-[#FF6B00] transition-colors">
                                                <ChevronRight size={14} /> {step.arrow}
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                DEMO VIDEO
            ══════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
                <div className="max-w-5xl mx-auto">
                    <FadeIn delay={100} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                            {t.demoTitle || 'See StrAP in Action'}
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            {t.demoSubtitle || 'Discover the power of our platform in this short demonstration.'}
                        </p>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 bg-slate-900 aspect-video flex items-center justify-center">
                            {/* Inner glow/shadow for premium feel */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none z-10" />
                            <AutoPlayVideo src="/media/videos/StrAP_Demo.mp4" poster="/Logo_Atperf_transpart.png" />
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                OFFERS
            ══════════════════════════════════════════════════════════ */}
            <section className="py-28 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <FadeIn delay={100} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{t.offersTitle}</h2>
                        <p className="text-slate-500 text-lg max-w-xl mx-auto">{t.offersSubtitle}</p>
                    </FadeIn>

                    <div className="grid md:grid-cols-3 gap-6">
                        {t.offers.map((offer, i) => (
                            <FadeIn key={i} delay={150 + i * 120}>
                                <div className={`h-full rounded-3xl p-8 flex flex-col border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${offer.highlight ? 'bg-slate-900 border-slate-700 text-white shadow-xl shadow-slate-900/20' : 'bg-white border-slate-100 hover:border-orange-200 hover:bg-[#FFF8F4]'}`}>
                                    {offer.highlight && (
                                        <div className="inline-flex self-start items-center gap-1.5 bg-[#FF6B00] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6">
                                            <Zap size={11} /> Popular
                                        </div>
                                    )}
                                    <span className={`text-xs font-bold uppercase tracking-widest mb-3 ${offer.highlight ? 'text-[#FF6B00]' : 'text-slate-400'}`}>
                                        {offer.tag}
                                    </span>
                                    <h3 className={`text-2xl font-extrabold mb-4 ${offer.highlight ? 'text-white' : 'text-slate-900'}`}>{offer.name}</h3>
                                    <p className={`text-sm leading-relaxed flex-1 ${offer.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{offer.desc}</p>
                                    <button
                                        onClick={() => navigate('/contact')}
                                        className={`mt-8 w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${offer.highlight ? 'bg-[#FF6B00] text-white hover:bg-[#E66000]' : 'bg-slate-100 text-slate-700 hover:bg-[#FF6B00] hover:text-white'}`}
                                    >
                                        {lang === 'fr' ? 'En savoir plus' : 'Learn more'} <ArrowRight size={15} />
                                    </button>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                IMPACT
            ══════════════════════════════════════════════════════════ */}
            <section className="py-20 px-6 bg-[#FFF8F4] border-y border-orange-100">
                <div className="max-w-4xl mx-auto text-center">
                    <FadeIn delay={100}>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-12 tracking-tight">{t.impactTitle}</h2>
                        <div className="grid sm:grid-cols-3 gap-6">
                            {t.impactList.map((item, i) => (
                                <FadeIn key={i} delay={100 + i * 120}>
                                    <div className="bg-white rounded-2xl p-8 border border-orange-100 shadow-sm flex flex-col items-center gap-4 hover:shadow-md hover:border-orange-200 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
                                            <TrendingUp size={24} />
                                        </div>
                                        <p className="text-slate-800 font-bold text-lg text-center">{item}</p>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                FINAL CTA
            ══════════════════════════════════════════════════════════ */}
            <section className="relative py-28 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #FF6B00 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
                <FadeIn delay={100} className="relative max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 tracking-tight">{t.ctaTitle}</h2>
                    <p className="text-slate-400 text-lg mb-10 leading-relaxed">{t.ctaDesc}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={handleCtaClick}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#FF6B00]/30 transition-all hover:-translate-y-0.5"
                        >
                            {t.ctaBtn} <ArrowRight size={17} />
                        </button>
                        <button
                            onClick={() => navigate('/contact')}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-transparent border border-slate-600 text-slate-300 font-semibold px-8 py-4 rounded-xl hover:bg-white/5 hover:border-slate-500 transition-all"
                        >
                            {t.ctaSecondary}
                        </button>
                    </div>
                </FadeIn>
            </section>

            <Footer lang={lang} />
        </div>
    );
}
