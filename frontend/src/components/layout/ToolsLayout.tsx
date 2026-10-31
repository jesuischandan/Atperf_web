import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, LogOut, Menu, UserRound, X } from 'lucide-react';
import ProfileModal from '../ProfileModal';
import { ADMIN_NAV, TOOLS_NAV, isActive, type NavContext, type NavItem } from './toolsNav';
import { STAFF_KEY, USER_KEY, logout } from '../../utils/apiClient';
import { useLang } from '../../utils/useLang';

/* ─────────────────────────────────────────────────────────────
   Shared shell for the logged-in StrAP tools: sidebar on desktop
   (collapsible to icons), top bar + drawer on mobile.
───────────────────────────────────────────────────────────── */

const COLLAPSE_KEY = 'strap_sidebar_collapsed';

const T = {
    en: { section: 'StrAP Tools', collapse: 'Collapse sidebar', expand: 'Expand sidebar', open: 'Open menu', close: 'Close menu', profile: 'My profile', staff: 'Staff', logOut: 'Log out', logIn: 'Log in', site: 'Back to the website' },
    fr: { section: 'StrAP Tools', collapse: 'Réduire le menu', expand: 'Déplier le menu', open: 'Ouvrir le menu', close: 'Fermer le menu', profile: 'Mon profil', staff: 'Équipe', logOut: 'Déconnexion', logIn: 'Connexion', site: 'Retour au site' },
};

function readJson<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : null;
    } catch {
        return null;
    }
}

type StoredUser = { user_id?: string; first_name?: string; last_name?: string; email?: string; role?: string };
type StoredStaff = { staff_id?: string; first_name?: string; internal_role?: string };

export default function ToolsLayout() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [lang, setLang] = useLang();
    const t = T[lang];

    const [user, setUser] = useState<StoredUser | null>(() => readJson<StoredUser>(USER_KEY));
    const [staff] = useState<StoredStaff | null>(() => readJson<StoredStaff>(STAFF_KEY));
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Close the mobile drawer whenever the route changes.
    useEffect(() => { setDrawerOpen(false); }, [pathname]);

    const toggleCollapsed = () => {
        setCollapsed(c => {
            try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* ignore */ }
            return !c;
        });
    };

    const ctx: NavContext = {
        isUser: !!user,
        isStaff: !!staff,
        isExternalAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    };
    const items = TOOLS_NAV.filter(i => !i.visible || i.visible(ctx));
    const showAdmin = !ADMIN_NAV.visible || ADMIN_NAV.visible(ctx);
    const current = [...TOOLS_NAV, ADMIN_NAV].find(i => isActive(i, pathname));

    const handleLogout = async () => {
        await logout(user && staff ? 'all' : staff ? 'staff' : 'user');
        navigate('/');
    };

    const displayName = user?.first_name || staff?.first_name || '';

    const renderItem = (item: NavItem, compact: boolean) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
            <Link
                key={item.key}
                to={item.path}
                title={compact ? item.label[lang] : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-xl text-sm font-semibold transition-colors ${compact ? 'justify-center h-11 w-11 mx-auto' : 'px-3 py-2.5'} ${active ? 'bg-[#FF6B00]/10 text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
                <Icon size={19} className="shrink-0" />
                {!compact && (
                    <>
                        <span className="flex-1 min-w-0">
                            <span className="block truncate">{item.label[lang]}</span>
                            {item.badge && (
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">{item.badge[lang]}</span>
                            )}
                        </span>
                    </>
                )}
            </Link>
        );
    };

    const renderNav = (compact: boolean) => (
        <div className="flex flex-col h-full">
            {/* Logo + collapse */}
            <div className={`flex items-center h-16 shrink-0 border-b border-slate-100 ${compact ? 'justify-center' : 'justify-between px-4'}`}>
                {!compact && (
                    <Link to="/" title={t.site}>
                        <img src="/Logo_Atperf_transpart.png" alt="Atperf" className="h-8 w-auto" />
                    </Link>
                )}
                <button onClick={toggleCollapsed} className="hidden lg:inline-flex p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    aria-label={compact ? t.expand : t.collapse} title={compact ? t.expand : t.collapse}>
                    {compact ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                </button>
            </div>

            {/* Tools */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1" aria-label={t.section}>
                {!compact && <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{t.section}</p>}
                {items.map(i => renderItem(i, compact))}
            </nav>

            {/* Account */}
            <div className="border-t border-slate-100 p-3 space-y-1">
                {showAdmin && renderItem(ADMIN_NAV, compact)}

                <div className={`flex ${compact ? 'flex-col items-center gap-1' : 'items-center justify-between px-3'} py-2`}>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-bold" role="group" aria-label="Language">
                        {(['en', 'fr'] as const).map(l => (
                            <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                                className={`px-2 py-1 rounded-md uppercase ${lang === l ? 'bg-white shadow-sm text-[#FF6B00]' : 'text-slate-500 hover:text-slate-700'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {displayName ? (
                    <>
                        <button
                            onClick={() => user?.user_id && setProfileOpen(true)}
                            disabled={!user?.user_id}
                            title={compact ? t.profile : undefined}
                            className={`w-full flex items-center gap-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:hover:bg-transparent disabled:cursor-default ${compact ? 'justify-center h-11' : 'px-3 py-2.5'}`}
                        >
                            <span className="w-7 h-7 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                            {!compact && (
                                <span className="flex-1 min-w-0 text-left">
                                    <span className="block truncate">{displayName}</span>
                                    {!user && staff && <span className="block text-xs font-medium text-slate-400">{t.staff}</span>}
                                </span>
                            )}
                        </button>
                        <button onClick={handleLogout} title={compact ? t.logOut : undefined}
                            className={`w-full flex items-center gap-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${compact ? 'justify-center h-11' : 'px-3 py-2.5'}`}>
                            <LogOut size={18} className="shrink-0" /> {!compact && t.logOut}
                        </button>
                    </>
                ) : (
                    <Link to={`/login?redirect=${encodeURIComponent(pathname)}`}
                        className={`flex items-center gap-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 ${compact ? 'justify-center h-11' : 'px-3 py-2.5'}`}>
                        <UserRound size={18} className="shrink-0" /> {!compact && t.logIn}
                    </Link>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            {/* Desktop sidebar */}
            <aside className={`hidden lg:block fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-[width] duration-200 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
                {renderNav(collapsed)}
            </aside>

            {/* Mobile top bar */}
            <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 bg-white border-b border-slate-200">
                <button onClick={() => setDrawerOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100" aria-label={t.open}>
                    <Menu size={22} className="text-slate-700" />
                </button>
                <img src="/Logo_Atperf_transpart.png" alt="Atperf" className="h-7 w-auto" />
                {current && <span className="ml-auto text-sm font-semibold text-slate-600 truncate">{current.label[lang]}</span>}
            </header>

            {/* Mobile drawer */}
            {drawerOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl">
                        <button onClick={() => setDrawerOpen(false)} className="absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-100 z-10" aria-label={t.close}>
                            <X size={20} className="text-slate-600" />
                        </button>
                        {renderNav(false)}
                    </div>
                </div>
            )}

            {/* Page */}
            <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
                <Outlet />
            </div>

            {profileOpen && user?.user_id && (
                <ProfileModal
                    user={user as never}
                    onClose={() => setProfileOpen(false)}
                    onUpdate={u => { setUser(u); localStorage.setItem(USER_KEY, JSON.stringify(u)); }}
                />
            )}
        </div>
    );
}
