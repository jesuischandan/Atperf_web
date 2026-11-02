import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Factory, Wrench } from 'lucide-react';
import { MAINTENANCE_DEMO_PUBLIC } from '../utils/siteConfig';
import API_URL from '../utils/apiUrl';
import Footer from './Footer';
import LandingPageNav from './LandingPageNav'; // We will extract the nav to keep it DRY, or copy it.

const FEATURED = {
    fr: {
        aperamTag: 'Cas client — processus matières premières',
        aperamTitle: 'Aperam Imphy : anticiper les non-conformités des matières premières neuves',
        aperamBody: 'Règles métier de conformité, workflow digital de réception et de certificats, indicateurs de conformité et routines quotidiennes sur le processus de gestion des matières premières neuves de l’aciérie.',
        aperamResult: 'Aucun rebut de matières premières neuves enregistré depuis mi-novembre 2023 sur le périmètre suivi, selon les résultats du projet.',
        aperamLink: 'Lire le cas',
        maintTag: 'Application STRAP Software',
        maintTitle: 'STRAP Maintenance : anticiper les pannes à partir des Avis différés',
        maintBody: 'Exploiter les historiques d’Avis/OT, les symptômes, la récurrence et la criticité pour prioriser les situations susceptibles de conduire à des arrêts non planifiés.',
        maintStatus: 'En développement — Démonstrateur prochainement disponible',
        maintNote: 'Aucun résultat validé à ce jour : son efficacité devra être évaluée sur les données de chaque site.',
        maintLink: 'Découvrir l’approche',
        maintDemo: 'Essayer le démonstrateur',
        others: 'Autres cas d’usage',
    },
    en: {
        aperamTag: 'Client case — raw-materials process',
        aperamTitle: 'Aperam Imphy: anticipating new raw-material non-conformities',
        aperamBody: 'Compliance business rules, a digital reception and certificate workflow, conformity indicators and daily routines on the steel plant’s new raw-material management process.',
        aperamResult: 'No new raw-material scrap recorded since mid-November 2023 on the monitored scope, according to project results.',
        aperamLink: 'Read the case',
        maintTag: 'STRAP Software application',
        maintTitle: 'STRAP Maintenance: anticipating breakdowns from deferred notifications',
        maintBody: 'Use notification and work-order history, symptoms, recurrence and criticality to prioritise situations likely to lead to unplanned stoppages.',
        maintStatus: 'In development — Demonstrator coming soon',
        maintNote: 'No validated results yet: its effectiveness will have to be assessed on each site’s data.',
        maintLink: 'Discover the approach',
        maintDemo: 'Try the demonstrator',
        others: 'Other use cases',
    },
};

export default function UseCasesPage() {
    const [useCases, setUseCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lang] = useState<'en' | 'fr'>(() => (localStorage.getItem('strap_lang') === 'fr' ? 'fr' : 'en'));
    const navigate = useNavigate();
    const f = FEATURED[lang];

    useEffect(() => {
        fetch(`${API_URL}/use-cases?status=published`)
            .then(res => res.json())
            .then(data => {
                setUseCases(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <LandingPageNav lang={lang} />
            
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-28">
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        {lang === 'fr' ? 'Cas d\'usage' : 'Use Cases'}
                    </h1>
                    <p className="text-lg text-slate-500">
                        {lang === 'fr' ? 'Découvrez comment STRAP résout les frictions opérationnelles.' : 'Discover how STRAP solves operational friction.'}
                    </p>
                </div>

                {/* Featured: documented client case + application in development */}
                <section className="grid lg:grid-cols-2 gap-6 mb-16" aria-label={lang === 'fr' ? 'Cas mis en avant' : 'Featured cases'}>
                    <article className="flex flex-col rounded-3xl bg-slate-900 text-white p-8">
                        <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]"><Factory size={14} /> {f.aperamTag}</div>
                        <h2 className="text-2xl font-extrabold tracking-tight mb-3">{f.aperamTitle}</h2>
                        <p className="text-slate-300 leading-relaxed mb-5">{f.aperamBody}</p>
                        <p className="rounded-2xl bg-[#FF6B00] p-5 font-bold leading-snug mb-6">{f.aperamResult}</p>
                        <button onClick={() => navigate('/discover#aperam')} className="mt-auto self-start inline-flex items-center gap-2 font-bold text-white hover:text-[#FF6B00] transition-colors">
                            {f.aperamLink} <ArrowRight size={17} />
                        </button>
                    </article>
                    <article className="flex flex-col rounded-3xl border border-slate-200 bg-slate-50 p-8">
                        <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#FF6B00]"><Wrench size={14} /> {f.maintTag}</div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">{f.maintTitle}</h2>
                        <p className="text-slate-600 leading-relaxed mb-5">{f.maintBody}</p>
                        <span className="self-start inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full mb-3">
                            <Clock size={13} /> {f.maintStatus}
                        </span>
                        <p className="text-sm text-slate-500 mb-6">{f.maintNote}</p>
                        <div className="mt-auto flex flex-wrap gap-4">
                            <button onClick={() => navigate('/discover#strap-maintenance')} className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-[#FF6B00] transition-colors">
                                {f.maintLink} <ArrowRight size={17} />
                            </button>
                            {MAINTENANCE_DEMO_PUBLIC && (
                                <button onClick={() => navigate('/strap-software/maintenance/demo')} className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-[#FF6B00]">
                                    {f.maintDemo}
                                </button>
                            )}
                        </div>
                    </article>
                </section>

                <h2 className="text-xl font-bold text-slate-900 mb-6">{f.others}</h2>
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>
                ) : useCases.filter(uc => {
                    let parsedContent: any = {};
                    try { parsedContent = JSON.parse(uc.content); } catch {}
                    const ucLang = parsedContent?.language || 'en';
                    return ucLang === lang;
                }).length === 0 ? (
                    <p className="text-slate-500">{lang === 'fr' ? 'Aucun cas d\'usage publié pour le moment.' : 'No use cases published yet.'}</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {useCases.filter(uc => {
                            let parsedContent: any = {};
                            try { parsedContent = JSON.parse(uc.content); } catch {}
                            const ucLang = parsedContent?.language || 'en';
                            return ucLang === lang;
                        }).map(uc => {
                            let parsedContent: any = {};
                            try {
                                parsedContent = JSON.parse(uc.content);
                            } catch {
                                // fallback for legacy plain text
                            }
                            
                            const mediaUrl = uc.video_url || uc.image_url || parsedContent?.thumbnail_url;
                            const isVideo = !!uc.video_url || (mediaUrl && mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i));

                            return (
                            <div key={uc.id} onClick={() => navigate(`/use-cases/${encodeURIComponent(uc.title.toLowerCase().replace(/ /g, '-'))}`)} 
                                className="group cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex flex-col overflow-hidden">
                                {mediaUrl ? (
                                    <div className="h-48 bg-slate-900 overflow-hidden relative">
                                        {isVideo ? (
                                            <video src={mediaUrl} autoPlay muted loop playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                                        ) : (
                                            <img src={mediaUrl} alt={uc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200" />
                                )}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#FF6B00] transition-colors">{uc.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                                        {parsedContent?.hook || uc.content}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                        <span className="text-xs font-semibold text-slate-400 uppercase">{uc.company_name || (lang === 'fr' ? 'Anonyme' : 'Anonymous')}</span>
                                        <span className="text-xs font-semibold text-[#FF6B00]">{uc.likes_count} {lang === 'fr' ? 'J\'aime' : 'Likes'}</span>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer lang={lang} />
        </div>
    );
}
