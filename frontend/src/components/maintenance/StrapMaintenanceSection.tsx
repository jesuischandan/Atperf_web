import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDown, Clock, Gauge, Layers, ShieldCheck } from 'lucide-react';
import { MAINTENANCE_DEMO_PUBLIC } from '../../utils/siteConfig';

/* ─────────────────────────────────────────────────────────────
   STRAP Maintenance — explanatory section (Discover)
   Layout follows STRAP_Maintenance_Apercu_Discover.pdf; copy from the
   prospecting brief (Nov. 2026).
───────────────────────────────────────────────────────────── */

const T = {
    fr: {
        eyebrow: 'STRAP Maintenance',
        title: 'De l’anticipation des rebuts à l’anticipation des pannes.',
        intro: 'Dans les organisations industrielles, des Avis et Ordres de Travail sont différés ou restent en attente. Certains peuvent constituer des signaux précoces de défaillances futures.',
        aimsTitle: 'STRAP Maintenance vise à :',
        aims: [
            'analyser les historiques d’Avis, d’OT et de pannes ;',
            'rechercher des liens possibles entre événements différés et défaillances ;',
            'définir des critères de risque : criticité, symptômes, récurrence, délais ;',
            'prioriser les situations et organiser les arbitrages quotidiens Production / Maintenance.',
        ],
        status: 'En développement — démonstrateur interactif prochainement disponible',
        flows: [
            { key: 'red', label: 'Flux rouge', desc: 'Panne ou défaillance corrective.' },
            { key: 'yellow', label: 'Flux jaune', desc: 'Avis / OT différé ou opportunité de maintenance nécessitant une évaluation du risque et une décision.' },
            { key: 'green', label: 'Flux vert', desc: 'Intervention planifiée ou situation maîtrisée.' },
        ],
        flowsNote: 'Ces catégories sont adaptées aux processus de chaque site.',
        matrixTitle: 'Matrice dynamique STRAP d’anticipation',
        matrixTags: ['Historiques', 'Causes sources', 'Symptômes', 'Criticité', 'Récurrence', 'Délais'],
        priorityTitle: 'Prioriser les jaunes à risque de rouge',
        priorityDesc: 'Identifier les Avis JAUNES susceptibles d’évoluer vers une panne ROUGE et décider des actions à engager.',
        cockpitTitle: 'Cockpit Production / Maintenance',
        cockpitTags: ['Arbitrage quotidien', 'Actions anticipatives', 'Validation humaine'],
        positioning: 'STRAP Software Maintenance vise à fournir une couche digitale d’anticipation et d’aide à la décision complémentaire à SAP PM, aux GMAO et à ARMP.',
        caveat: 'Application actuellement en développement et démonstration ; son efficacité devra être évaluée sur les données et processus de chaque site.',
        cta: 'Échanger sur une application STRAP Maintenance',
        demo: 'Essayer le démonstrateur',
        soon: 'Démonstrateur interactif prochainement disponible',
        more: 'En savoir plus',
    },
    en: {
        eyebrow: 'STRAP Maintenance',
        title: 'From anticipating scrap to anticipating breakdowns.',
        intro: 'In industrial organisations, maintenance notifications and work orders get deferred or remain pending. Some of them may be early signals of future failures.',
        aimsTitle: 'STRAP Maintenance aims to:',
        aims: [
            'analyse notification, work-order and breakdown history;',
            'look for possible links between deferred events and failures;',
            'define risk criteria: criticality, symptoms, recurrence, delays;',
            'prioritise situations and organise daily Production / Maintenance arbitration.',
        ],
        status: 'In development — interactive demonstrator coming soon',
        flows: [
            { key: 'red', label: 'Red flow', desc: 'Breakdown or corrective failure.' },
            { key: 'yellow', label: 'Yellow flow', desc: 'Deferred notification / work order or maintenance opportunity that needs a risk assessment and a decision.' },
            { key: 'green', label: 'Green flow', desc: 'Planned intervention or situation under control.' },
        ],
        flowsNote: 'These categories are adapted to each site’s processes.',
        matrixTitle: 'STRAP dynamic anticipation matrix',
        matrixTags: ['History', 'Root causes', 'Symptoms', 'Criticality', 'Recurrence', 'Delays'],
        priorityTitle: 'Prioritise yellows at risk of turning red',
        priorityDesc: 'Identify YELLOW notifications likely to evolve into a RED breakdown and decide which actions to take.',
        cockpitTitle: 'Production / Maintenance cockpit',
        cockpitTags: ['Daily arbitration', 'Anticipatory actions', 'Human validation'],
        positioning: 'STRAP Software Maintenance aims to provide a digital layer for anticipation and decision support that complements SAP PM, CMMS tools and ARMP.',
        caveat: 'Application currently in development and demonstration; its effectiveness will have to be assessed on each site’s data and processes.',
        cta: 'Discuss a STRAP Maintenance application',
        demo: 'Try the demonstrator',
        soon: 'Interactive demonstrator coming soon',
        more: 'Learn more',
    },
};

const FLOW_STYLE: Record<string, { card: string; label: string; dot: string }> = {
    red: { card: 'bg-red-50 border-red-100', label: 'text-red-700', dot: 'bg-red-500' },
    yellow: { card: 'bg-amber-50 border-amber-200', label: 'text-amber-700', dot: 'bg-amber-400' },
    green: { card: 'bg-emerald-50 border-emerald-100', label: 'text-emerald-700', dot: 'bg-emerald-500' },
};

function Connector() {
    return (
        <div className="flex justify-center py-3" aria-hidden="true">
            <ArrowDown size={22} className="text-[#FF6B00]" />
        </div>
    );
}

export default function StrapMaintenanceSection({ lang, showMoreLink = true }: { lang: 'en' | 'fr'; showMoreLink?: boolean }) {
    const navigate = useNavigate();
    const t = T[lang];

    return (
        <section id="strap-maintenance" className="py-24 px-6 bg-slate-50 border-y border-slate-100 scroll-mt-20">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                        <span className="w-6 h-px bg-[#FF6B00]" /> {t.eyebrow}
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight leading-tight">{t.title}</h2>
                    <p className="text-slate-700 text-lg max-w-3xl mb-5">{t.intro}</p>
                    <p className="font-semibold text-slate-800 mb-2">{t.aimsTitle}</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 max-w-3xl mb-6">
                        {t.aims.map(a => <li key={a}>{a}</li>)}
                    </ul>
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" /> {t.status}
                    </span>
                </div>

                {/* Three flows */}
                <div className="grid sm:grid-cols-3 gap-4">
                    {t.flows.map(f => (
                        <div key={f.key} className={`rounded-2xl border p-6 text-center ${FLOW_STYLE[f.key].card}`}>
                            <div className={`inline-flex items-center gap-2 font-extrabold uppercase tracking-wider text-lg mb-2 ${FLOW_STYLE[f.key].label}`}>
                                <span className={`w-3 h-3 rounded-full ${FLOW_STYLE[f.key].dot}`} /> {f.label}
                            </div>
                            <p className="text-slate-600 text-sm">{f.desc}</p>
                        </div>
                    ))}
                </div>
                <p className="text-center text-xs text-slate-500 mt-3">{t.flowsNote}</p>

                <Connector />

                {/* Matrix */}
                <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Layers size={18} className="text-[#FF6B00]" />
                        <h3 className="font-extrabold text-slate-900 uppercase tracking-wide">{t.matrixTitle}</h3>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {t.matrixTags.map(tag => (
                            <span key={tag} className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>

                <Connector />

                {/* Prioritisation */}
                <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Gauge size={18} className="text-amber-700" />
                        <h3 className="font-extrabold text-amber-800 uppercase tracking-wide">{t.priorityTitle}</h3>
                    </div>
                    <p className="text-amber-900/80 text-sm">{t.priorityDesc}</p>
                </div>

                <Connector />

                {/* Cockpit */}
                <div className="max-w-3xl mx-auto bg-slate-900 rounded-2xl p-6 text-center shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <ShieldCheck size={18} className="text-[#FF6B00]" />
                        <h3 className="font-extrabold text-white uppercase tracking-wide">{t.cockpitTitle}</h3>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {t.cockpitTags.map(tag => (
                            <span key={tag} className="text-xs font-semibold text-slate-200 bg-white/10 px-3 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>

                {/* Positioning */}
                <div className="max-w-3xl mx-auto text-center mt-12 space-y-3">
                    <p className="text-slate-800 font-semibold">{t.positioning}</p>
                    <p className="text-slate-500 text-sm">{t.caveat}</p>
                </div>

                {/* CTA — no live demo until the demonstrator is tested */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
                    <button
                        onClick={() => navigate('/contact?topic=maintenance')}
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#FF6B00]/25 transition-all hover:-translate-y-0.5"
                    >
                        {t.cta} <ArrowRight size={17} />
                    </button>
                    {MAINTENANCE_DEMO_PUBLIC ? (
                        <button
                            onClick={() => navigate('/strap-software/maintenance/demo')}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-slate-700 font-semibold px-8 py-4 rounded-xl border border-slate-300 hover:bg-white transition-all"
                        >
                            {t.demo}
                        </button>
                    ) : showMoreLink && (
                        <button
                            onClick={() => navigate('/strap-software/maintenance')}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-slate-700 font-semibold px-8 py-4 rounded-xl border border-slate-300 hover:bg-white transition-all"
                        >
                            {t.more}
                        </button>
                    )}
                </div>
                {!MAINTENANCE_DEMO_PUBLIC && (
                    <p className="flex justify-center items-center gap-2 text-sm text-slate-500 mt-5">
                        <Clock size={15} className="text-[#FF6B00]" /> {t.soon}
                    </p>
                )}
            </div>
        </section>
    );
}
