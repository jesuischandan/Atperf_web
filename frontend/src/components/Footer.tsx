import { useNavigate } from 'react-router-dom';
import { Linkedin, LogIn, LogOut, UserPlus } from 'lucide-react';

const TRANSLATIONS = {
    en: {
        sustainChange: "Let's sustain the change together!",
        pages: "Pages",
        social: "Social",
        staffPortal: "Staff Portal",
        logIn: "Log in",
        logOut: "Log out",
        signUp: "Sign up",
        home: "Home",
        services: "Services",
        software: "STRAP Software",
        useCases: "Use Cases",
        contact: "Contact",
        contactDetails: "Our contact details",
        terms: "Terms and Conditions",
        privacy: "Privacy Policy",
        copyright: `\u00a9 ${new Date().getFullYear()} Atperf Conseil \u00b7 All rights reserved`,
    },
    fr: {
        sustainChange: "Soutenons le changement ensemble !",
        pages: "Pages",
        social: "R\u00e9seaux Sociaux",
        staffPortal: "Portail Interne",
        logIn: "Connexion",
        logOut: "Déconnexion",
        signUp: "S'inscrire",
        home: "Accueil",
        services: "Services",
        software: "STRAP Software",
        useCases: "Cas d'usage",
        contact: "Contact",
        contactDetails: "Nos coordonn\u00e9es",
        terms: "Conditions g\u00e9n\u00e9rales",
        privacy: "Politique de confidentialit\u00e9",
        copyright: `\u00a9 ${new Date().getFullYear()} Atperf Conseil \u00b7 Tous droits r\u00e9serv\u00e9s`,
    }
};

export default function Footer({ lang }: { lang: 'en' | 'fr' }) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const navigate = useNavigate();

    return (
        <footer className="bg-white border-t border-slate-100 pt-16 pb-8 px-6 mt-auto">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 mb-16">
                    {/* Column 1: Logo, Tagline & Pages */}
                    <div className="flex flex-col items-start gap-8 md:justify-self-start">
                        <div>
                            <img
                                src="/Logo_Atperf_transpart.png"
                                alt="Atperf"
                                className="h-10 w-auto object-contain mb-5 cursor-pointer opacity-90"
                                onClick={() => navigate('/')}
                            />
                            <p className="text-slate-500 font-medium leading-relaxed max-w-[200px]">{t.sustainChange}</p>
                        </div>
                        <nav className="flex flex-col gap-3 font-medium">
                            <a href="/" className="text-slate-500 hover:text-[#FF6B00] transition-colors">{t.home}</a>
                            <a href="/#tools" className="text-slate-500 hover:text-[#FF6B00] transition-colors">{t.services}</a>
                            <a href="/strap-software/maintenance" className="text-slate-500 hover:text-[#FF6B00] transition-colors">{t.software}</a>
                            <a href="/use-cases" className="text-slate-500 hover:text-[#FF6B00] transition-colors">{t.useCases}</a>
                            <a href="/contact" className="text-slate-500 hover:text-[#FF6B00] transition-colors">{t.contact}</a>
                        </nav>
                    </div>

                    {/* Column 2: Contact Info & Social */}
                    <div className="flex flex-col items-start gap-8 md:justify-self-center">
                        <div className="flex flex-col items-start gap-4">
                            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-sm">{t.contactDetails}</h4>
                            <div className="flex flex-col gap-2 font-medium text-slate-500">
                                <a href="tel:+33661409529" className="hover:text-[#FF6B00] transition-colors">+33 6 61 40 95 29</a>
                                <a href="mailto:r.rahbi@atperf.com" className="hover:text-[#FF6B00] transition-colors">r.rahbi@atperf.com</a>
                            </div>
                        </div>

                        <div className="flex flex-col items-start gap-4">
                            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-sm">{t.social}</h4>
                            <a href="https://linkedin.com/company/atperf-conseil" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#0077b5] flex items-center gap-2 font-medium transition-colors">
                                <Linkedin size={20} /> LinkedIn
                            </a>
                        </div>
                    </div>

                    {/* Column 3: Staff Portal */}
                    <div className="flex flex-col items-start gap-4 md:justify-self-end">
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-sm">{t.staffPortal}</h4>
                        <div className="flex flex-col gap-3 font-medium">
                            {localStorage.getItem('proextract_staff') ? (() => {
                                try {
                                    const staff = JSON.parse(localStorage.getItem('proextract_staff') || '{}');
                                    return (
                                        <>
                                            <button onClick={() => navigate('/admin')} className="text-slate-500 hover:text-[#FF6B00] flex items-center gap-2 transition-colors">
                                                <LogIn size={18} /> Hi {staff.first_name}
                                            </button>
                                            <button 
                                                onClick={() => { 
                                                    localStorage.removeItem('proextract_staff'); 
                                                    navigate('/'); 
                                                }} 
                                                className="text-slate-500 hover:text-[#FF6B00] flex items-center gap-2 transition-colors"
                                            >
                                                <LogOut size={18} /> {t.logOut}
                                            </button>
                                        </>
                                    );
                                } catch (e) {
                                    return null;
                                }
                            })() : (
                                <>
                                    <button onClick={() => navigate('/staff/login')} className="text-slate-500 hover:text-[#FF6B00] flex items-center gap-2 transition-colors">
                                        <LogIn size={18} /> {t.logIn}
                                    </button>
                                    <button onClick={() => navigate('/staff/register')} className="text-slate-500 hover:text-[#FF6B00] flex items-center gap-2 transition-colors">
                                        <UserPlus size={18} /> {t.signUp}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-slate-400 font-medium">{t.copyright}</p>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 font-medium">
                        <button onClick={() => navigate('/terms')} className="hover:text-slate-700 transition-colors">{t.terms}</button>
                        <button onClick={() => navigate('/privacy')} className="hover:text-slate-700 transition-colors">{t.privacy}</button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
