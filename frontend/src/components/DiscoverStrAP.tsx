import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Lightbulb, TrendingUp, Zap, ChevronRight, Search, Settings2, MonitorSmartphone, Factory, CheckCircle2, ArrowDown, RefreshCw } from 'lucide-react';
import LandingPageNav from './LandingPageNav';
import Footer from './Footer';
import StrapMaintenanceSection from './maintenance/StrapMaintenanceSection';

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
            'Invisible losses, often significant',
            'Permanent instability',
        ],

        // Revelation
        revelationTitle: 'The Revelation',
        revelationQuote: 'Many industrial deviations leave clues before they produce their consequences.',
        revelationDesc: 'STRAP is built on a founding principle:',
        revelationPrinciple: 'most deviations are preceded by observable signals — provided you know how to characterise them.',

        // Method
        methodTitle: 'The STRAP® Method',
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
        demoTitle: 'See STRAP in Action',
        demoSubtitle: 'Discover the power of our platform in this short demonstration.',

        // Offers
        offersTitle: 'STRAP Offers',
        offersSubtitle: 'Choose your entry point',
        offers: [
            {
                name: 'STRAP Scan',
                tag: 'Identify your losses',
                desc: 'Diagnosis of losses and risks: we map your key processes, the situations that generate losses and the data available to characterise them.',
                highlight: false,
            },
            {
                name: 'STRAP Deploy',
                tag: 'Activate the levers',
                desc: 'Business rules, workflows, indicators and decision routines built and deployed with your teams.',
                highlight: true,
            },
            {
                name: 'STRAP Scale',
                tag: 'Deploy at scale',
                desc: 'Extension to several processes, workshops or sites, to build a lasting culture of anticipation.',
                highlight: false,
            },
        ],

        // Impact
        impactTitle: 'Measurable Impact',
        impactList: [
            'Gains measured on your own indicators',
            'Rapid results, visible in the field',
            'Accelerated decision-making',
        ],

        // CTA
        ctaTitle: 'Ready to diagnose your performance?',
        ctaDesc: 'In less than 15 minutes, the STRAP diagnosis identifies your top performance leaks.',
        ctaBtn: 'Run the STRAP® diagnostic',
        ctaSecondary: 'Book a call',

        // How it works (AS IS → TO BE → DIGITALISATION)
        howTag: 'How it works',
        howTitle: 'How does STRAP® work in practice?',
        howSubtitle: 'A structured approach in three phases, from field diagnosis to operational anticipation.',
        howSteps: [
            { title: 'AS IS', desc: 'We map the actual industrial process: its flows, anomalies, historical events and losses. We identify the situations that generate losses, the causes of deviations and the data available to characterise them.' },
            { title: 'TO BE', desc: 'With your teams, we define the anticipation criteria, business rules and dynamic prioritisation, along with alert thresholds and the actions to take. Depending on the process, situations can be characterised as red, yellow and green flows: actual incidents, risks and situations under control.' },
            { title: 'DIGITALISATION', desc: 'We implement STRAP Software: alerts, KPIs and daily operational management routines. It makes risks, priorities and action follow-up visible, building on existing systems wherever possible.' },
        ],
        howClosing: 'STRAP® does not start with software. It starts with understanding the industrial process and the decisions to anticipate.',
        termsTitle: 'Four names, one approach',
        terms: [
            { name: 'STRAP®', desc: 'The method: Strict Anticipation Process.' },
            { name: 'STRAP Software', desc: 'Its digital implementation on your site: rules, alerts, indicators and routines.' },
            { name: 'STRAP Tools', desc: 'Online tools to get started: performance diagnostic, Decision Radar, STRAPilot.' },
            { name: 'STRAP Maintenance', desc: 'An application of STRAP Software to the maintenance process — in development.' },
        ],

        // Anticipation diagram (after the 3 phases, before the video)
        diag: {
            tag: 'The STRAP® anticipation logic',
            title: 'STRAP® — From the industrial process to anticipating losses',
            intro: 'The matrix combines historical data, updated operational events and process-specific business rules to identify and dynamically prioritise risks before they become incidents or losses.',
            processTitle: 'Key industrial process',
            processDesc: 'Map the flows, events, anomalies and potential losses',
            flows: [
                { key: 'red', label: 'RED', desc: 'Actual incident or loss' },
                { key: 'yellow', label: 'YELLOW', desc: 'Risk or drift to anticipate' },
                { key: 'green', label: 'GREEN', desc: 'Situation under control' },
            ],
            matrixTitle: 'Dynamic anticipation & prioritisation matrix',
            matrixInputs: ['Historical data', 'Updated events', 'Business rules'],
            matrixCriteria: ['Criticality and impact', 'Recurrence and history', 'Symptoms and weak signals', 'Delays and risk evolution'],
            matrixOutput: 'Explainable priority, reassessed as data becomes available',
            softwareTitle: 'STRAP Software + daily management routines',
            routine: ['Alert', 'Prioritise', 'Decide', 'Act', 'Follow up'],
            feedback: 'Lessons learned and continuous improvement of the anticipation rules',
            notes: [
                'Flows, criteria and prioritisation rules are adapted to each industrial process. The dynamic anticipation matrix is updated from the data in existing systems (ERP, MRP, CMMS…), depending on the connections available.',
                'The red, yellow and green flows illustrate an anticipatory management logic specific to each process, not a universal classification.',
            ],
        },

        // Aperam case
        caseTag: 'STRAP® in action — Aperam Imphy',
        caseTitle: 'Anticipating raw-material non-conformities before they are used in the steel plant.',
        caseChallengeTitle: 'Challenge',
        caseChallenge: 'Anomalies in reception, conformity or certificates discovered late could cause major losses.',
        caseApproachTitle: 'Approach',
        caseApproach: ['Characterisation of anomalies', 'Compliance business rules', 'Digital reception and certificate workflow', 'Updated conformity KPIs', 'Daily operational routines'],
        caseResultTitle: 'Result',
        caseResult: 'No new raw-material scrap recorded since mid-November 2023 on the monitored scope, according to project results.',
        caseNote: 'Result on the raw-materials process — not a STRAP Maintenance result.',
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
            'Des pertes invisibles, souvent significatives',
            'Instabilité permanente',
        ],

        revelationTitle: 'La Révélation',
        revelationQuote: `De nombreuses dérives industrielles laissent des indices avant de produire leurs conséquences.`,
        revelationDesc: 'STRAP repose sur un principe fondateur :',
        revelationPrinciple: 'la plupart des dérives sont précédées de signaux observables — encore faut-il savoir les caractériser.',

        methodTitle: 'La Méthode STRAP®',
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

        demoTitle: 'Voir STRAP en Action',
        demoSubtitle: 'Découvrez la puissance de notre plateforme dans cette courte démonstration.',

        offersTitle: 'Offres STRAP',
        offersSubtitle: `Choisissez votre point d’entrée`,
        offers: [
            {
                name: 'STRAP Scan',
                tag: 'Identifier vos pertes',
                desc: 'Diagnostic des pertes et des risques : nous cartographions vos processus clés, les situations génératrices de pertes et les données permettant de les caractériser.',
                highlight: false,
            },
            {
                name: 'STRAP Deploy',
                tag: 'Activer les leviers',
                desc: `Règles métier, workflows, indicateurs et routines de décision construits et déployés avec vos équipes.`,
                highlight: true,
            },
            {
                name: 'STRAP Scale',
                tag: 'Déployer à grande échelle',
                desc: `Extension à plusieurs processus, ateliers ou sites, pour ancrer durablement une culture d’anticipation.`,
                highlight: false,
            },
        ],

        impactTitle: 'Impact Mesurable',
        impactList: [
            'Des gains mesurés sur vos propres indicateurs',
            'Résultats rapides, visibles sur le terrain',
            'Décisions accélérées',
        ],

        ctaTitle: 'Prêt à diagnostiquer votre performance ?',
        ctaDesc: 'En moins de 15 minutes, le diagnostic STRAP identifie vos principales fuites de performance.',
        ctaBtn: 'Faire le diagnostic STRAP®',
        ctaSecondary: 'Prendre un rendez-vous',

        howTag: 'Comment ça marche',
        howTitle: 'Comment fonctionne concrètement STRAP® ?',
        howSubtitle: 'Une démarche structurée en trois phases, du diagnostic terrain à l’anticipation opérationnelle.',
        howSteps: [
            { title: 'AS IS', desc: 'Nous cartographions le processus industriel réel : ses flux, ses anomalies, ses événements historiques et ses pertes. Nous identifions les situations générant des pertes, les causes des dérives et les données permettant de les caractériser.' },
            { title: 'TO BE', desc: 'Avec les équipes, nous définissons les critères d’anticipation, les règles métier et la priorisation dynamique, ainsi que les seuils d’alerte et les actions à engager. Selon le processus, les situations peuvent être caractérisées par des flux rouges, jaunes et verts : incidents avérés, risques et situations maîtrisées.' },
            { title: 'DIGITALISATION', desc: 'Nous mettons en œuvre STRAP Software : alertes, indicateurs (KPI) et routines quotidiennes de pilotage opérationnel. Il rend visibles les risques, les priorités et le suivi des actions, en s’appuyant autant que possible sur les systèmes existants.' },
        ],
        howClosing: 'STRAP® ne commence pas par un logiciel. Il commence par la compréhension du processus industriel et des décisions à anticiper.',
        termsTitle: 'Quatre noms, une même démarche',
        terms: [
            { name: 'STRAP®', desc: 'La méthode : Strict Anticipation Process.' },
            { name: 'STRAP Software', desc: 'Sa mise en œuvre digitale sur votre site : règles, alertes, indicateurs et routines.' },
            { name: 'STRAP Tools', desc: 'Des outils en ligne pour démarrer : diagnostic de performance, Decision Radar, STRAPilot.' },
            { name: 'STRAP Maintenance', desc: 'Une application de STRAP Software au processus maintenance — en développement.' },
        ],

        diag: {
            tag: 'La logique d’anticipation STRAP®',
            title: 'STRAP® — Du processus industriel à l’anticipation des pertes',
            intro: 'La matrice combine les données historiques, les événements opérationnels actualisés et les règles métier propres au processus pour identifier et prioriser dynamiquement les risques avant qu’ils ne deviennent des incidents ou des pertes.',
            processTitle: 'Processus industriel clé',
            processDesc: 'Cartographier les flux, les événements, les anomalies et les pertes potentielles',
            flows: [
                { key: 'red', label: 'ROUGE', desc: 'Incident ou perte avérée' },
                { key: 'yellow', label: 'JAUNE', desc: 'Risque ou dérive à anticiper' },
                { key: 'green', label: 'VERT', desc: 'Situation maîtrisée' },
            ],
            matrixTitle: 'Matrice dynamique d’anticipation et de priorisation',
            matrixInputs: ['Données historiques', 'Événements actualisés', 'Règles métier'],
            matrixCriteria: ['Criticité et impact', 'Récurrence et historique', 'Symptômes et signaux faibles', 'Délais et évolution du risque'],
            matrixOutput: 'Priorité explicable, réévaluée selon les données disponibles',
            softwareTitle: 'STRAP Software + routines de pilotage',
            routine: ['Alerter', 'Prioriser', 'Décider', 'Agir', 'Suivre'],
            feedback: 'Retour d’expérience et amélioration continue des règles d’anticipation',
            notes: [
                'Les flux, critères et règles de priorisation sont adaptés à chaque processus industriel. La matrice dynamique d’anticipation s’actualise à partir des données des systèmes existants (ERP, MRP, GMAO…), selon les connexions disponibles.',
                'Les flux rouge, jaune et vert illustrent une logique de pilotage anticipatif propre à chaque processus, et non une classification universelle.',
            ],
        },

        caseTag: 'STRAP® en action — Aperam Imphy',
        caseTitle: 'Anticiper les non-conformités des matières premières avant leur utilisation en aciérie.',
        caseChallengeTitle: 'Enjeu',
        caseChallenge: 'La découverte tardive d’anomalies de réception, de conformité ou de certificats pouvait entraîner des pertes majeures.',
        caseApproachTitle: 'Démarche',
        caseApproach: ['Caractérisation des anomalies', 'Règles métier de conformité', 'Workflow digital de réception et de certificats', 'Indicateurs de conformité mis à jour', 'Routines opérationnelles quotidiennes'],
        caseResultTitle: 'Résultat',
        caseResult: 'Aucun rebut de matières premières neuves enregistré depuis mi-novembre 2023 sur le périmètre suivi, selon les résultats du projet.',
        caseNote: 'Résultat obtenu sur le processus matières premières — pas un résultat STRAP Maintenance.',
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
        const video = videoRef.current;
        if (!video) return;
        video.volume = 1;

        // Browsers block autoplay with sound until the visitor has clicked or
        // tapped on the site. In that case we start muted and turn the sound
        // on at the visitor's first click, tap or key press.
        let autoMuted = false;
        const unmute = () => {
            if (autoMuted) {
                video.muted = false;
                video.volume = 1;
                autoMuted = false;
            }
            removeUnmuteListeners();
        };
        const events = ['pointerdown', 'keydown', 'touchstart'] as const;
        const removeUnmuteListeners = () => events.forEach(e => document.removeEventListener(e, unmute));

        const play = () => {
            video.play().catch(() => {
                autoMuted = true;
                video.muted = true;
                video.play().catch(() => { /* autoplay fully blocked: controls remain */ });
                events.forEach(e => document.addEventListener(e, unmute, { once: true }));
            });
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) play();
                else video.pause();
            },
            { threshold: 0.5 } // Trigger when 50% of the video is visible
        );

        observer.observe(video);
        return () => {
            observer.disconnect();
            removeUnmuteListeners();
        };
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
   STRAP anticipation diagram
   Built in HTML (not an image) so it follows the FR/EN switch.
   Process → red/yellow/green flows → matrix → software + routines.
───────────────────────────────────────────────────────────── */
const FLOW_STYLE: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

function StepNumber({ n }: { n: number }) {
    return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FF6B00] text-white text-sm font-black shrink-0">{n}</span>
    );
}

function DownArrow() {
    return (
        <div className="flex justify-center py-3" aria-hidden="true">
            <ArrowDown size={22} className="text-[#FF6B00]" />
        </div>
    );
}

function AnticipationDiagram({ d }: { d: (typeof T)['en']['diag'] }) {
    return (
        <section id="anticipation" className="py-24 px-6 bg-slate-50 border-t border-slate-100 scroll-mt-20">
            <div className="max-w-5xl mx-auto">
                <FadeIn delay={100} className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                        <span className="w-5 h-px bg-[#FF6B00]" /> {d.tag} <span className="w-5 h-px bg-[#FF6B00]" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">{d.title}</h2>
                    <p className="text-slate-600 text-lg max-w-3xl mx-auto">{d.intro}</p>
                </FadeIn>

                <FadeIn delay={200}>
                    <figure aria-label={d.title} className="max-w-4xl mx-auto">
                        {/* 1. Key industrial process */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <StepNumber n={1} />
                                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{d.processTitle}</h3>
                            </div>
                            <p className="text-slate-500">{d.processDesc}</p>
                        </div>

                        <DownArrow />

                        {/* Red / yellow / green flows */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {d.flows.map(f => (
                                <div key={f.key} className={`rounded-2xl border p-5 text-center ${FLOW_STYLE[f.key]}`}>
                                    <div className="font-extrabold tracking-wider text-lg">{f.label}</div>
                                    <div className="text-sm opacity-90">{f.desc}</div>
                                </div>
                            ))}
                        </div>

                        <DownArrow />

                        {/* 2. Dynamic matrix */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <StepNumber n={2} />
                                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{d.matrixTitle}</h3>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                                {d.matrixInputs.map((input, i) => (
                                    <span key={input} className="inline-flex items-center gap-2">
                                        {i > 0 && <span className="text-[#FF6B00] font-bold" aria-hidden="true">+</span>}
                                        <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{input}</span>
                                    </span>
                                ))}
                            </div>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                {d.matrixCriteria.map(c => (
                                    <li key={c} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-700 font-medium">{c}</li>
                                ))}
                            </ul>
                            <p className="font-bold text-slate-900">{d.matrixOutput}</p>
                        </div>

                        <DownArrow />

                        {/* 3. Software + routines, with feedback loop */}
                        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-center shadow-lg">
                            <div className="flex items-center justify-center gap-3 mb-5">
                                <StepNumber n={3} />
                                <h3 className="text-lg sm:text-xl font-extrabold text-white">{d.softwareTitle}</h3>
                            </div>
                            <ol className="flex flex-wrap items-center justify-center gap-2 mb-6">
                                {d.routine.map((r, i) => (
                                    <li key={r} className="inline-flex items-center gap-2">
                                        {i > 0 && <ArrowRight size={14} className="text-[#FF6B00]" aria-hidden="true" />}
                                        <span className="text-sm font-semibold text-slate-100 bg-white/10 px-3 py-1.5 rounded-lg">{r}</span>
                                    </li>
                                ))}
                            </ol>
                            <p className="inline-flex items-center justify-center gap-2 text-slate-300 text-sm">
                                <RefreshCw size={16} className="text-[#FF6B00] shrink-0" aria-hidden="true" /> {d.feedback}
                            </p>
                        </div>
                    </figure>
                </FadeIn>

                {/* Note requested under the diagram */}
                <FadeIn delay={300}>
                    <div className="max-w-4xl mx-auto mt-10 border-l-4 border-[#FF6B00] bg-white rounded-r-2xl p-6 space-y-3">
                        {d.notes.map(n => (
                            <p key={n} className="text-slate-700 leading-relaxed">{n}</p>
                        ))}
                    </div>
                </FadeIn>
            </div>
        </section>
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
                HOW IT WORKS — AS IS → TO BE → DIGITALISATION
            ══════════════════════════════════════════════════════════ */}
            <section id="methode" className="py-24 px-6 bg-white scroll-mt-20">
                <div className="max-w-6xl mx-auto">
                    <FadeIn delay={100} className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                            <span className="w-5 h-px bg-[#FF6B00]" /> {t.howTag} <span className="w-5 h-px bg-[#FF6B00]" />
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{t.howTitle}</h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">{t.howSubtitle}</p>
                    </FadeIn>

                    {/* Horizontal on desktop, stacked on mobile */}
                    <ol className="grid lg:grid-cols-3 gap-6 lg:gap-0 items-stretch">
                        {t.howSteps.map((step, i) => {
                            const Icon = [Search, Settings2, MonitorSmartphone][i];
                            return (
                                <li key={step.title} className="flex flex-col lg:flex-row items-stretch">
                                    <FadeIn delay={150 + i * 120} className="flex-1 h-full">
                                        <div className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-8 hover:border-orange-200 hover:bg-[#FFF8F4] transition-all">
                                            <div className="flex items-center gap-3 mb-5">
                                                <span className="w-11 h-11 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center"><Icon size={20} /></span>
                                                <span className="text-xs font-bold text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                                            </div>
                                            <h3 className="text-xl font-extrabold text-slate-900 tracking-wide mb-3">{step.title}</h3>
                                            <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </FadeIn>
                                    {i < t.howSteps.length - 1 && (
                                        <div className="flex items-center justify-center py-2 lg:py-0 lg:px-3 text-[#FF6B00]" aria-hidden="true">
                                            <ArrowRight size={24} className="rotate-90 lg:rotate-0" />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>

                    <FadeIn delay={300}>
                        <p className="mt-12 text-center text-xl sm:text-2xl font-bold text-slate-900 max-w-3xl mx-auto leading-snug">{t.howClosing}</p>
                    </FadeIn>

                    <FadeIn delay={350} className="mt-14">
                        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-400 text-center mb-5">{t.termsTitle}</h3>
                        <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {t.terms.map(term => (
                                <div key={term.name} className="rounded-2xl border border-slate-200 p-5">
                                    <dt className="font-extrabold text-slate-900 mb-1">{term.name}</dt>
                                    <dd className="text-sm text-slate-600 leading-relaxed">{term.desc}</dd>
                                </div>
                            ))}
                        </dl>
                    </FadeIn>
                </div>
            </section>

            <AnticipationDiagram d={t.diag} />

            {/* ══════════════════════════════════════════════════════════
                DEMO VIDEO
            ══════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <FadeIn delay={100} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                            {t.demoTitle || 'See STRAP in Action'}
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
                STRAP® IN ACTION — Aperam Imphy (raw materials)
            ══════════════════════════════════════════════════════════ */}
            <section id="aperam" className="py-24 px-6 bg-slate-900 text-white scroll-mt-20">
                <div className="max-w-6xl mx-auto">
                    <FadeIn delay={100} className="mb-12 max-w-3xl">
                        <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                            <Factory size={14} /> {t.caseTag}
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">{t.caseTitle}</h2>
                    </FadeIn>
                    <div className="grid lg:grid-cols-3 gap-6">
                        <FadeIn delay={150} className="h-full">
                            <div className="h-full rounded-2xl bg-white/5 border border-white/10 p-7">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#FF6B00] mb-3">{t.caseChallengeTitle}</h3>
                                <p className="text-slate-300 leading-relaxed">{t.caseChallenge}</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={250} className="h-full">
                            <div className="h-full rounded-2xl bg-white/5 border border-white/10 p-7">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#FF6B00] mb-3">{t.caseApproachTitle}</h3>
                                <ul className="space-y-2">
                                    {t.caseApproach.map(item => (
                                        <li key={item} className="flex gap-2 text-slate-300"><CheckCircle2 size={17} className="text-[#FF6B00] shrink-0 mt-0.5" /> {item}</li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>
                        <FadeIn delay={350} className="h-full">
                            <div className="h-full rounded-2xl bg-[#FF6B00] p-7">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-white/80 mb-3">{t.caseResultTitle}</h3>
                                <p className="text-xl font-bold leading-snug">{t.caseResult}</p>
                            </div>
                        </FadeIn>
                    </div>
                    <p className="text-xs text-slate-400 mt-6">{t.caseNote}</p>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                STRAP MAINTENANCE — next industrial application
            ══════════════════════════════════════════════════════════ */}
            <StrapMaintenanceSection lang={lang} />

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
                                            <Zap size={11} /> {lang === 'fr' ? 'Le plus demandé' : 'Most requested'}
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
