import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API_URL from '../utils/apiUrl';
import Footer from './Footer';
import LandingPageNav from './LandingPageNav';
import { Heart, Share2, MessageCircle, AlertCircle, TrendingUp, Cpu, Lightbulb, CheckCircle2, X, Target, Quote, BarChart, Layers, Award, Briefcase } from 'lucide-react';

function AutoPlayVideo({ src, poster }: { src: string; poster?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = 0.1;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (videoRef.current) {
                    if (entry.isIntersecting) {
                        videoRef.current.play().catch(err => {
                            console.log('Autoplay with sound prevented by browser:', err);
                            if (videoRef.current) {
                                videoRef.current.muted = true;
                                videoRef.current.play().catch(e => console.log('Muted autoplay also prevented:', e));
                            }
                        });
                    } else {
                        videoRef.current.pause();
                    }
                }
            },
            { threshold: 0.5 }
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <video
            ref={videoRef}
            src={src}
            controls
            autoPlay
            preload="metadata"
            className="w-full max-h-[600px] object-cover rounded-xl bg-slate-900"
            poster={poster}
        >
            Your browser does not support HTML5 video.
        </video>
    );
}

export default function UseCaseDetailPage() {
    const { id } = useParams();
    const [useCase, setUseCase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [lang] = useState<'en' | 'fr'>(() => (localStorage.getItem('strap_lang') === 'fr' ? 'fr' : 'en'));
    const [hasLiked, setHasLiked] = useState(false);
    
    const isStaff = !!localStorage.getItem('proextract_staff');

    useEffect(() => {
        fetch(`${API_URL}/use-cases/${encodeURIComponent(id || '')}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => {
                setUseCase(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    const handleLike = () => {
        if (hasLiked || !useCase) return;
        fetch(`${API_URL}/use-cases/${encodeURIComponent(id || '')}/like`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                setUseCase({ ...useCase, likes_count: data.likes_count });
                setHasLiked(true);
            });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert(lang === 'fr' ? 'Lien copié dans le presse-papiers !' : 'Link copied to clipboard!');
    };

    const handlePostComment = () => {
        if (!commentText.trim()) return;
        let author = "Anonymous Viewer";
        const staff = localStorage.getItem('proextract_staff');
        const user = localStorage.getItem('proextract_user');
        if (staff) {
            const parsed = JSON.parse(staff);
            author = `${parsed.first_name} ${parsed.last_name}`;
        } else if (user) {
            const parsed = JSON.parse(user);
            author = `${parsed.first_name} ${parsed.last_name}`;
        }

        fetch(`${API_URL}/use-cases/${encodeURIComponent(id || '')}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author_name: author, content: commentText })
        })
        .then(res => res.json())
        .then(comment => {
            setUseCase({ ...useCase, comments: [...useCase.comments, comment] });
            setCommentText('');
        });
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm(lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce commentaire?' : 'Are you sure you want to delete this comment?')) return;
        try {
            const res = await fetch(`${API_URL}/use-cases/${encodeURIComponent(id || '')}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
            if (res.ok) {
                setUseCase({ ...useCase, comments: useCase.comments.filter((c: any) => c.id !== commentId) });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleReplyComment = async (commentId: string) => {
        const text = replyText[commentId];
        if (!text || !text.trim()) return;
        try {
            const res = await fetch(`${API_URL}/use-cases/${encodeURIComponent(id || '')}/comments/${encodeURIComponent(commentId)}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply_content: text })
            });
            if (res.ok) {
                const updatedComment = await res.json();
                setUseCase({
                    ...useCase,
                    comments: useCase.comments.map((c: any) => c.id === commentId ? updatedComment : c)
                });
                setReplyText(prev => ({ ...prev, [commentId]: '' }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <LandingPageNav lang={lang} />
                <div className="flex-1 flex justify-center items-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>
            </div>
        );
    }

    if (!useCase) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <LandingPageNav lang={lang} />
                <div className="flex-1 flex justify-center items-center"><p className="text-slate-500">Use case not found.</p></div>
                <Footer lang={lang} />
            </div>
        );
    }

    const isVideo = !!useCase.video_url || (useCase.image_url && useCase.image_url.match(/\.(mp4|webm|ogg|mov)$/i));
    const mainMediaUrl = useCase.video_url || useCase.image_url;

    let parsedContent: any = null;
    try {
        const p = JSON.parse(useCase.content);
        if (p && typeof p === 'object' && 'hook' in p) {
            parsedContent = p;
        }
    } catch {
        // legacy plain text fallback
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
            <LandingPageNav lang={lang} />
            
            {/* Header Hero */}
            <div className="bg-white border-b border-slate-200 pt-32 pb-12 w-full">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {parsedContent?.industry && (
                            <div className="text-sm font-bold tracking-widest text-indigo-500 uppercase">
                                {parsedContent.industry} {lang === 'fr' ? 'Étude de Cas' : 'Case Study'}
                            </div>
                        )}
                        {parsedContent?.client_segment && (
                            <div className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">
                                {parsedContent.client_segment}
                            </div>
                        )}
                        {parsedContent?.strategic_objective && (
                            <div className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md uppercase tracking-wider">
                                {parsedContent.strategic_objective}
                            </div>
                        )}
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                        {useCase.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-8">
                        <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-slate-800 font-bold border border-slate-200">
                            <Briefcase size={16} className="text-slate-500" />
                            {useCase.company_name || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            {lang === 'fr' ? 'Publié par' : 'Published by'} <span className="text-slate-900 font-bold border-b border-slate-300">{useCase.publisher_name || 'Admin'}</span>
                        </span>
                        <span>{new Date(useCase.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {parsedContent?.technologies && parsedContent.technologies.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Cpu size={16} className="text-slate-400 mr-1" />
                                {parsedContent.technologies.map((t: string) => (
                                    <span key={t} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100/50">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                        {parsedContent?.proprietary_frameworks && parsedContent.proprietary_frameworks.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Layers size={16} className="text-indigo-400 mr-1" />
                                {parsedContent.proprietary_frameworks.map((fw: string) => (
                                    <span key={fw} className="px-2.5 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm">
                                        {fw}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">

                {/* Main Content Area */}
                {parsedContent ? (
                    <div className="space-y-16">
                        
                        {/* 1. Executive Summary (The Hook) */}
                        {parsedContent.hook && (
                            <div className="text-xl md:text-2xl font-light text-slate-700 leading-relaxed border-l-4 border-indigo-500 pl-6 bg-indigo-50/30 py-4 rounded-r-2xl">
                                {parsedContent.hook}
                            </div>
                        )}

                        {/* Executive Hero Infographic */}
                        {parsedContent.infographic_url && (
                            <figure className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-3">
                                <img src={parsedContent.infographic_url} alt="Executive Summary Infographic" className="w-full max-h-[700px] object-contain rounded-xl bg-slate-50" />
                                <figcaption className="text-center text-sm font-bold text-slate-500 mt-4 pb-2 uppercase tracking-wide">
                                    {lang === 'fr' ? 'Aperçu général du projet' : 'Project High-Level Overview'}
                                </figcaption>
                            </figure>
                        )}

                        {/* 2. The Context (The Challenge) */}
                        {(parsedContent.problem_checklist?.length > 0 || parsedContent.problem_text) && (
                            <section>
                                <h2 className="text-2xl font-black flex items-center gap-3 mb-6 text-slate-900">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 text-rose-600"><AlertCircle size={20} /></span>
                                    {lang === 'fr' ? 'Le Contexte' : 'The Context'}
                                </h2>
                                <div className="bg-white border text-base border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                                    {parsedContent.problem_checklist?.length > 0 && (
                                        <ul className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {parsedContent.problem_checklist.map((p: string) => (
                                                <li key={p} className="flex items-start gap-3">
                                                    <X size={18} className="text-rose-500 mt-1 shrink-0" />
                                                    <span className="font-medium text-slate-700">{p}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {parsedContent.problem_text && (
                                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                            {parsedContent.problem_text}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Why ATPerf Differentiator */}
                        {parsedContent.why_atperf && (
                            <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Award size={120} />
                                </div>
                                <h3 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2 relative z-10">
                                    <Award size={20} /> {lang === 'fr' ? 'Pourquoi ATPerf ?' : 'Why ATPerf?'}
                                </h3>
                                <p className="text-slate-300 leading-relaxed relative z-10 text-lg font-medium">
                                    {parsedContent.why_atperf}
                                </p>
                            </div>
                        )}

                        {/* 3. The Intervention (The Approach) */}
                        {parsedContent.methodology && (
                            <section>
                                <h2 className="text-2xl font-black flex items-center gap-3 mb-6 text-slate-900">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600"><Lightbulb size={20} /></span>
                                    {lang === 'fr' ? 'L\'Intervention' : 'The Intervention'}
                                </h2>
                                <div className="prose prose-lg prose-slate max-w-none bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm whitespace-pre-wrap leading-relaxed">
                                    {parsedContent.methodology}
                                </div>
                            </section>
                        )}

                        {/* Main Media / Exhibit Preview */}
                        {mainMediaUrl && (
                            <figure className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white p-3">
                                {isVideo ? (
                                    <AutoPlayVideo src={mainMediaUrl} poster={parsedContent.thumbnail_url || undefined} />
                                ) : (
                                    <img src={mainMediaUrl} alt={useCase.title} className="w-full max-h-[600px] object-contain rounded-xl bg-slate-50" />
                                )}
                                {(parsedContent.exhibit_title || parsedContent.media_caption) && (
                                    <figcaption className="text-center mt-4 pb-2">
                                        {parsedContent.exhibit_title && <div className="font-bold text-slate-800 text-sm uppercase tracking-wide">{parsedContent.exhibit_title}</div>}
                                        {parsedContent.media_caption && <div className="text-sm font-medium text-slate-500 mt-1">{parsedContent.media_caption}</div>}
                                    </figcaption>
                                )}
                            </figure>
                        )}
                        {/* Fallback to Thumbnail if no main media but thumbnail exists */}
                        {!mainMediaUrl && parsedContent.thumbnail_url && (
                             <figure className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white p-3">
                                 <img src={parsedContent.thumbnail_url} alt="Thumbnail" className="w-full max-h-[400px] object-contain rounded-xl bg-slate-50" />
                             </figure>
                        )}

                        {/* 4. The Impact (Data & Results) */}
                        {parsedContent.metrics && parsedContent.metrics.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black flex items-center gap-3 mb-6 text-slate-900">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600"><TrendingUp size={20} /></span>
                                    {lang === 'fr' ? 'L\'Impact' : 'The Impact'}
                                </h2>

                                {(parsedContent.key_achievement || parsedContent.monetized_impact) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {parsedContent.key_achievement && (
                                            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col justify-center">
                                                <div className="text-emerald-800 font-black text-2xl mb-1">{parsedContent.key_achievement}</div>
                                                <div className="text-emerald-600/80 text-xs font-bold uppercase tracking-wider">{lang === 'fr' ? 'Réalisation Clé' : 'Key Achievement'}</div>
                                            </div>
                                        )}
                                        {parsedContent.monetized_impact && (
                                            <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl flex flex-col justify-center">
                                                <div className="text-indigo-800 font-black text-2xl mb-1">{parsedContent.monetized_impact}</div>
                                                <div className="text-indigo-600/80 text-xs font-bold uppercase tracking-wider">{lang === 'fr' ? 'Impact Monétisé' : 'Monetized Impact'}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {parsedContent.contextual_benchmarking && (
                                    <div className="mb-6 p-5 border-l-4 border-amber-400 bg-amber-50 rounded-r-2xl">
                                        <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2"><BarChart size={14}/> {lang === 'fr' ? 'Analyse Comparative Contextuelle' : 'Contextual Benchmarking'}</div>
                                        <p className="text-amber-900 font-medium">{parsedContent.contextual_benchmarking}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {parsedContent.metrics.map((m: any) => (
                                        <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-slate-900 text-lg">{m.name}</h4>
                                                    {m.value_type && (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md tracking-wider">
                                                            {m.value_type}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-6 text-sm font-medium text-slate-500 mb-3">
                                                    <div><span className="text-xs text-slate-400 uppercase block mb-0.5">{lang === 'fr' ? 'Avant' : 'Before'}</span> <span className="text-slate-700">{m.before || '—'}</span></div>
                                                    <div><span className="text-xs text-slate-400 uppercase block mb-0.5">{lang === 'fr' ? 'Après' : 'After'}</span> <span className="text-slate-900 font-bold">{m.after || '—'}</span></div>
                                                    {m.estimated_annualized_savings && (
                                                        <div><span className="text-xs text-slate-400 uppercase block mb-0.5">{lang === 'fr' ? 'Écon. Est.' : 'Est. Savings'}</span> <span className="text-emerald-600 font-bold">{m.estimated_annualized_savings}</span></div>
                                                    )}
                                                </div>
                                                {m.so_what && (
                                                    <div className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                        <span className="font-bold text-slate-700 not-italic mr-2">{lang === 'fr' ? 'Et Alors ?' : 'So What?'}</span>
                                                        {m.so_what}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end justify-center min-w-[120px]">
                                                <span className={`px-4 py-2 rounded-xl text-lg font-black ${((m.improvement || '').startsWith('+') || parseFloat(m.improvement)>0) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {m.improvement || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Testimonial */}
                        {parsedContent.testimonial_quote && (
                            <section className="py-8">
                                <div className="max-w-3xl mx-auto text-center">
                                    <Quote size={40} className="mx-auto text-indigo-200 mb-6" />
                                    <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-snug mb-6">
                                        {parsedContent.testimonial_quote}
                                    </p>
                                    {parsedContent.testimonial_author && (
                                        <div className="font-bold text-slate-900 uppercase tracking-wide text-sm">
                                            {parsedContent.testimonial_author}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* 5. Pro-Tips / Lessons */}
                        {parsedContent.pro_tips && (
                            <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                                    <CheckCircle2 size={200} />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3 relative z-10 text-indigo-100">
                                    <Target className="text-indigo-400" /> {lang === 'fr' ? 'Conseils de Pro de la Communauté' : 'Community Pro-Tips'}
                                </h2>
                                <p className="text-indigo-50 text-base md:text-lg leading-relaxed relative z-10 opacity-90 italic">
                                    "{parsedContent.pro_tips}"
                                </p>
                            </section>
                        )}
                        
                    </div>
                ) : (
                    /* Legacy Content Rendering */
                    <div>
                        {mainMediaUrl && (
                            <div className="mb-12 rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-white p-2">
                                {isVideo ? (
                                    <AutoPlayVideo src={mainMediaUrl} />
                                ) : (
                                    <img src={mainMediaUrl} alt={useCase.title} className="w-full max-h-[600px] object-contain rounded-xl" />
                                )}
                            </div>
                        )}
                        <div className="prose prose-lg prose-slate max-w-none bg-white rounded-2xl p-8 border border-slate-200 shadow-sm whitespace-pre-wrap">
                            {useCase.content}
                        </div>
                    </div>
                )}

                {/* Interactions */}
                <div className="flex items-center gap-2 sm:gap-4 py-8 border-t border-slate-200 mt-16">
                    <button onClick={handleLike} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl transition-all font-bold shadow-sm ${hasLiked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}>
                        <Heart size={20} className={hasLiked ? "fill-current" : ""} /> <span>{useCase.likes_count}</span> <span className="hidden sm:inline">{lang === 'fr' ? 'J\'aime' : 'Likes'}</span>
                    </button>
                    <button onClick={handleShare} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all font-bold shadow-sm">
                        <Share2 size={20} /> <span className="hidden sm:inline">{lang === 'fr' ? 'Partager' : 'Share'}</span>
                    </button>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-2 text-slate-500 font-bold ml-auto">
                        <MessageCircle size={20} /> <span className="text-slate-700">{useCase.comments?.length || 0}</span> <span className="hidden sm:inline">{lang === 'fr' ? 'Commentaires' : 'Comments'}</span>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-2xl font-black mb-8 text-slate-900">{lang === 'fr' ? 'Commentaires' : 'Discussion'}</h3>
                    
                    <div className="mb-10 flex flex-col gap-4">
                        <textarea 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={lang === 'fr' ? 'Qu\'en pensez-vous ?' : 'What are your thoughts on this approach?'}
                            className="w-full p-5 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none min-h-[120px] bg-slate-50 placeholder:text-slate-400 text-base resize-none"
                        />
                        <button onClick={handlePostComment} className="self-end px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all">
                            {lang === 'fr' ? 'Publier' : 'Post Comment'}
                        </button>
                    </div>

                    <div className="flex flex-col gap-5">
                        {useCase.comments && useCase.comments.map((c: any) => (
                            <div key={c.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-extrabold text-slate-900">{c.author_name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{new Date(c.created_at).toLocaleString()}</span>
                                        {isStaff && (
                                            <button onClick={() => handleDeleteComment(c.id)} className="text-rose-500 hover:text-rose-600 text-sm font-bold transition-colors">
                                                {lang === 'fr' ? 'Supprimer' : 'Delete'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                                
                                {c.author_reply ? (
                                    <div className="mt-4 pt-4 border-t border-slate-200 bg-indigo-50/50 p-4 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-indigo-900 flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px]">✓</div> 
                                                {useCase.publisher_name || 'Author'}
                                            </span>
                                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{c.author_replied_at ? new Date(c.author_replied_at).toLocaleString() : ''}</span>
                                        </div>
                                        <p className="text-indigo-900/80 whitespace-pre-wrap text-sm leading-relaxed">{c.author_reply}</p>
                                    </div>
                                ) : isStaff ? (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <div className="flex gap-2 relative">
                                            <input 
                                                type="text" 
                                                value={replyText[c.id] || ''} 
                                                onChange={(e) => setReplyText({ ...replyText, [c.id]: e.target.value })}
                                                placeholder={lang === 'fr' ? 'Répondre...' : 'Reply to comment...'}
                                                className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <button onClick={() => handleReplyComment(c.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">
                                                {lang === 'fr' ? 'Envoyer' : 'Reply'}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                        {(!useCase.comments || useCase.comments.length === 0) && (
                            <p className="text-slate-500 text-center py-8 font-medium">{lang === 'fr' ? 'Aucun commentaire. Soyez le premier à lancer la discussion !' : 'No comments yet. Be the first to start the discussion!'}</p>
                        )}
                    </div>
                </div>

            </main>

            <Footer lang={lang} />
        </div>
    );
}
