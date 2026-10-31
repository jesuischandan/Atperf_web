import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDown, Gauge, Layers, ShieldCheck } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   STRAP Maintenance — explanatory section (Discover + STRAP Software page)
   Layout follows STRAP_Maintenance_Apercu_Discover.pdf
───────────────────────────────────────────────────────────── */

const T = {
    fr: {
        eyebrow: 'STRAP Maintenance',
        kicker: 'Votre prochaine application industrielle',
        title: 'De l’anticipation des rebuts à l’anticipation des pannes',
        subtitle: 'Même méthodologie STRAP, nouveaux critères métier et nouvelle matrice d’anticipation.',
        status: 'Prototype en développement — pilote industriel recherché',
        flows: [
            { key: 'red', label: 'Flux rouge', desc: 'Avis / OT — Pannes et urgences' },
            { key: 'green', label: 'Flux vert', desc: 'Avis / OT — Préventifs et planifiés' },
            { key: 'yellow', label: 'Flux jaune', desc: 'Avis / OT — Différés ou d’opportunité' },
        ],
        matrixTitle: 'Matrice dynamique STRAP d’anticipation',
        matrixTags: ['Historiques', 'Causes sources', 'Symptômes', 'Criticité', 'Récurrence', 'Scoring'],
        priorityTitle: 'Prioriser les jaunes à risque de rouge',
        priorityDesc: 'Identifier et prioriser les Avis JAUNES présentant un risque d’évolution vers une panne ROUGE.',
        cockpitTitle: 'Cockpit Production / Maintenance',
        cockpitTags: ['Arbitrage quotidien', 'Actions anticipatives', 'Validation humaine'],
        complement: 'STRAP Maintenance est un dispositif complémentaire aux processus et outils existants de gestion opérationnelle de la maintenance (SAP PM, GMAO, ARMP…).',
        proposal: 'Notre proposition : accompagner chaque industriel dans l’adaptation, la validation et le déploiement de son propre dispositif d’anticipation, en fonction de ses équipements, de ses règles métier et de ses données historiques, afin de renforcer sa capacité à prévenir les aléas et arrêts de maintenance.',
        cta: 'Simulateur STRAP Software Maintenance',
        more: 'En savoir plus',
        disclaimer: 'Aperçu conceptuel — performances prédictives à démontrer par pilote.',
    },
    en: {
        eyebrow: 'STRAP Maintenance',
        kicker: 'Your next industrial application',
        title: 'From anticipating scrap to anticipating breakdowns',
        subtitle: 'Same STRAP methodology, new business criteria and a new anticipation matrix.',
        status: 'Prototype in development — industrial pilot partner wanted',
        flows: [
            { key: 'red', label: 'Red flow', desc: 'Notifications / WO — Breakdowns and emergencies' },
            { key: 'green', label: 'Green flow', desc: 'Notifications / WO — Preventive and planned' },
            { key: 'yellow', label: 'Yellow flow', desc: 'Notifications / WO — Deferred or opportunity' },
        ],
        matrixTitle: 'STRAP dynamic anticipation matrix',
        matrixTags: ['History', 'Root causes', 'Symptoms', 'Criticality', 'Recurrence', 'Scoring'],
        priorityTitle: 'Prioritise yellows at risk of turning red',
        priorityDesc: 'Identify and prioritise YELLOW notifications at risk of evolving into a RED breakdown.',
        cockpitTitle: 'Production / Maintenance cockpit',
        cockpitTags: ['Daily arbitration', 'Anticipatory actions', 'Human validation'],
        complement: 'STRAP Maintenance complements your existing maintenance processes and tools (SAP PM, CMMS, ARMP…). It does not replace them.',
        proposal: 'Our proposal: support each manufacturer in adapting, validating and deploying its own anticipation system — based on its equipment, business rules and historical data — to strengthen its ability to prevent maintenance hazards and stoppages.',
        cta: 'STRAP Software Maintenance simulator',
        more: 'Learn more',
        disclaimer: 'Conceptual preview — predictive performance to be demonstrated through a pilot.',
    },
};

const FLOW_STYLE: Record<string, { card: string; label: string; dot: string }> = {
    red: { card: 'bg-red-50 border-red-100', label: 'text-red-700', dot: 'bg-red-500' },
    green: { card: 'bg-emerald-50 border-emerald-100', label: 'text-emerald-700', dot: 'bg-emerald-500' },
    yellow: { card: 'bg-amber-50 border-amber-200', label: 'text-amber-700', dot: 'bg-amber-400' },
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
        <section id="strap-maintenance" className="py-24 px-6 bg-slate-50 border-y border-slate-100">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]">
                        <span className="w-6 h-px bg-[#FF6B00]" /> {t.eyebrow}
                    </div>
                    <p className="text-slate-500 text-lg mb-2">{t.kicker}</p>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">{t.title}</h2>
                    <p className="text-slate-600 text-lg max-w-3xl mb-6">{t.subtitle}</p>
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
                <div className="max-w-3xl mx-auto text-center mt-12 space-y-4">
                    <p className="text-slate-800 font-semibold">{t.complement}</p>
                    <p className="text-slate-600 leading-relaxed">{t.proposal}</p>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
                    <button
                        onClick={() => navigate('/strap-software/maintenance/demo')}
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#FF6B00]/25 transition-all hover:-translate-y-0.5"
                    >
                        {t.cta} <ArrowRight size={17} />
                    </button>
                    {showMoreLink && (
                        <button
                            onClick={() => navigate('/strap-software/maintenance')}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-slate-700 font-semibold px-8 py-4 rounded-xl border border-slate-300 hover:bg-white transition-all"
                        >
                            {t.more}
                        </button>
                    )}
                </div>
                <p className="text-center text-xs text-slate-500 mt-6">{t.disclaimer}</p>
            </div>
        </section>
    );
}
