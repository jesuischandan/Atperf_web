import { Brain, Bot, LayoutDashboard, Navigation, ShieldCheck, Wrench, type LucideIcon } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   StrAP tools sidebar entries. Adding a tool = adding one entry here.
───────────────────────────────────────────────────────────── */

export interface NavContext {
    isUser: boolean;          // external user session (tools need it)
    isStaff: boolean;         // internal staff session
    isExternalAdmin: boolean;
}

export interface NavItem {
    key: string;
    path: string;
    icon: LucideIcon;
    label: { en: string; fr: string };
    /** Extra paths that should highlight this entry. */
    match?: string[];
    badge?: { en: string; fr: string };
    visible?: (ctx: NavContext) => boolean;
}

export const TOOLS_NAV: NavItem[] = [
    {
        key: 'dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        label: { en: 'Dashboard', fr: 'Tableau de bord' },
    },
    {
        key: 'diagnostic',
        path: '/submit',
        icon: Brain,
        label: { en: 'StrAP Perf Diagnostic', fr: 'Diagnostic StrAP Perf' },
    },
    {
        key: 'radar',
        path: '/decision-radar',
        icon: Navigation,
        label: { en: 'Decision Radar', fr: 'Decision Radar' },
    },
    {
        key: 'strapilot',
        path: '/tool/strapilot/app',
        icon: Bot,
        label: { en: 'StrAPilot', fr: 'StrAPilot' },
    },
    {
        key: 'maintenance',
        path: '/tool/strap-maintenance',
        icon: Wrench,
        label: { en: 'STRAP Maintenance', fr: 'STRAP Maintenance' },
        badge: { en: 'Prototype', fr: 'Prototype' },
        // Phase 3 adds pilot clients through a company-level flag.
        visible: ctx => ctx.isStaff,
    },
];

export const ADMIN_NAV: NavItem = {
    key: 'admin',
    path: '/admin',
    icon: ShieldCheck,
    label: { en: 'Admin', fr: 'Administration' },
    visible: ctx => ctx.isStaff || ctx.isExternalAdmin,
};

export function isActive(item: NavItem, pathname: string): boolean {
    return [item.path, ...(item.match ?? [])].some(p => pathname === p || pathname.startsWith(p + '/'));
}
