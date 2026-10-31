import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Loader2, X, Users, Shield, Trash2, FileText } from 'lucide-react';

import API_URL from '../utils/apiUrl';
import AdminUseCases from './AdminUseCases';
import AdminGallery from './AdminGallery';
import { useLang } from '../utils/useLang';

const translations = {
    en: {
        back: "Home",
        title: "Atperf Internal Admin Panel",
        tabExternal: "External Users",
        tabInternal: "Internal Staff",
        tabCompany: "Companies",
        extDesc: "Manage client accounts, approve registrations, assign roles and credits.",
        intDesc: "Manage atperf.com team members, approve access, and assign internal roles.",
        compDesc: "Manage organization records and standard company details.",
        refresh: "Refresh",
        noExtFound: "No external users found.",
        noIntFound: "No internal staff found.",
        noCompFound: "No companies found.",
        fn: "First Name",
        ln: "Last Name",
        loc: "Location",
        email: "Email",
        role: "Role",
        status: "Status",
        credits: "Credits",
        actions: "Actions",
        intRole: "Internal Role",
        ind: "Industry",
        prod: "Products (comma separated)",
        save: "Save",
        approve: "Approve",
        approved: "Approved",
        active: "Active",
        addCompany: "Add Company",
        cancel: "Cancel",
        create: "Create",
        confirmTitle: "Confirm Changes",
        confirmCancel: "Cancel",
        confirmSave: "Confirm Save",
        autoGen: "Auto-generated",
        phName: "Company Name",
        phInd: "Industry",
        phLoc: "Location",
        phProd: "Product A, Product B",
        taxId: "Tax ID",
        planType: "Plan Type",
        compStatus: "Company Status",
        maxUsers: "Max Users",
        billingEmail: "Billing Email",
        joined: "Joined",
        phTaxId: "Tax ID",
        phBillingEmail: "billing@example.com",
        logOut: "Log out",
        deleteAcc: "Delete",
        deleteAccTitle: "Delete Account",
    },
    fr: {
        back: "Accueil",
        title: "Admin Panel Interne Atperf",
        tabExternal: "Utilisateurs Externes",
        tabInternal: "Personnel Interne",
        tabCompany: "Entreprises",
        extDesc: "Gérer les comptes clients, approuver les inscriptions, attribuer les rôles et les crédits.",
        intDesc: "Gérer les membres de l'équipe atperf.com, approuver l'accès et attribuer les rôles internes.",
        compDesc: "Gérer les dossiers d'organisation et les détails standard des entreprises.",
        refresh: "Rafraîchir",
        noExtFound: "Aucun utilisateur externe trouvé.",
        noIntFound: "Aucun membre du personnel trouvé.",
        noCompFound: "Aucune entreprise trouvée.",
        fn: "Prénom",
        ln: "Nom",
        loc: "Position",
        email: "Email",
        role: "Rôle",
        status: "Statut",
        credits: "Crédits",
        actions: "Actions",
        intRole: "Rôle Interne",
        ind: "Secteur",
        prod: "Produits (séparés par des virgules)",
        save: "Sauvegarder",
        approve: "Approuver",
        approved: "Approuvé",
        active: "Actif",
        addCompany: "Ajouter Entreprise",
        cancel: "Annuler",
        create: "Créer",
        confirmTitle: "Confirmer les Modifications",
        confirmCancel: "Annuler",
        confirmSave: "Confirmer la Sauvegarde",
        autoGen: "Généré auto.",
        phName: "Nom de l'entreprise",
        phInd: "Secteur",
        phLoc: "Position",
        phProd: "Produit A, Produit B",
        taxId: "Numéro de TVA",
        planType: "Type de Plan",
        compStatus: "Statut de l'entreprise",
        maxUsers: "Max Utilisateurs",
        billingEmail: "Email de facturation",
        joined: "Inscrit",
        phTaxId: "Numéro de TVA",
        phBillingEmail: "facturation@exemple.com",
        logOut: "Déconnexion",
        deleteAcc: "Supprimer",
        deleteAccTitle: "Supprimer le compte",
    }
};

interface User {
    user_id: string;
    first_name: string;
    last_name: string;
    company_name: string | null;
    location: string | null;
    email: string;
    role: string | null;
    status: string;
    credits: number | string;
    created_at: string;
}

interface Staff {
    staff_id: string;
    first_name: string;
    last_name: string;
    email: string;
    internal_role: string;
    status: string;
    created_at: string;
}

interface Company {
    company_id: string;
    company_name: string;
    industry_sector: string | null;
    company_ho: string | null;
    tax_id: string | null;
    billing_contact_email: string | null;
    plan_type: string;
    company_status: string;
    total_credits: number;
    max_users: number;
    created_at: string;
}

type Tab = 'external' | 'internal' | 'company';
type PrimaryTab = 'database' | 'use_cases' | 'blogs' | 'gallery';

export default function AdminPanel() {
    const navigate = useNavigate();
    const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('database');
    const [tab, setTab] = useState<Tab>('external');

    // External users state
    const [users, setUsers] = useState<User[]>([]);
    const [userDrafts, setUserDrafts] = useState<Record<string, User>>({});
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState('');

    // Internal staff state
    const [staff, setStaff] = useState<Staff[]>([]);
    const [staffDrafts, setStaffDrafts] = useState<Record<string, Staff>>({});
    const [staffLoading, setStaffLoading] = useState(true);
    const [staffError, setStaffError] = useState('');

    // Companies state
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyDrafts, setCompanyDrafts] = useState<Record<string, Company>>({});
    const [companyLoading, setCompanyLoading] = useState(true);
    const [companyError, setCompanyError] = useState('');

    // New Company State
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [newCompanyDraft, setNewCompanyDraft] = useState({ company_name: '', industry_sector: '', company_ho: '', tax_id: '', billing_contact_email: '' });

    const [confirmModal, setConfirmModal] = useState<{ id: string; type: Tab } | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ id: string; type: 'external' | 'internal' } | null>(null);

    const currentUserRaw = localStorage.getItem('proextract_user');
    const currentStaffRaw = localStorage.getItem('proextract_staff');
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    const currentStaff = currentStaffRaw ? JSON.parse(currentStaffRaw) : null;

    const [lang] = useLang();
    const t = translations[lang];

    // Access Control Logic
    const isExternalAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const hasAccess = isExternalAdmin || !!currentStaff; // any verified staff or external admin

    const canManageUsersAndStaff = isExternalAdmin || currentStaff?.internal_role === 'admin' || currentStaff?.internal_role === 'super_admin';
    const isSuperAdmin = currentUser?.role === 'super_admin' || currentStaff?.internal_role === 'super_admin';

    const validCompanyEditors = ['collaborator', 'developer', 'admin', 'super_admin'];
    const canEditCompanies = isExternalAdmin || validCompanyEditors.includes(currentStaff?.internal_role);

    // --- Fetch External Users ---
    const fetchUsers = async () => {
        setUserLoading(true);
        setUserError('');
        try {
            const res = await fetch(`${API_URL}/users?t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to load users');
            const sorted = [...data].sort((a: User, b: User) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (b.status === 'pending' && a.status !== 'pending') return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setUsers(sorted);
            const d: Record<string, User> = {};
            sorted.forEach((u: User) => { d[u.user_id] = { ...u }; });
            setUserDrafts(d);
        } catch (err: any) { setUserError(err.message); }
        finally { setUserLoading(false); }
    };

    // --- Fetch Internal Staff ---
    const fetchStaff = async () => {
        setStaffLoading(true);
        setStaffError('');
        try {
            const res = await fetch(`${API_URL}/staff?t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to load staff');
            const sorted = [...data].sort((a: Staff, b: Staff) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (b.status === 'pending' && a.status !== 'pending') return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setStaff(sorted);
            const d: Record<string, Staff> = {};
            sorted.forEach((s: Staff) => { d[s.staff_id] = { ...s }; });
            setStaffDrafts(d);
        } catch (err: any) { setStaffError(err.message); }
        finally { setStaffLoading(false); }
    };

    // --- Fetch Companies ---
    const fetchCompanies = async () => {
        setCompanyLoading(true);
        setCompanyError('');
        try {
            const res = await fetch(`${API_URL}/companies?t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to load companies');
            setCompanies(data);
            const d: Record<string, Company> = {};
            data.forEach((c: Company) => { d[c.company_id] = { ...c }; });
            setCompanyDrafts(d);
        } catch (err: any) { setCompanyError(err.message); }
        finally { setCompanyLoading(false); }
    };

    useEffect(() => {
        if (!hasAccess) { navigate('/'); return; }
        fetchUsers();
        fetchStaff();
        fetchCompanies();
    }, []);

    // --- User helpers ---
    const handleUserDraft = (id: string, field: keyof User, value: any) => {
        setUserDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    };
    const userHasChanges = (id: string) => {
        const o = users.find(u => u.user_id === id);
        const d = userDrafts[id];
        if (!o || !d) return false;
        return o.first_name !== d.first_name || o.last_name !== d.last_name || o.company_name !== d.company_name
            || o.location !== d.location || o.email !== d.email || o.role !== d.role || o.status !== d.status || o.credits !== d.credits;
    };

    // --- Staff helpers ---
    const handleStaffDraft = (id: string, field: keyof Staff, value: any) => {
        setStaffDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    };
    const staffHasChanges = (id: string) => {
        const o = staff.find(s => s.staff_id === id);
        const d = staffDrafts[id];
        if (!o || !d) return false;
        return o.first_name !== d.first_name || o.last_name !== d.last_name || o.email !== d.email
            || o.internal_role !== d.internal_role || o.status !== d.status;
    };

    // --- Company helpers ---
    const handleCompanyDraft = (id: string, field: string, value: any) => {
        setCompanyDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    };
    const companyHasChanges = (id: string) => {
        const o = companies.find((c: Company) => c.company_id === id);
        const d = companyDrafts[id];
        if (!o || !d) return false;
        return o.company_name !== d.company_name ||
            o.industry_sector !== d.industry_sector ||
            o.company_ho !== d.company_ho ||
            o.tax_id !== d.tax_id ||
            o.billing_contact_email !== d.billing_contact_email ||
            o.plan_type !== d.plan_type ||
            o.company_status !== d.company_status ||
            o.total_credits !== d.total_credits ||
            o.max_users !== d.max_users;
    };

    const handleCreateCompany = async () => {
        if (!newCompanyDraft.company_name.trim()) {
            alert("Company Name is required.");
            return;
        }

        try {
            const payload = {
                company_name: newCompanyDraft.company_name,
                industry_sector: newCompanyDraft.industry_sector,
                company_ho: newCompanyDraft.company_ho,
                tax_id: newCompanyDraft.tax_id,
                billing_contact_email: newCompanyDraft.billing_contact_email
            };

            const res = await fetch(`${API_URL}/companies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to create company');

            // Add new company to top of the list
            setCompanies(prev => [data, ...prev]);
            setCompanyDrafts(prev => ({ ...prev, [data.company_id]: { ...data } }));
            setIsCreatingCompany(false);
            setNewCompanyDraft({ company_name: '', industry_sector: '', company_ho: '', tax_id: '', billing_contact_email: '' });

        } catch (err: any) {
            alert(err.message || 'Failed to create company');
        }
    };

    // --- Save ---
    const confirmUpdate = async () => {
        if (!confirmModal) return;
        const { id, type } = confirmModal;

        try {
            if (type === 'external') {
                const draft = userDrafts[id];
                const parsedCredits = parseInt(String(draft.credits), 10);
                const payload = { ...draft, credits: isNaN(parsedCredits) ? 0 : parsedCredits };
                const res = await fetch(`${API_URL}/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed');
                setUsers(prev => prev.map(u => (u.user_id === id ? data : u)));
                setUserDrafts(prev => ({ ...prev, [id]: data }));
                if (currentUser?.user_id === id) localStorage.setItem('proextract_user', JSON.stringify({ ...currentUser, ...data }));
            } else if (type === 'internal') {
                const draft = staffDrafts[id];
                const res = await fetch(`${API_URL}/staff/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed');
                setStaff(prev => prev.map(s => (s.staff_id === id ? data : s)));
                setStaffDrafts(prev => ({ ...prev, [id]: data }));
            } else if (type === 'company') {
                const draft = companyDrafts[id];
                const parsedCredits = parseInt(String(draft.total_credits), 10);
                const parsedMaxUsers = parseInt(String(draft.max_users), 10);
                const payload = {
                    company_name: draft.company_name,
                    industry_sector: draft.industry_sector,
                    company_ho: draft.company_ho,
                    tax_id: draft.tax_id,
                    billing_contact_email: draft.billing_contact_email,
                    plan_type: draft.plan_type,
                    company_status: draft.company_status,
                    total_credits: isNaN(parsedCredits) ? 0 : parsedCredits,
                    max_users: isNaN(parsedMaxUsers) ? 1 : parsedMaxUsers
                };
                const res = await fetch(`${API_URL}/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed');
                setCompanies(prev => prev.map(c => (c.company_id === id ? data : c)));
                setCompanyDrafts(prev => ({ ...prev, [id]: { ...data } }));
            }
            setConfirmModal(null);
        } catch (err: any) {
            alert(err.message || 'Failed to update');
        }
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;
        const { id, type } = deleteModal;
        try {
            const url = type === 'external' ? `${API_URL}/users/${id}` : `${API_URL}/staff/${id}`;
            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to delete');
            }
            if (type === 'external') {
                setUsers(prev => prev.filter(u => u.user_id !== id));
                const newDrafts = { ...userDrafts };
                delete newDrafts[id];
                setUserDrafts(newDrafts);
            } else {
                setStaff(prev => prev.filter(s => s.staff_id !== id));
                const newDrafts = { ...staffDrafts };
                delete newDrafts[id];
                setStaffDrafts(newDrafts);
            }
            setDeleteModal(null);
        } catch (err: any) {
            alert(err.message || 'Failed to delete');
        }
    };

    const statusBadge = (status: string) => {
        if (status === 'active') return 'bg-green-100 text-green-700 border-green-200 font-bold';
        if (status === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200';
        if (status === 'unverified') return 'bg-slate-100 text-slate-500 border-slate-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
                {/* Primary Nav */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8 w-full">
                    <button onClick={() => setPrimaryTab('database')} className={`text-base font-bold pb-3 border-b-2 transition-colors ${primaryTab === 'database' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Database</button>
                    {(isExternalAdmin || currentStaff) && (
                        <button onClick={() => setPrimaryTab('use_cases')} className={`text-base font-bold pb-3 border-b-2 transition-colors ${primaryTab === 'use_cases' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Use Cases</button>
                    )}
                    {(isExternalAdmin || currentStaff) && (
                        <button onClick={() => setPrimaryTab('gallery')} className={`text-base font-bold pb-3 border-b-2 transition-colors ${primaryTab === 'gallery' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Gallery</button>
                    )}
                    <button onClick={() => setPrimaryTab('blogs')} className={`text-base font-bold pb-3 border-b-2 transition-colors ${primaryTab === 'blogs' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Blogs</button>
                </div>

                {primaryTab === 'blogs' && (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400 shadow-sm mt-4">
                        <FileText size={48} className="mb-4 opacity-30" />
                        <p className="text-xl font-bold mb-2 text-slate-800">Blogs Module</p>
                        <p className="text-sm">This section is currently empty and pending implementation.</p>
                    </div>
                )}

                {primaryTab === 'use_cases' && (
                    <AdminUseCases currentUser={currentUser} currentStaff={currentStaff} lang={lang} />
                )}

                {primaryTab === 'gallery' && (
                    <AdminGallery />
                )}

                {primaryTab === 'database' && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit max-w-full overflow-x-auto mb-8">
                        <button
                            onClick={() => setTab('external')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'external' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users size={16} /> {t.tabExternal}
                        </button>
                        <button
                            onClick={() => setTab('internal')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'internal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Shield size={16} /> {t.tabInternal}
                        </button>
                        <button
                            onClick={() => setTab('company')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'company' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Zap size={16} /> {t.tabCompany}
                        </button>
                    </div>
                )}

                {/* ====================== EXTERNAL USERS ====================== */}
                {primaryTab === 'database' && tab === 'external' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-extrabold text-slate-900">{t.tabExternal}</h2>
                            <button onClick={fetchUsers} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-2">
                                <Loader2 size={14} className={userLoading ? 'animate-spin' : ''} /> {t.refresh}
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">{t.extDesc}</p>

                        {userLoading ? (
                            <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
                        ) : userError ? (
                            <p className="text-sm text-red-600">{userError}</p>
                        ) : users.length === 0 ? (
                            <p className="text-sm text-slate-500">{t.noExtFound}</p>
                        ) : (
                            <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2 text-left">{t.fn}</th>
                                            <th className="px-4 py-2 text-left">{t.ln}</th>
                                            <th className="px-4 py-2 text-left">{t.loc}</th>
                                            <th className="px-4 py-2 text-left">{t.email}</th>
                                            <th className="px-4 py-2 text-left">{t.role}</th>
                                            <th className="px-4 py-2 text-left">{t.status}</th>
                                            <th className="px-4 py-2 text-right">{t.credits}</th>
                                            <th className="px-4 py-2 text-right">{t.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => {
                                            const d = userDrafts[u.user_id];
                                            if (!d) return null;
                                            const dirty = userHasChanges(u.user_id);
                                            const currentStatus = dirty ? d.status : u.status;
                                            return (
                                                <tr key={u.user_id} className="border-t border-slate-100">
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.first_name} onChange={e => handleUserDraft(u.user_id, 'first_name', e.target.value)} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.last_name} onChange={e => handleUserDraft(u.user_id, 'last_name', e.target.value)} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.location || ''} onChange={e => handleUserDraft(u.user_id, 'location', e.target.value)} disabled={!canManageUsersAndStaff} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.email} onChange={e => handleUserDraft(u.user_id, 'email', e.target.value)} disabled={!canManageUsersAndStaff} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select value={d.role || 'member'} onChange={e => handleUserDraft(u.user_id, 'role', e.target.value)} disabled={!canManageUsersAndStaff}
                                                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60">
                                                            <option value="member">member</option>
                                                            <option value="coordinator">coordinator</option>
                                                            <option value="admin">admin</option>
                                                            <option value="super_admin">super admin</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select value={d.status} onChange={e => handleUserDraft(u.user_id, 'status', e.target.value)} disabled={!canManageUsersAndStaff}
                                                            className={`border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60 ${statusBadge(currentStatus)}`}>
                                                            <option value="unverified" className="bg-white text-slate-800">unverified</option>
                                                            <option value="pending" className="bg-white text-slate-800">pending</option>
                                                            <option value="active" className="bg-white text-slate-800">active</option>
                                                            <option value="disabled" className="bg-white text-slate-800">disabled</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <input type="number" value={d.credits} onChange={e => handleUserDraft(u.user_id, 'credits', e.target.value)} disabled={!canManageUsersAndStaff}
                                                            className="w-16 text-right border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60" />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {dirty && canManageUsersAndStaff ? (
                                                                <button onClick={() => setConfirmModal({ id: u.user_id, type: 'external' })}
                                                                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow-sm w-[80px] text-center">{t.save}</button>
                                                            ) : u.status === 'pending' && canManageUsersAndStaff ? (
                                                                <button onClick={() => { handleUserDraft(u.user_id, 'status', 'active'); setConfirmModal({ id: u.user_id, type: 'external' }); }}
                                                                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow-sm w-[80px] text-center">{t.approve}</button>
                                                            ) : u.status === 'active' ? (
                                                                <div className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg text-center w-[80px]">{t.approved}</div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 capitalize w-[80px] text-center inline-block">{u.status}</span>
                                                            )}
                                                            {isSuperAdmin && currentUser?.user_id !== u.user_id && (
                                                                <button onClick={() => setDeleteModal({ id: u.user_id, type: 'external' })}
                                                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent" title={t.deleteAcc}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ====================== INTERNAL STAFF ====================== */}
                {primaryTab === 'database' && tab === 'internal' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-extrabold text-slate-900">{t.tabInternal} (ProStaff)</h2>
                            <button onClick={fetchStaff} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-2">
                                <Loader2 size={14} className={staffLoading ? 'animate-spin' : ''} /> {t.refresh}
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">{t.intDesc}</p>

                        {staffLoading ? (
                            <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
                        ) : staffError ? (
                            <p className="text-sm text-red-600">{staffError}</p>
                        ) : staff.length === 0 ? (
                            <p className="text-sm text-slate-500">{t.noIntFound}</p>
                        ) : (
                            <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2 text-left">{t.fn}</th>
                                            <th className="px-4 py-2 text-left">{t.ln}</th>
                                            <th className="px-4 py-2 text-left">{t.email}</th>
                                            <th className="px-4 py-2 text-left">{t.intRole}</th>
                                            <th className="px-4 py-2 text-left">{t.status}</th>
                                            <th className="px-4 py-2 text-right">{t.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staff.map(s => {
                                            const d = staffDrafts[s.staff_id];
                                            if (!d) return null;
                                            const dirty = staffHasChanges(s.staff_id);
                                            const currentStatus = dirty ? d.status : s.status;
                                            return (
                                                <tr key={s.staff_id} className="border-t border-slate-100">
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.first_name} onChange={e => handleStaffDraft(s.staff_id, 'first_name', e.target.value)} disabled={!canManageUsersAndStaff} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.last_name} onChange={e => handleStaffDraft(s.staff_id, 'last_name', e.target.value)} disabled={!canManageUsersAndStaff} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.email} onChange={e => handleStaffDraft(s.staff_id, 'email', e.target.value)} disabled={!canManageUsersAndStaff} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select value={d.internal_role} onChange={e => handleStaffDraft(s.staff_id, 'internal_role', e.target.value)} disabled={!canManageUsersAndStaff}
                                                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60">
                                                            <option value="member">member</option>
                                                            <option value="collaborator">collaborator</option>
                                                            <option value="developer">developer</option>
                                                            <option value="admin">admin</option>
                                                            <option value="super_admin">super admin</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select value={d.status} onChange={e => handleStaffDraft(s.staff_id, 'status', e.target.value)} disabled={!canManageUsersAndStaff}
                                                            className={`border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60 ${statusBadge(currentStatus)}`}>
                                                            <option value="unverified" className="bg-white text-slate-800">unverified</option>
                                                            <option value="pending" className="bg-white text-slate-800">pending</option>
                                                            <option value="active" className="bg-white text-slate-800">active</option>
                                                            <option value="suspended" className="bg-white text-slate-800">suspended</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {dirty && canManageUsersAndStaff ? (
                                                                <button onClick={() => setConfirmModal({ id: s.staff_id, type: 'internal' })}
                                                                    className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg shadow-sm w-[80px] text-center">{t.save}</button>
                                                            ) : s.status === 'pending' && canManageUsersAndStaff ? (
                                                                <button onClick={() => { handleStaffDraft(s.staff_id, 'status', 'active'); setConfirmModal({ id: s.staff_id, type: 'internal' }); }}
                                                                    className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg shadow-sm w-[80px] text-center">{t.approve}</button>
                                                            ) : s.status === 'active' ? (
                                                                <div className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg text-center w-[80px]">{t.active}</div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 capitalize w-[80px] text-center inline-block">{s.status}</span>
                                                            )}
                                                            {isSuperAdmin && currentStaff?.staff_id !== s.staff_id && (
                                                                <button onClick={() => setDeleteModal({ id: s.staff_id, type: 'internal' })}
                                                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent" title={t.deleteAcc}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ====================== COMPANIES ====================== */}
                {primaryTab === 'database' && tab === 'company' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-extrabold text-slate-900">{t.tabCompany}</h2>
                            <div className="flex items-center gap-3">
                                {canEditCompanies && (
                                    <button
                                        onClick={() => setIsCreatingCompany(!isCreatingCompany)}
                                        className="text-sm px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-500 transition-colors"
                                    >
                                        {isCreatingCompany ? t.cancel : t.addCompany}
                                    </button>
                                )}
                                <button onClick={fetchCompanies} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-2">
                                    <Loader2 size={14} className={companyLoading ? 'animate-spin' : ''} /> {t.refresh}
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">{t.compDesc}</p>

                        {companyLoading ? (
                            <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
                        ) : companyError ? (
                            <p className="text-sm text-red-600">{companyError}</p>
                        ) : companies.length === 0 ? (
                            <p className="text-sm text-slate-500">{t.noCompFound}</p>
                        ) : (
                            <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Internal ID</th>
                                            <th className="px-4 py-2 text-left">{t.phName}</th>
                                            <th className="px-4 py-2 text-left">{t.taxId}</th>
                                            <th className="px-4 py-2 text-left">{t.ind}</th>
                                            <th className="px-4 py-2 text-left">{t.loc}</th>
                                            <th className="px-4 py-2 text-left">{t.planType}</th>
                                            <th className="px-4 py-2 text-left">{t.compStatus}</th>
                                            <th className="px-4 py-2 text-right">{t.credits}</th>
                                            <th className="px-4 py-2 text-right">{t.maxUsers}</th>
                                            <th className="px-4 py-2 text-left">{t.billingEmail}</th>
                                            <th className="px-4 py-2 text-left">{t.joined}</th>
                                            <th className="px-4 py-2 text-right">{t.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isCreatingCompany && (
                                            <tr className="border-t border-slate-100 bg-indigo-50/30">
                                                <td className="px-4 py-3 text-xs text-slate-400 font-mono italic">
                                                    {t.autoGen}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                                        placeholder={t.phName}
                                                        value={newCompanyDraft.company_name} onChange={e => setNewCompanyDraft({ ...newCompanyDraft, company_name: e.target.value })} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                                        placeholder={t.phTaxId}
                                                        value={newCompanyDraft.tax_id} onChange={e => setNewCompanyDraft({ ...newCompanyDraft, tax_id: e.target.value })} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                                        placeholder={t.phInd}
                                                        value={newCompanyDraft.industry_sector} onChange={e => setNewCompanyDraft({ ...newCompanyDraft, industry_sector: e.target.value })} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                                        placeholder={t.phLoc}
                                                        value={newCompanyDraft.company_ho} onChange={e => setNewCompanyDraft({ ...newCompanyDraft, company_ho: e.target.value })} />
                                                </td>
                                                <td colSpan={5} className="px-4 py-3">
                                                    <span className="text-xs text-slate-400 italic">Auto-generated on creation</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                                        placeholder={t.phBillingEmail}
                                                        value={newCompanyDraft.billing_contact_email} onChange={e => setNewCompanyDraft({ ...newCompanyDraft, billing_contact_email: e.target.value })} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-400 italic">-</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={handleCreateCompany}
                                                        className="text-xs font-bold text-white bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg shadow-sm w-full">{t.create}</button>
                                                </td>
                                            </tr>
                                        )}
                                        {companies.map(c => {
                                            const d = companyDrafts[c.company_id];
                                            if (!d) return null;
                                            const dirty = companyHasChanges(c.company_id);
                                            return (
                                                <tr key={c.company_id} className="border-t border-slate-100">
                                                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                                        {c.company_id}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.company_name || ''} onChange={e => handleCompanyDraft(c.company_id, 'company_name', e.target.value)} disabled={!canEditCompanies} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[110px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.tax_id || ''} onChange={e => handleCompanyDraft(c.company_id, 'tax_id', e.target.value)} disabled={!canEditCompanies} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.industry_sector || ''} onChange={e => handleCompanyDraft(c.company_id, 'industry_sector', e.target.value)} disabled={!canEditCompanies} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.company_ho || ''} onChange={e => handleCompanyDraft(c.company_id, 'company_ho', e.target.value)} disabled={!canEditCompanies} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select value={d.plan_type || 'free'} onChange={e => handleCompanyDraft(c.company_id, 'plan_type', e.target.value)} disabled={!canEditCompanies}
                                                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60">
                                                            <option value="free">Free</option>
                                                            <option value="pro">Pro</option>
                                                            <option value="enterprise">Enterprise</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select value={d.company_status || 'active'} onChange={e => handleCompanyDraft(c.company_id, 'company_status', e.target.value)} disabled={!canEditCompanies}
                                                            className={`border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60 ${statusBadge(dirty ? d.company_status : c.company_status)}`}>
                                                            <option value="active" className="bg-white text-slate-800">Active</option>
                                                            <option value="suspended" className="bg-white text-slate-800">Suspended</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <input type="number" value={d.total_credits ?? 0} onChange={e => handleCompanyDraft(c.company_id, 'total_credits', e.target.value)} disabled={!canEditCompanies}
                                                            className="w-16 text-right border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60" />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <input type="number" value={d.max_users ?? 5} onChange={e => handleCompanyDraft(c.company_id, 'max_users', e.target.value)} disabled={!canEditCompanies}
                                                            className="w-16 text-right border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                            value={d.billing_contact_email || ''} onChange={e => handleCompanyDraft(c.company_id, 'billing_contact_email', e.target.value)} disabled={!canEditCompanies} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {dirty && canEditCompanies ? (
                                                            <button onClick={() => setConfirmModal({ id: c.company_id, type: 'company' })}
                                                                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow-sm w-full">{t.save}</button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 capitalize"></span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Confirmation Modal */}
            {confirmModal && (
                <ConfirmationModal
                    type={confirmModal.type}
                    original={confirmModal.type === 'external'
                        ? users.find(u => u.user_id === confirmModal.id)
                        : confirmModal.type === 'internal'
                            ? staff.find(s => s.staff_id === confirmModal.id)
                            : companies.find(c => c.company_id === confirmModal.id)}
                    draft={confirmModal.type === 'external'
                        ? userDrafts[confirmModal.id]
                        : confirmModal.type === 'internal'
                            ? staffDrafts[confirmModal.id]
                            : companyDrafts[confirmModal.id]}
                    onClose={() => setConfirmModal(null)}
                    onConfirm={confirmUpdate}
                    t={t}
                    lang={lang}
                />
            )}

            {deleteModal && (
                <DeleteConfirmationModal
                    type={deleteModal.type}
                    original={deleteModal.type === 'external'
                        ? users.find(u => u.user_id === deleteModal.id)
                        : staff.find(s => s.staff_id === deleteModal.id)}
                    onClose={() => setDeleteModal(null)}
                    onConfirm={confirmDelete}
                    t={t}
                />
            )}
        </div>
    );
}

function DeleteConfirmationModal({ original, onClose, onConfirm, t }: { type: 'external' | 'internal'; original: any; onClose: () => void; onConfirm: () => void; t: any }) {
    if (!original) return null;
    const displayName = `${original.first_name} ${original.last_name}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Trash2 size={18} className="text-red-500" /> {t.deleteAccTitle}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        {t.deleteAccDesc}
                        <br /><br />
                        <span className="font-semibold text-slate-900 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg block text-center truncate">{displayName} ({original.email})</span>
                    </p>
                    <div className="flex items-center justify-end gap-3 mt-6 border-t border-slate-100 pt-5">
                        <button onClick={onClose} className="text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors">{t.cancel}</button>
                        <button onClick={onConfirm} className="text-sm font-bold text-white bg-red-600 hover:bg-red-500 px-5 py-2 rounded-xl transition-colors shadow-sm">{t.deleteAcc}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConfirmationModal({ type, original, draft, onClose, onConfirm, t, lang }: { type: Tab; original: any; draft: any; onClose: () => void; onConfirm: () => void; t: any; lang: 'en' | 'fr' }) {
    if (!original || !draft) return null;

    const changes: { field: string; from: any; to: any }[] = [];

    if (type === 'external') {
        if (original.first_name !== draft.first_name) changes.push({ field: 'First Name', from: original.first_name, to: draft.first_name });
        if (original.last_name !== draft.last_name) changes.push({ field: 'Last Name', from: original.last_name, to: draft.last_name });
        if (original.company_name !== draft.company_name) changes.push({ field: 'Company', from: original.company_name, to: draft.company_name });
        if (original.location !== draft.location) changes.push({ field: 'Location', from: original.location, to: draft.location });
        if (original.email !== draft.email) changes.push({ field: 'Email', from: original.email, to: draft.email });
        if (original.role !== draft.role) changes.push({ field: 'Role', from: original.role, to: draft.role });
        if (original.status !== draft.status) changes.push({ field: 'Status', from: original.status, to: draft.status });
        if (original.credits !== draft.credits) changes.push({ field: 'Credits', from: original.credits, to: draft.credits });
    } else if (type === 'internal') {
        if (original.first_name !== draft.first_name) changes.push({ field: 'First Name', from: original.first_name, to: draft.first_name });
        if (original.last_name !== draft.last_name) changes.push({ field: 'Last Name', from: original.last_name, to: draft.last_name });
        if (original.email !== draft.email) changes.push({ field: 'Email', from: original.email, to: draft.email });
        if (original.internal_role !== draft.internal_role) changes.push({ field: 'Internal Role', from: original.internal_role, to: draft.internal_role });
        if (original.status !== draft.status) changes.push({ field: 'Status', from: original.status, to: draft.status });
    } else if (type === 'company') {
        if (original.company_name !== draft.company_name) changes.push({ field: 'Name', from: original.company_name, to: draft.company_name });
        if (original.tax_id !== draft.tax_id) changes.push({ field: 'Tax ID', from: original.tax_id, to: draft.tax_id });
        if (original.industry_sector !== draft.industry_sector) changes.push({ field: 'Industry', from: original.industry_sector, to: draft.industry_sector });
        if (original.company_ho !== draft.company_ho) changes.push({ field: 'Location', from: original.company_ho, to: draft.company_ho });
        if (original.plan_type !== draft.plan_type) changes.push({ field: 'Plan Type', from: original.plan_type, to: draft.plan_type });
        if (original.company_status !== draft.company_status) changes.push({ field: 'Status', from: original.company_status, to: draft.company_status });
        if (original.total_credits !== draft.total_credits) changes.push({ field: 'Total Credits', from: original.total_credits, to: draft.total_credits });
        if (original.max_users !== draft.max_users) changes.push({ field: 'Max Users', from: original.max_users, to: draft.max_users });
        if (original.billing_contact_email !== draft.billing_contact_email) changes.push({ field: 'Billing Email', from: original.billing_contact_email, to: draft.billing_contact_email });
    }

    const displayName = type === 'company' ? original.company_name : `${original.first_name} ${original.last_name}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">{t.confirmTitle}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-4">
                        {lang === 'fr' ? 'Sauvegarde des modifications pour' : 'Saving changes for'} <span className="font-semibold text-slate-900">{displayName}</span>
                        {type === 'internal' && <span className="ml-1 text-xs text-slate-400">({t.tabInternal})</span>}
                        {type === 'company' && <span className="ml-1 text-xs text-slate-400">({t.tabCompany})</span>}:
                    </p>
                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                        {changes.map((c, i) => (
                            <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                                <span className="font-bold text-slate-700">{c.field}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded line-through opacity-80">{c.from || 'None'}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">{c.to || 'None'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{t.confirmCancel}</button>
                        <button onClick={onConfirm} className={`text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${type === 'internal' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                            {t.confirmSave}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
