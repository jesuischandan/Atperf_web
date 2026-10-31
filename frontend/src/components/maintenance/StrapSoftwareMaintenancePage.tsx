import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, ClipboardCheck, Database, Search, Settings2, UserCheck, Workflow } from 'lucide-react';
import LandingPageNav from '../LandingPageNav';
import Footer from '../Footer';

/* ─────────────────────────────────────────────────────────────
   Solutions digitales → STRAP Software → Maintenance
   Editorial base: ATPERF_Brief_Site_Web_STRAP_Software_Maintenance (23/10/2026)
───────────────────────────────────────────────────────────── */

const T = {
    fr: {
        breadcrumb: ['Solutions digitales', 'STRAP Software', 'Maintenance'],
        status: 'Prototype en développement — pilote industriel recherché',
        hook: 'Et si les Avis de maintenance différés d’aujourd’hui contenaient déjà les signaux des pannes de demain ?',
        promise: 'Anticiper les pannes avant qu’elles ne deviennent des urgences, en exploitant les Avis et OT différés ainsi que les historiques de maintenance.',
        ctaDemo: 'Ouvrir le simulateur',
        ctaContact: 'Échanger sur un pilote',
        contextTitle: 'Des données riches, des signaux encore peu exploités',
        context: 'Les industriels disposent de nombreuses données dans SAP PM et les GMAO : Avis, ordres de travail (OT), historiques d’interventions, rapports et causes de défaillance. Pourtant, certaines anomalies restent en attente ou sont reportées, faute de temps, de ressources ou de critères suffisants pour apprécier leur évolution. STRAP Software Maintenance vise à transformer ces données en décisions d’anticipation pour renforcer la fiabilité des équipements et limiter les arrêts non planifiés.',
        methodTitle: 'La méthode STRAP® : du processus réel à l’anticipation',
        methodIntro: 'STRAP® (Strict Anticipation Process) est une démarche développée par ATPERF Conseil et mise en œuvre chez Aperam Imphy sur des processus industriels clés, notamment la maîtrise des fournisseurs de matières premières neuves. Son application à la maintenance fait l’objet d’un prototype spécifique.',
        steps: [
            { title: 'AS-IS', desc: 'Cartographier le processus réellement exécuté, les interfaces, KPI, contraintes terrain, anomalies et écarts aux standards.' },
            { title: 'TO-BE', desc: 'Caractériser les flux, analyser les historiques d’aléas et les causes sources, formaliser des règles métier de priorisation.' },
            { title: 'Digitalisation', desc: 'Exploiter les données disponibles, afficher des alertes explicables et intégrer les décisions aux routines Production / Maintenance.' },
        ],
        flowsTitle: 'Les trois flux du processus Maintenance',
        flowCols: ['Flux', 'Caractérisation', 'Pilotage', 'Exemple (fictif)'],
        flows: [
            { key: 'red', name: 'Rouge', what: 'Pannes et urgences ; interventions correctives immédiates', how: 'Réagir et rétablir', ex: 'Perte de pression et arrêt de la pompe hydraulique' },
            { key: 'green', name: 'Vert', what: 'Préventif et interventions préparées / planifiées', how: 'Exécuter le plan', ex: 'Inspection et graissage selon gamme' },
            { key: 'yellow', name: 'Jaune', what: 'Avis / OT différés, reportés ou d’opportunité', how: 'Qualifier, prioriser, anticiper', ex: 'Fuite d’huile progressive, contrôle reporté 3 fois' },
        ],
        flowsNote: 'Les catégories sont définies selon les critères du processus étudié ; un Avis jaune n’est pas automatiquement annonciateur d’une panne.',
        hypoTitle: 'L’hypothèse JAUNE → ROUGE à tester',
        hypo: 'Certains Avis jaunes anciens ou non traités pourraient présenter des symptômes similaires à ceux qui ont précédé des pannes rouges sur le même équipement ou sous-ensemble. Le prototype rapproche chronologiquement Avis, OT, équipements, symptômes et défaillances, puis permet à un expert de confirmer ou de rejeter les liens suggérés.',
        timeline: [
            { d: 'J-55', label: 'Avis jaune', desc: 'Vibration inhabituelle — contrôle à programmer' },
            { d: 'J-30', label: 'Report', desc: 'Contrôle reporté (charge atelier)' },
            { d: 'J-12', label: 'Symptôme répété', desc: 'Nouvel Avis : vibration accrue' },
            { d: 'J0', label: 'OT rouge', desc: 'Vibration forte et arrêt — roulement dégradé' },
        ],
        fictive: 'Illustration fictive',
        pipeline: ['Historique Avis / OT', 'Caractérisation R / V / J', 'Matrice de liens et symptômes', 'Score explicable /100', 'Cockpit de priorisation', 'Validation humaine'],
        matrixTitle: 'Matrice de priorisation des Avis jaunes /100',
        matrixCols: ['Critère', 'Points'],
        matrix: [
            ['Criticité de l’équipement', 25], ['Récurrence des anomalies', 20], ['Similarité avec les historiques de pannes', 20],
            ['Ancienneté et reports de l’Avis', 15], ['Gravité des symptômes', 10], ['Contexte opérationnel aggravant', 10],
        ] as [string, number][],
        matrixTotal: 'Total',
        matrixNote: 'Pondérations provisoires et configurables. Le score exprime une priorité métier, pas une probabilité de panne. Chaque facteur et chaque rapprochement historique restent consultables et explicables.',
        cockpitTitle: 'Ce que montrera le cockpit STRAP Software',
        cockpitList: [
            'Vue d’ensemble des trois flux Maintenance et du volume d’Avis / OT.',
            'Liste filtrable des Avis jaunes avec score /100, ancienneté, criticité, symptômes et équipement.',
            'Fiche Avis : justification du score, événements historiques comparables et liens vers OT rouges antérieurs.',
            'Suggestions de vérification ou d’action, à confirmer par un responsable Maintenance.',
            'Suivi des décisions, rejets, corrections et retours d’expérience dans les routines Production / Maintenance.',
        ],
        mock: { cols: ['Avis', 'Équipement', 'Symptôme', 'Score', 'Décision'], rows: [
            ['AV-1030', 'AA-330', 'Jeu mécanique observé', 86, 'À valider'],
            ['AV-1002', 'PH-204', 'Vibration inhabituelle', 82, 'Validé'],
            ['AV-1014', 'PH-204', 'Défaut capteur intermittent', 78, 'À valider'],
            ['AV-1005', 'VR-509', 'Pression instable', 77, 'Corrigé'],
        ] as [string, string, string, number, string][] },
        loopTitle: 'Une boucle de validation terrain',
        loop: [
            { title: 'Analyse historique', desc: 'Rejouer les pannes passées et leurs Avis précurseurs.' },
            { title: 'Expert Maintenance', desc: 'Confirmer ou rejeter chaque rapprochement suggéré.' },
            { title: 'Règles métier', desc: 'Ajuster critères, pondérations et seuils.' },
            { title: 'Pilote', desc: 'Déployer sur vos équipements et mesurer.' },
        ],
        scopeTitle: 'Démonstrateur : périmètre et statut',
        scope: 'La première version repose sur l’import de fichiers Excel / CSV et des données de démonstration fictives. Elle ne nécessite ni connexion SAP temps réel, ni création automatique d’OT, ni analyse économique LCC. Le test clé consiste à rejouer des historiques : sélectionner une panne rouge, rechercher les Avis jaunes antérieurs et vérifier si les informations disponibles avant la panne auraient permis de signaler une situation à risque. Les Avis sans panne ultérieure sont également testés pour éviter les fausses alertes. Les résultats sont soumis à validation métier.',
        benefitsTitle: 'Bénéfices visés (à démontrer par pilote)',
        benefits: [
            'Meilleure priorisation des Avis / OT différés et des interventions d’opportunité.',
            'Capitalisation des symptômes, des historiques et de l’expérience des équipes terrain.',
            'Aide aux arbitrages quotidiens Production / Maintenance et meilleure traçabilité des décisions.',
            'À terme : réduction potentielle des pannes urgentes et amélioration de la disponibilité.',
        ],
        positioning: 'STRAP Software Maintenance est conçu comme une couche complémentaire à SAP PM, aux GMAO et aux démarches d’excellence Maintenance, et non comme leur remplacement.',
        finalTitle: 'Vous disposez d’historiques d’Avis et d’OT ?',
        finalDesc: 'Échangeons sur un pilote STRAP Maintenance afin d’évaluer les liens entre anomalies différées et défaillances historiques.',
    },
    en: {
        breadcrumb: ['Digital solutions', 'STRAP Software', 'Maintenance'],
        status: 'Prototype in development — industrial pilot partner wanted',
        hook: 'What if today’s deferred maintenance notifications already held the signals of tomorrow’s breakdowns?',
        promise: 'Anticipate breakdowns before they become emergencies, by using deferred notifications and work orders together with maintenance history.',
        ctaDemo: 'Open the simulator',
        ctaContact: 'Discuss a pilot',
        contextTitle: 'Rich data, signals still under-used',
        context: 'Manufacturers hold large amounts of data in SAP PM and CMMS tools: notifications, work orders (WO), intervention history, reports and failure causes. Yet some anomalies stay pending or get postponed, for lack of time, resources or criteria to assess how they evolve. STRAP Software Maintenance aims to turn this data into anticipation decisions that strengthen equipment reliability and limit unplanned stoppages.',
        methodTitle: 'The STRAP® method: from the real process to anticipation',
        methodIntro: 'STRAP® (Strict Anticipation Process) is an approach developed by ATPERF Conseil and implemented at Aperam Imphy on key industrial processes, in particular the control of new raw-material suppliers. Its application to maintenance is the subject of a dedicated prototype.',
        steps: [
            { title: 'AS-IS', desc: 'Map the process as actually executed: interfaces, KPIs, field constraints, anomalies and gaps to standards.' },
            { title: 'TO-BE', desc: 'Characterise the flows, analyse incident history and root causes, formalise business prioritisation rules.' },
            { title: 'Digitalisation', desc: 'Use available data, display explainable alerts and embed decisions in Production / Maintenance routines.' },
        ],
        flowsTitle: 'The three flows of the maintenance process',
        flowCols: ['Flow', 'Characterisation', 'Management', 'Example (fictive)'],
        flows: [
            { key: 'red', name: 'Red', what: 'Breakdowns and emergencies; immediate corrective work', how: 'React and restore', ex: 'Pressure loss and hydraulic pump stoppage' },
            { key: 'green', name: 'Green', what: 'Preventive and prepared / planned work', how: 'Execute the plan', ex: 'Inspection and greasing per routine' },
            { key: 'yellow', name: 'Yellow', what: 'Deferred, postponed or opportunity notifications / WOs', how: 'Qualify, prioritise, anticipate', ex: 'Progressive oil leak, check postponed 3 times' },
        ],
        flowsNote: 'Categories are defined by the criteria of the process studied; a yellow notification is not automatically a breakdown precursor.',
        hypoTitle: 'The YELLOW → RED hypothesis to test',
        hypo: 'Some old or untreated yellow notifications may show symptoms similar to those that preceded red breakdowns on the same asset or sub-assembly. The prototype links notifications, work orders, assets, symptoms and failures chronologically, then lets an expert confirm or reject the suggested links.',
        timeline: [
            { d: 'D-55', label: 'Yellow notification', desc: 'Unusual vibration — check to schedule' },
            { d: 'D-30', label: 'Postponed', desc: 'Check postponed (workshop load)' },
            { d: 'D-12', label: 'Repeated symptom', desc: 'New notification: vibration increasing' },
            { d: 'D0', label: 'Red WO', desc: 'Strong vibration and stoppage — worn bearing' },
        ],
        fictive: 'Fictive illustration',
        pipeline: ['Notification / WO history', 'R / G / Y characterisation', 'Link & symptom matrix', 'Explainable score /100', 'Prioritisation cockpit', 'Human validation'],
        matrixTitle: 'Yellow notification prioritisation matrix /100',
        matrixCols: ['Criterion', 'Points'],
        matrix: [
            ['Asset criticality', 25], ['Anomaly recurrence', 20], ['Similarity to failure history', 20],
            ['Notification age and postponements', 15], ['Symptom severity', 10], ['Aggravating operating context', 10],
        ] as [string, number][],
        matrixTotal: 'Total',
        matrixNote: 'Provisional, configurable weights. The score expresses a business priority, not a failure probability. Every factor and every historical match remains visible and explainable.',
        cockpitTitle: 'What the STRAP Software cockpit will show',
        cockpitList: [
            'Overview of the three maintenance flows and notification / WO volumes.',
            'Filterable list of yellow notifications with score /100, age, criticality, symptoms and asset.',
            'Notification sheet: score explanation, comparable past events and links to earlier red WOs.',
            'Suggested checks or actions, to be confirmed by a maintenance manager.',
            'Tracking of decisions, rejections, corrections and lessons learned in Production / Maintenance routines.',
        ],
        mock: { cols: ['Notif.', 'Asset', 'Symptom', 'Score', 'Decision'], rows: [
            ['AV-1030', 'AA-330', 'Mechanical play observed', 86, 'To validate'],
            ['AV-1002', 'PH-204', 'Unusual vibration', 82, 'Validated'],
            ['AV-1014', 'PH-204', 'Intermittent sensor fault', 78, 'To validate'],
            ['AV-1005', 'VR-509', 'Unstable pressure', 77, 'Corrected'],
        ] as [string, string, string, number, string][] },
        loopTitle: 'A field validation loop',
        loop: [
            { title: 'Historical analysis', desc: 'Replay past breakdowns and their precursor notifications.' },
            { title: 'Maintenance expert', desc: 'Confirm or reject each suggested match.' },
            { title: 'Business rules', desc: 'Adjust criteria, weights and thresholds.' },
            { title: 'Pilot', desc: 'Deploy on your assets and measure.' },
        ],
        scopeTitle: 'Demonstrator: scope and status',
        scope: 'The first version relies on Excel / CSV imports and fictive demonstration data. It requires no real-time SAP connection, no automatic work-order creation and no LCC economic analysis. The key test is replaying history: pick a red breakdown, find the earlier yellow notifications and check whether the information available before the breakdown would have flagged a risk. Notifications with no later breakdown are tested too, to avoid false alerts. Results are submitted to business validation.',
        benefitsTitle: 'Targeted benefits (to be demonstrated through a pilot)',
        benefits: [
            'Better prioritisation of deferred notifications / WOs and opportunity work.',
            'Capture of symptoms, history and field-team experience.',
            'Support for daily Production / Maintenance arbitration and better decision traceability.',
            'Over time: potential reduction of emergency breakdowns and improved availability.',
        ],
        positioning: 'STRAP Software Maintenance is designed as a complementary layer to SAP PM, CMMS tools and maintenance excellence programmes — not as a replacement.',
        finalTitle: 'Do you have notification and work-order history?',
        finalDesc: 'Let’s discuss a STRAP Maintenance pilot to assess the links between deferred anomalies and past failures.',
    },
};

const FLOW_DOT: Record<string, string> = { red: 'bg-red-500', green: 'bg-emerald-500', yellow: 'bg-amber-400' };
const FLOW_TEXT: Record<string, string> = { red: 'text-red-700', green: 'text-emerald-700', yellow: 'text-amber-700' };
const TIMELINE_DOT = ['bg-amber-400', 'bg-amber-500', 'bg-amber-600', 'bg-red-600'];
const LOOP_ICONS = [Search, UserCheck, Settings2, ClipboardCheck];

function Eyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
            <span className="w-6 h-px bg-[#FF6B00]" /> {children}
        </div>
    );
}

export default function StrapSoftwareMaintenancePage() {
    const navigate = useNavigate();
    const [lang, setLang] = useState<'en' | 'fr'>(() => (localStorage.getItem('strap_lang') === 'fr' ? 'fr' : 'en'));
    const switchLang = (l: 'en' | 'fr') => { setLang(l); localStorage.setItem('strap_lang', l); };
    const t = T[lang];

    return (
        <div className="min-h-screen bg-white text-slate-900 antialiased" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <LandingPageNav lang={lang} onLangChange={switchLang} />

            {/* ── Hero ── */}
            <section className="relative pt-28 pb-20 px-6 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #FF6B00 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="relative max-w-5xl mx-auto">
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-400 mb-8">
                        {t.breadcrumb.map((b, i) => (
                            <span key={b} className="inline-flex items-center gap-1">
                                {i > 0 && <ChevronRight size={14} />}
                                <span className={i === t.breadcrumb.length - 1 ? 'text-white font-semibold' : ''}>{b}</span>
                            </span>
                        ))}
                    </nav>
                    <p className="text-[#FF6B00] font-bold tracking-widest uppercase mb-4">STRAP® Software Maintenance</p>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6 max-w-4xl">{t.hook}</h1>
                    <p className="text-slate-300 text-lg sm:text-xl max-w-3xl mb-8">{t.promise}</p>
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/10 text-slate-200 px-3 py-1.5 rounded-full mb-10">
                        <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" /> {t.status}
                    </span>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => navigate('/strap-software/maintenance/demo')} className="inline-flex justify-center items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#FF6B00]/30 transition-all">
                            {t.ctaDemo} <ArrowRight size={17} />
                        </button>
                        <button onClick={() => navigate('/contact')} className="inline-flex justify-center items-center gap-2 border border-slate-600 text-slate-200 font-semibold px-8 py-4 rounded-xl hover:bg-white/5 transition-all">
                            {t.ctaContact}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Context ── */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-6">{t.contextTitle}</h2>
                    <p className="text-slate-600 text-lg leading-relaxed">{t.context}</p>
                </div>
            </section>

            {/* ── Method ── */}
            <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
                <div className="max-w-5xl mx-auto">
                    <Eyebrow>STRAP®</Eyebrow>
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">{t.methodTitle}</h2>
                    <p className="text-slate-600 text-lg max-w-3xl mb-10">{t.methodIntro}</p>
                    <div className="grid md:grid-cols-3 gap-4">
                        {t.steps.map((s, i) => (
                            <div key={s.title} className="bg-white rounded-2xl border border-slate-200 p-6">
                                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] font-black flex items-center justify-center mb-4">{i + 1}</div>
                                <h3 className="text-xl font-extrabold mb-2">{s.title}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Visual 1: three flows ── */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-8">{t.flowsTitle}</h2>
                    <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 text-white">
                                <tr>{t.flowCols.map(c => <th key={c} className="text-left font-semibold px-4 py-3">{c}</th>)}</tr>
                            </thead>
                            <tbody>
                                {t.flows.map(f => (
                                    <tr key={f.key} className="border-t border-slate-100">
                                        <td className={`px-4 py-4 font-extrabold uppercase whitespace-nowrap ${FLOW_TEXT[f.key]}`}>
                                            <span className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${FLOW_DOT[f.key]}`} />{f.name}
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">{f.what}</td>
                                        <td className="px-4 py-4 font-semibold text-slate-800">{f.how}</td>
                                        <td className="px-4 py-4 text-slate-500 italic">{f.ex}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-slate-500 mt-3">{t.flowsNote}</p>
                </div>
            </section>

            {/* ── Visual 2: hypothesis + fictive timeline ── */}
            <section className="py-20 px-6 bg-amber-50/60 border-y border-amber-100">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">{t.hypoTitle}</h2>
                    <p className="text-slate-700 text-lg max-w-3xl mb-10">{t.hypo}</p>

                    <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 mb-8">
                        <div className="flex justify-end mb-4"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.fictive}</span></div>
                        <ol className="relative grid sm:grid-cols-4 gap-6">
                            <div className="hidden sm:block absolute top-3 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-amber-300 to-red-500" aria-hidden="true" />
                            {t.timeline.map((s, i) => (
                                <li key={s.d} className="relative flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3 sm:text-center">
                                    <span className={`relative z-10 shrink-0 w-6 h-6 rounded-full ring-4 ring-white ${TIMELINE_DOT[i]}`} />
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 tabular-nums">{s.d}</div>
                                        <div className={`font-extrabold ${i === 3 ? 'text-red-700' : 'text-amber-800'}`}>{s.label}</div>
                                        <div className="text-sm text-slate-600">{s.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {t.pipeline.map((p, i) => (
                            <span key={p} className="inline-flex items-center gap-2">
                                {i > 0 && <ArrowRight size={14} className="text-[#FF6B00]" />}
                                <span className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700">{p}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Matrix ── */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
                    <div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">{t.matrixTitle}</h2>
                        <p className="text-slate-600">{t.matrixNote}</p>
                    </div>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 text-white">
                                <tr><th className="text-left font-semibold px-4 py-3">{t.matrixCols[0]}</th><th className="text-right font-semibold px-4 py-3">{t.matrixCols[1]}</th></tr>
                            </thead>
                            <tbody>
                                {t.matrix.map(([c, p]) => (
                                    <tr key={c} className="border-t border-slate-100">
                                        <td className="px-4 py-3 text-slate-700">{c}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#FF6B00]" style={{ width: `${p * 4}%` }} /></div>
                                                <span className="font-bold tabular-nums w-6 text-right">{p}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="border-t border-slate-200 bg-slate-50 font-extrabold"><td className="px-4 py-3">{t.matrixTotal}</td><td className="px-4 py-3 text-right tabular-nums">100</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ── Visual 3: cockpit ── */}
            <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-6">{t.cockpitTitle}</h2>
                        <ul className="space-y-3">
                            {t.cockpitList.map(item => (
                                <li key={item} className="flex gap-3 text-slate-700">
                                    <Workflow size={18} className="text-[#FF6B00] shrink-0 mt-0.5" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-5 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /></div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t.fictive}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-slate-300">
                                <thead><tr>{t.mock.cols.map(c => <th key={c} className="text-left font-semibold text-slate-500 pb-2 pr-3">{c}</th>)}</tr></thead>
                                <tbody>
                                    {t.mock.rows.map(([id, eq, sym, sc, dec]) => (
                                        <tr key={id} className="border-t border-white/5">
                                            <td className="py-2 pr-3 font-semibold text-white">{id}</td>
                                            <td className="py-2 pr-3">{eq}</td>
                                            <td className="py-2 pr-3">{sym}</td>
                                            <td className="py-2 pr-3"><span className={`font-bold px-1.5 py-0.5 rounded ${sc >= 75 ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900'}`}>{sc}</span></td>
                                            <td className="py-2 pr-3">{dec}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Visual 4: validation loop ── */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-10">{t.loopTitle}</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {t.loop.map((s, i) => {
                            const Icon = LOOP_ICONS[i];
                            return (
                                <div key={s.title} className="relative bg-white border border-slate-200 rounded-2xl p-6">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-[#FF6B00] flex items-center justify-center mb-4"><Icon size={18} /></div>
                                    <div className="text-xs font-bold text-slate-400 mb-1">{String(i + 1).padStart(2, '0')}</div>
                                    <h3 className="font-extrabold mb-1">{s.title}</h3>
                                    <p className="text-sm text-slate-600">{s.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Scope + benefits ── */}
            <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10">
                    <div>
                        <div className="flex items-center gap-2 mb-4"><Database size={20} className="text-[#FF6B00]" /><h2 className="text-2xl font-extrabold">{t.scopeTitle}</h2></div>
                        <span className="inline-block text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full mb-4">{t.status}</span>
                        <p className="text-slate-600 leading-relaxed">{t.scope}</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold mb-4">{t.benefitsTitle}</h2>
                        <ul className="space-y-3">
                            {t.benefits.map(b => (
                                <li key={b} className="flex gap-3 text-slate-700"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0" /> {b}</li>
                            ))}
                        </ul>
                        <p className="mt-6 text-slate-800 font-semibold">{t.positioning}</p>
                    </div>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="relative py-24 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                <div className="relative max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">{t.finalTitle}</h2>
                    <p className="text-slate-400 text-lg mb-10">{t.finalDesc}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => navigate('/contact')} className="inline-flex justify-center items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-xl transition-all">
                            {t.ctaContact} <ArrowRight size={17} />
                        </button>
                        <button onClick={() => navigate('/strap-software/maintenance/demo')} className="inline-flex justify-center items-center gap-2 border border-slate-600 text-slate-200 font-semibold px-8 py-4 rounded-xl hover:bg-white/5 transition-all">
                            {t.ctaDemo}
                        </button>
                    </div>
                </div>
            </section>

            <Footer lang={lang} />
        </div>
    );
}
