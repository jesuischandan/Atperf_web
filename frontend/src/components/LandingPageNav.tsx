import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { logout as endSession } from '../utils/apiClient';

const T = {
    en: {
        navHome: 'Home',
        navService: 'Service',
        navSoftware: 'STRAP Software',
        navUseCases: 'Use Cases',
        navContact: 'Contact',
        hi: 'Hi',
        logOut: 'Log out',
        logIn: 'Log in',
        signUp: 'Sign up',
        admin: 'Admin',
        tools: 'StrAP Tools',
    },
    fr: {
        navHome: 'Accueil',
        navService: 'Services',
        navSoftware: 'STRAP Software',
        navUseCases: 'Cas d’usage',
        navContact: 'Contact',
        hi: 'Bonjour',
        logOut: 'Déconnexion',
        logIn: 'Connexion',
        signUp: 'S’inscrire',
        admin: 'Admin',
        tools: 'StrAP Tools',
    }
};

export default function LandingPageNav({ lang, onLangChange }: { lang: 'en' | 'fr', onLangChange?: (l: 'en' | 'fr') => void }) {
    const navigate = useNavigate();
    const t = T[lang] || T.en;
    const [user, setUser] = useState<any>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        try {
            const u = localStorage.getItem('proextract_user');
            if (u) setUser(JSON.parse(u));
        } catch { /* ignore */ }

        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        setScrolled(window.scrollY > 20);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const logout = () => {
        endSession('user');
        setUser(null);
    };

    const switchLang = (l: 'en' | 'fr') => {
        localStorage.setItem('strap_lang', l);
        const fav = document.getElementById('favicon') as HTMLLinkElement | null;
        if (fav) fav.href = l === 'fr' ? '/favicon_fr.png' : '/favicon_en.png';
        if (onLangChange) onLangChange(l);
        else {
            // For other pages, we can just reload to handle translation updates across the tree
            window.location.reload();
        }
    };

    return (
        <>
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
                    <img 
                        src="/Logo_Atperf_transpart.png" 
                        alt="Atperf" 
                        className="h-9 w-auto object-contain shrink-0 cursor-pointer" 
                        onClick={() => {
                            if (window.location.pathname === '/') {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                                navigate('/');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }} 
                    />

                    <div className="hidden md:flex items-center gap-1 text-sm text-slate-500">
                        {[
                            { label: t.navHome, href: '/' },
                            { label: t.navService, href: '/#tools' },
                            { label: t.navSoftware, href: '/strap-software/maintenance' },
                            { label: t.navUseCases, href: '/use-cases' },
                            { label: t.navContact, href: '/contact' },
                        ].map(({ label, href }) => (
                            <a key={label} href={href} className="px-4 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all font-medium">{label}</a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-bold">
                            {(['en', 'fr'] as const).map(l => (
                                <button key={l} onClick={() => switchLang(l)}
                                    className={`px-2.5 py-1 rounded-md uppercase transition-all ${lang === l ? 'bg-white shadow-sm text-[#FF6B00]' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className="hidden md:flex items-center gap-2">
                            {user ? (
                                <>
                                    <button onClick={() => setIsProfileOpen(true)}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100">
                                        {t.hi}, {user.first_name}
                                    </button>
                                    <button onClick={() => navigate('/dashboard')}
                                        className="text-sm font-medium px-4 py-2 rounded-lg bg-[#FF6B00] text-white hover:bg-[#E66000] transition-all">
                                        {t.tools}
                                    </button>
                                    {(user.role === 'admin' || user.role === 'super_admin') && (
                                        <button onClick={() => navigate('/admin')}
                                            className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all">
                                            {t.admin}
                                        </button>
                                    )}
                                    <button onClick={logout}
                                        className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                                        {t.logOut}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => navigate('/login')}
                                        className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                                        {t.logIn}
                                    </button>
                                    <button onClick={() => navigate('/register')}
                                        className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-all">
                                        {t.signUp}
                                    </button>
                                </>
                            )}
                        </div>

                        <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={22} className="text-slate-600" />
                        </button>
                    </div>
                </div>
            </nav>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative w-4/5 max-w-xs ml-auto bg-white h-full shadow-2xl flex flex-col py-6 px-6">
                        <div className="flex items-center justify-between mb-8">
                            <img 
                                src="/Logo_Atperf_transpart.png" 
                                alt="Atperf" 
                                className="h-8 w-auto cursor-pointer" 
                                onClick={() => {
                                    if (window.location.pathname === '/') {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    } else {
                                        navigate('/');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                    setIsMobileMenuOpen(false);
                                }} 
                            />
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={22} className="text-slate-600" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            {[
                                { label: t.navHome, href: '/' },
                                { label: t.navService, href: '/#tools' },
                                { label: t.navSoftware, href: '/strap-software/maintenance' },
                                { label: t.navUseCases, href: '/use-cases' },
                                { label: t.navContact, href: '/contact' },
                            ].map(({ label, href }) => (
                                <a key={label} href={href} onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-base font-medium text-slate-700 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                                    {label}
                                </a>
                            ))}
                            <hr className="my-2 border-slate-100" />
                            {user ? (
                                <>
                                    <button onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }}
                                        className="text-base font-medium text-slate-700 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-left">
                                        {t.hi}, {user.first_name}
                                    </button>
                                    <button onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                                        className="mt-2 w-full py-3 rounded-xl bg-[#FF6B00] text-white font-semibold hover:bg-[#E66000] transition-all text-center">
                                        {t.tools}
                                    </button>
                                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                        className="mt-2 w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-center">
                                        {t.logOut}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                                        className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all text-center">
                                        {t.logIn}
                                    </button>
                                    <button onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                                        className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all text-center shadow-lg">
                                        {t.signUp}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isProfileOpen && user?.user_id && (
                <ProfileModal
                    user={user}
                    onClose={() => setIsProfileOpen(false)}
                    onUpdate={(u) => { setUser(u); localStorage.setItem('proextract_user', JSON.stringify(u)); }}
                />
            )}
        </>
    );
}
