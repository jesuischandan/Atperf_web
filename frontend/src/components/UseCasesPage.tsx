import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../utils/apiUrl';
import Footer from './Footer';
import LandingPageNav from './LandingPageNav'; // We will extract the nav to keep it DRY, or copy it.

export default function UseCasesPage() {
    const [useCases, setUseCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lang] = useState<'en' | 'fr'>(() => (localStorage.getItem('strap_lang') === 'fr' ? 'fr' : 'en'));
    const navigate = useNavigate();

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
                        {lang === 'fr' ? 'Découvrez comment StrAP résout les frictions opérationnelles.' : 'Discover how StrAP solves operational friction.'}
                    </p>
                </div>

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
