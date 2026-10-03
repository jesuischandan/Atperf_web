import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, X, Upload, CheckCircle2, ChevronRight, LayoutDashboard, Target, Activity, FileJson, Info, Image as ImageIcon, Film, FileText, FolderOpen } from 'lucide-react';
import API_URL from '../utils/apiUrl';

interface UseCase {
    id: string;
    title: string;
    content: string; // JSON string containing UseCaseData
    image_url: string | null;
    video_url: string | null;
    company_name: string;
    publisher_name: string;
    likes_count: number;
    status: string;
    created_at: string;
}

interface UseCaseMetric {
    id: string;
    name: string;
    before: string;
    after: string;
    improvement: string;
    value_type: string;
    estimated_annualized_savings: string;
    so_what: string;
}

interface UseCaseData {
    industry: string;
    key_achievement: string;
    technologies: string[];
    hook: string;
    problem_checklist: string[];
    problem_text: string;
    methodology: string;
    metrics: UseCaseMetric[];
    media_caption: string;
    pro_tips: string;
    is_sanitized: boolean;
    client_segment: string;
    strategic_objective: string;
    monetized_impact: string;
    proprietary_frameworks: string[];
    testimonial_quote: string;
    testimonial_author: string;
    exhibit_title: string;
    why_atperf: string;
    contextual_benchmarking: string;
    thumbnail_url: string | null;
    infographic_url: string | null;
    language?: 'en' | 'fr';
}

const defaultData: UseCaseData = {
    industry: 'Manufacturing',
    key_achievement: '',
    technologies: [],
    hook: '',
    problem_checklist: [],
    problem_text: '',
    language: 'en',
    methodology: '',
    metrics: [],
    media_caption: '',
    pro_tips: '',
    is_sanitized: false,
    client_segment: '',
    strategic_objective: '',
    monetized_impact: '',
    proprietary_frameworks: [],
    testimonial_quote: '',
    testimonial_author: '',
    exhibit_title: '',
    why_atperf: '',
    contextual_benchmarking: '',
    thumbnail_url: null,
    infographic_url: null
};


export default function AdminUseCases({ currentUser, currentStaff, lang }: any) {
    const [useCases, setUseCases] = useState<UseCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    
    const defaultPublisher = currentStaff 
        ? `${currentStaff.first_name || ''} ${currentStaff.last_name || ''}`.trim()
        : currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Admin';

    const [draftTitle, setDraftTitle] = useState('');
    const [draftCompany, setDraftCompany] = useState('');
    const [draftPublisher, setDraftPublisher] = useState(defaultPublisher);
    const [draftStatus, setDraftStatus] = useState('published');
    const [draftId, setDraftId] = useState<string | null>(null);
    const [draftBaseMedia, setDraftBaseMedia] = useState<{img: string|null, vid: string|null}>({img: null, vid: null});
    
    const [formData, setFormData] = useState<UseCaseData>(defaultData);
    const [techInput, setTechInput] = useState('');
    const [frameworkInput, setFrameworkInput] = useState('');

    const [file, setFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [infographicFile, setInfographicFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Sidebar navigation
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState<'thumbnail' | 'mainMedia' | 'infographic' | null>(null);
    const [galleryData, setGalleryData] = useState<{photos: any[], videos: any[], pdfs: any[], logos: any[]}>({photos: [], videos: [], pdfs: [], logos: []});
    const [galleryTab, setGalleryTab] = useState<'photos' | 'videos' | 'pdfs' | 'logos'>('photos');
    const [loadingGallery, setLoadingGallery] = useState(false);

    const fetchGallery = async () => {
        setLoadingGallery(true);
        try {
            const res = await fetch(`${API_URL}/use-cases/gallery`);
            if (res.ok) {
                const data = await res.json();
                setGalleryData(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingGallery(false);
        }
    };

    const openGallery = (target: 'thumbnail' | 'mainMedia' | 'infographic') => {
        setGalleryTarget(target);
        setIsGalleryOpen(true);
        fetchGallery(); // always refresh when opening
    };

    const selectFromGallery = (url: string, type: 'photo' | 'video' | 'pdf') => {
        if (galleryTarget === 'thumbnail') {
            setFormData(prev => ({...prev, thumbnail_url: url}));
            setThumbnailFile(null);
        } else if (galleryTarget === 'infographic') {
            setFormData(prev => ({...prev, infographic_url: url}));
            setInfographicFile(null);
        } else if (galleryTarget === 'mainMedia') {
            if (type === 'video') {
                setDraftBaseMedia({img: null, vid: url});
            } else {
                setDraftBaseMedia({img: url, vid: null});
            }
            setFile(null);
        }
        setIsGalleryOpen(false);
    };

    const fetchUseCases = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/use-cases`);
            if (!res.ok) throw new Error('Failed to fetch use cases');
            const data = await res.json();
            setUseCases(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUseCases();
    }, []);

    const parseContent = (content: string): UseCaseData => {
        if (!content) return defaultData;
        try {
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object' && parsed !== null) {
                return { ...defaultData, ...parsed };
            }
        } catch {
            // legacy plain text fallback
            return { ...defaultData, methodology: content };
        }
        return defaultData;
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setDraftId(null);
        setDraftTitle('');
        setDraftCompany('');
        setDraftPublisher(defaultPublisher);
        setDraftStatus('published');
        setFormData(defaultData);
        setFile(null);
        setThumbnailFile(null);
        setInfographicFile(null);
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const openEditModal = (uc: UseCase) => {
        setIsEditing(true);
        setDraftId(uc.id);
        setDraftTitle(uc.title);
        setDraftCompany(uc.company_name);
        setDraftPublisher(uc.publisher_name);
        setDraftStatus(uc.status);
        setDraftBaseMedia({ img: uc.image_url, vid: uc.video_url });
        
        setFormData(parseContent(uc.content));
        setFile(null);
        setThumbnailFile(null);
        setInfographicFile(null);
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/use-cases/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setUseCases(prev => prev.filter(u => u.id !== id));
            setDeleteConfirmId(null);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleSave = async (forceStatus?: string) => {
        const finalStatus = forceStatus || draftStatus;
        
        if (finalStatus === 'published') {
            if (!draftTitle || !draftCompany) {
                alert("Project Title and Company Name are required to publish.");
                return;
            }
            if (!formData.is_sanitized) {
                alert("You must confirm that no sensitive/confidential data is exposed before publishing.");
                setCurrentStep(5);
                return;
            }
        }

        try {
            setUploading(true);
            let finalImageUrl = draftBaseMedia.img;
            let finalThumbnailUrl = formData.thumbnail_url;
            let finalInfographicUrl = formData.infographic_url;

            const uploadFile = async (f: File) => {
                const fData = new FormData();
                fData.append('file', f);
                fData.append('company_name', draftCompany || 'Draft');
                fData.append('year', new Date().getFullYear().toString());
                const upRes = await fetch(`${API_URL}/use-cases/upload`, {
                    method: 'POST',
                    body: fData
                });
                if (!upRes.ok) throw new Error('Failed to upload file');
                const data = await upRes.json();
                return data.url;
            };

            if (file) {
                const url = await uploadFile(file);
                finalImageUrl = url; // Videos are also saved to image_url for backend compatibility
            } else if (draftBaseMedia.vid) {
                finalImageUrl = draftBaseMedia.vid; // If selected from gallery, store in image_url
            }
            if (thumbnailFile) {
                finalThumbnailUrl = await uploadFile(thumbnailFile);
            }
            if (infographicFile) {
                finalInfographicUrl = await uploadFile(infographicFile);
            }

            const finalFormData = {
                ...formData,
                thumbnail_url: finalThumbnailUrl,
                infographic_url: finalInfographicUrl
            };
            const stringifiedContent = JSON.stringify(finalFormData);

            const payload = {
                title: draftTitle || 'Untitled Draft',
                content: stringifiedContent,
                company_name: draftCompany || 'Pending',
                publisher_name: draftPublisher,
                status: finalStatus,
                image_url: finalImageUrl,
            };

            const url = isEditing && draftId ? `${API_URL}/use-cases/${draftId}` : `${API_URL}/use-cases`;
            const method = isEditing && draftId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save use case');
            const savedUc = await res.json();

            if (isEditing) {
                setUseCases(prev => prev.map(u => u.id === savedUc.id ? savedUc : u));
            } else {
                setUseCases(prev => [savedUc, ...prev]);
            }

            setIsModalOpen(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    // Auto calculate % Improvement
    const calculateImprovement = (before: string, after: string) => {
        const b = parseFloat(before);
        const a = parseFloat(after);
        if (isNaN(b) || isNaN(a) || b === 0) return '';
        const diff = a - b;
        const perc = (diff / Math.abs(b)) * 100;
        return `${perc > 0 ? '+' : ''}${perc.toFixed(1)}%`;
    };

    const addMetricRow = () => {
        setFormData(prev => ({
            ...prev,
            metrics: [...prev.metrics, { id: Date.now().toString(), name: '', before: '', after: '', improvement: '', value_type: 'Operational Excellence', estimated_annualized_savings: '', so_what: '' }]
        }));
    };

    const updateMetric = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newMetrics = [...prev.metrics];
            newMetrics[index] = { ...newMetrics[index], [field]: value };
            
            if (field === 'before' || field === 'after') {
                newMetrics[index].improvement = calculateImprovement(newMetrics[index].before, newMetrics[index].after);
            }
            return { ...prev, metrics: newMetrics };
        });
    };

    const removeMetric = (index: number) => {
        setFormData(prev => {
            const newMetrics = [...prev.metrics];
            newMetrics.splice(index, 1);
            return { ...prev, metrics: newMetrics };
        });
    };

    const addTech = () => {
        if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
            setFormData(prev => ({ ...prev, technologies: [...prev.technologies, techInput.trim()] }));
            setTechInput('');
        }
    };
    
    const removeTech = (tech: string) => {
        setFormData(prev => ({ ...prev, technologies: prev.technologies.filter(t => t !== tech) }));
    };

    const addFramework = () => {
        if (frameworkInput.trim() && !formData.proprietary_frameworks.includes(frameworkInput.trim())) {
            setFormData(prev => ({ ...prev, proprietary_frameworks: [...prev.proprietary_frameworks, frameworkInput.trim()] }));
            setFrameworkInput('');
        }
    };
    
    const removeFramework = (fw: string) => {
        setFormData(prev => ({ ...prev, proprietary_frameworks: prev.proprietary_frameworks.filter(f => f !== fw) }));
    };

    const stepLabels = ['General Info', 'The Narrative', 'Data & Results', 'Media & Graphs', 'Review & Publish'];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Use Cases</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage structured ATPerf Project Submissions.</p>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FolderOpen className="text-indigo-600" size={28} />
                        {lang === 'fr' ? 'Gestion des Cas d\'Usage' : 'Use Cases Management'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {lang === 'fr' ? 'Créez et modifiez des cas d\'usage et des témoignages clients.' : 'Create, edit, and manage client use cases and testimonials.'}
                    </p>
                </div>
                <button onClick={openCreateModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <Plus size={18} /> {lang === 'fr' ? 'Créer un cas d\'usage' : 'Create Use Case'}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
            ) : useCases.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    No Use Cases found. Click "Create Use Case" to start standardizing knowledge.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3 text-left">Company</th>
                                <th className="px-4 py-3 text-left">Project Title</th>
                                <th className="px-4 py-3 text-left">Publisher</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {useCases.map((uc: UseCase) => (
                                <tr key={uc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900">{uc.company_name}</td>
                                    <td className="px-4 py-3 text-slate-600 max-w-[250px] hover:text-indigo-600 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap" title={uc.title}>
                                        <a href={`/use-cases/${encodeURIComponent(uc.title.toLowerCase().replace(/ /g, '-'))}`} target="_blank" rel="noopener noreferrer">{uc.title}</a>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{uc.publisher_name}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${uc.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {uc.status === 'published' ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEditModal(uc)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title='Edit'>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => setDeleteConfirmId(uc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title='Delete'>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-auto flex flex-col h-full max-h-[90vh] overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">{isEditing ? 'Edit Submission' : 'Project Submission Form'}</h2>
                                <p className="text-sm text-slate-500">Capture the narrative, metrics, and evidence automatically.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body Container */}
                        <div className="flex flex-1 overflow-hidden bg-slate-50/50">
                            
                            {/* Sidebar Configurator */}
                            <div className="w-64 border-r border-slate-200 bg-white shrink-0 p-4 overflow-y-auto hidden md:block">
                                <ul className="space-y-2">
                                    {stepLabels.map((label, index) => {
                                        const step = index + 1;
                                        const isActive = currentStep === step;
                                        return (
                                            <li key={step}>
                                                <button 
                                                    onClick={() => setCurrentStep(step)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                                >
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-md ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {step}
                                                    </span>
                                                    {label}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="mt-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <div className="flex items-start gap-2 text-indigo-800">
                                        <Info size={16} className="shrink-0 mt-0.5" />
                                        <p className="text-xs font-medium leading-relaxed">
                                            This UI guides Performance Engineers to generate comprehensive Case Studies without needing "homework".
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Pane */}
                            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                                <div className="max-w-3xl mx-auto space-y-8">
                                    
                                    {currentStep === 1 && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                    <LayoutDashboard className="text-indigo-500" size={20}/> General Info
                                                </h3>
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Project Title *</label>
                                                        <input type="text" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="e.g. Real-Time SIC Dashboards..." className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Company *</label>
                                                        <input type="text" value={draftCompany} onChange={e => setDraftCompany(e.target.value)} placeholder="e.g. Aperam Imphy" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Publisher Name</label>
                                                        <input type="text" value={draftPublisher} onChange={e => setDraftPublisher(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Industry Sector</label>
                                                        <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all bg-white">
                                                            <option>Manufacturing</option>
                                                            <option>Fintech</option>
                                                            <option>Retail</option>
                                                            <option>Healthcare</option>
                                                            <option>Telecommunications</option>
                                                            <option>Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Segment</label>
                                                        <select value={formData.client_segment} onChange={e => setFormData({...formData, client_segment: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all bg-white">
                                                            <option value="">Select Segment</option>
                                                            <option value="C-Suite">C-Suite</option>
                                                            <option value="Operations">Operations</option>
                                                            <option value="IT">IT</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">{lang === 'fr' ? 'Statut' : 'Status'} <span className="text-red-500">*</span></label>
                                                        <select value={draftStatus} onChange={e => setDraftStatus(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all bg-white">
                                                            <option value="published">{lang === 'fr' ? 'Publié' : 'Published'}</option>
                                                            <option value="draft">{lang === 'fr' ? 'Brouillon' : 'Draft'}</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">{lang === 'fr' ? 'Langue du cas d\'usage' : 'Use Case Language'} <span className="text-red-500">*</span></label>
                                                        <select value={formData.language || 'en'} onChange={e => setFormData({...formData, language: e.target.value as 'en'|'fr'})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all bg-white">
                                                            <option value="en">English</option>
                                                            <option value="fr">Français</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Strategic Objective</label>
                                                        <input type="text" value={formData.strategic_objective} onChange={e => setFormData({...formData, strategic_objective: e.target.value})} placeholder="e.g. Digital Transformation, Cost Optimization" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-5 pt-4 border-t border-slate-100">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Key Achievement (Headline Impact)</label>
                                                    <input type="text" value={formData.key_achievement} onChange={e => setFormData({...formData, key_achievement: e.target.value})} placeholder="e.g. 20% Production Increase" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Monetized Impact (Overall)</label>
                                                    <input type="text" value={formData.monetized_impact} onChange={e => setFormData({...formData, monetized_impact: e.target.value})} placeholder="e.g. €8-9M material losses eliminated" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all" />
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Technologies Used</label>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {formData.technologies.map(tech => (
                                                                <span key={tech} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                                                                    {tech}
                                                                    <button onClick={() => removeTech(tech)} className="hover:text-red-500"><X size={12}/></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input type="text" value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }} placeholder="Add tech..." className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none" />
                                                            <button onClick={addTech} className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition">Add</button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Proprietary Frameworks</label>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {formData.proprietary_frameworks.map(fw => (
                                                                <span key={fw} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
                                                                    {fw}
                                                                    <button onClick={() => removeFramework(fw)} className="hover:text-red-500"><X size={12}/></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input type="text" value={frameworkInput} onChange={e => setFrameworkInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFramework(); } }} placeholder="e.g. ATPerf STRAP..." className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none" />
                                                            <button onClick={addFramework} className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition">Add</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <FileJson className="text-indigo-500" size={20}/> The Narrative (Three-Act Structure)
                                            </h3>

                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <label className="block text-sm font-bold text-slate-700">1. Executive Summary (The Hook)</label>
                                                    <span className={`text-xs font-semibold ${formData.hook.split(' ').length > 150 ? 'text-red-500' : 'text-slate-400'}`}>{formData.hook.split(' ').filter(w => w.length > 0).length} / 150 words</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mb-2">Punchy and concise. What was the "Big Win"? Lead with the headline.</p>
                                                <textarea value={formData.hook} onChange={e => setFormData({...formData, hook: e.target.value})} rows={3} placeholder="Describe the critical business bottleneck and the financial/operational risks of inaction..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all resize-none" />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">2. The Context (The Challenge)</label>
                                                <p className="text-xs text-slate-500 mb-2">What were the stakes? Why did this matter? What were the weak signals?</p>
                                                <textarea value={formData.problem_text} onChange={e => setFormData({...formData, problem_text: e.target.value})} rows={4} placeholder="The client faced a €2M annual loss due to downtime..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all resize-none" />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">3. The Intervention (The Approach)</label>
                                                <p className="text-xs text-slate-500 mb-2">Avoid just listing tools. Describe the proprietary methodology used to synchronize velocity with targets.</p>
                                                <textarea value={formData.methodology} onChange={e => setFormData({...formData, methodology: e.target.value})} rows={5} placeholder="Deployed the ATPerf Short Interval Control Framework..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all resize-none" />
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Why ATPerf? (The Differentiator)</label>
                                                <p className="text-xs text-slate-500 mb-2">What did ATPerf do that a generic IT firm couldn't?</p>
                                                <textarea value={formData.why_atperf} onChange={e => setFormData({...formData, why_atperf: e.target.value})} rows={3} placeholder="Our domain expertise in metallurgy allowed us to map the process correctly..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all resize-none" />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Voice of the Client (Testimonial)</label>
                                                <div className="space-y-3">
                                                    <textarea value={formData.testimonial_quote} onChange={e => setFormData({...formData, testimonial_quote: e.target.value})} rows={2} placeholder="“StrAP Workflow has transformed our supplier management...”" className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all resize-none" />
                                                    <input type="text" value={formData.testimonial_author} onChange={e => setFormData({...formData, testimonial_author: e.target.value})} placeholder="— Jean-Christophe Trontin, Head of Industrial Strategy" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <Activity className="text-indigo-500" size={20}/> The Impact (Data & Results)
                                            </h3>
                                            <p className="text-sm text-slate-500">Prioritize Relative and Monetized impact over raw numbers.</p>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Contextual Benchmarking</label>
                                                <p className="text-xs text-slate-500 mb-2">How does this result compare to industry standards?</p>
                                                <textarea value={formData.contextual_benchmarking} onChange={e => setFormData({...formData, contextual_benchmarking: e.target.value})} rows={2} placeholder="The 20% improvement puts the client in the top decile of manufacturing efficiency..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all resize-none" />
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                                {formData.metrics.map((m, i) => (
                                                    <div key={m.id} className="p-5 bg-white border border-slate-200 rounded-xl relative overflow-hidden group space-y-4">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1">
                                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Metric Name</label>
                                                                <input type="text" value={m.name} onChange={(e) => updateMetric(i, 'name', e.target.value)} placeholder="e.g. Scrap Losses" className="w-full border-b border-slate-200 focus:border-indigo-500 px-1 py-1.5 text-sm bg-transparent outline-none font-semibold" />
                                                            </div>
                                                            <div className="w-40">
                                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Value Type</label>
                                                                <select value={m.value_type} onChange={(e) => updateMetric(i, 'value_type', e.target.value)} className="w-full border-b border-slate-200 focus:border-indigo-500 px-1 py-1.5 text-sm bg-transparent outline-none">
                                                                    <option>Cost Reduction</option>
                                                                    <option>Revenue Growth</option>
                                                                    <option>Risk Mitigation</option>
                                                                    <option>Operational Excellence</option>
                                                                </select>
                                                            </div>
                                                            <button onClick={() => removeMetric(i)} className="p-2 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <div className="flex-1">
                                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Before</label>
                                                                <input type="text" value={m.before} onChange={(e) => updateMetric(i, 'before', e.target.value)} placeholder="8-9 M€" className="w-full border-b border-slate-200 focus:border-indigo-500 px-1 py-1.5 text-sm bg-transparent outline-none" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">After</label>
                                                                <input type="text" value={m.after} onChange={(e) => updateMetric(i, 'after', e.target.value)} placeholder="0" className="w-full border-b border-slate-200 focus:border-indigo-500 px-1 py-1.5 text-sm bg-transparent outline-none" />
                                                            </div>
                                                            <div className="flex-1 text-right pb-1.5">
                                                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">% Result</label>
                                                                <span className={`text-sm font-extrabold ${m.improvement.startsWith('+') || parseFloat(m.improvement)>0 ? 'text-green-600' : 'text-slate-700'}`}>
                                                                    {m.improvement || '—'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <div className="w-1/3">
                                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ann. Savings (Est)</label>
                                                                <input type="text" value={m.estimated_annualized_savings} onChange={(e) => updateMetric(i, 'estimated_annualized_savings', e.target.value)} placeholder="€8-9M" className="w-full border-b border-slate-200 focus:border-indigo-500 px-1 py-1.5 text-sm bg-transparent outline-none" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">The "So What?"</label>
                                                                <input type="text" value={m.so_what} onChange={(e) => updateMetric(i, 'so_what', e.target.value)} placeholder="Enabled deferral of €5M capex..." className="w-full border-b border-slate-200 focus:border-indigo-500 px-1 py-1.5 text-sm bg-transparent outline-none text-slate-600 italic" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <button onClick={addMetricRow} className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl font-semibold hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2 text-sm bg-slate-50/50">
                                                    <Plus size={16} /> Add Metric Row
                                                </button>
                                            </div>

                                            <div className="pt-6 border-t border-slate-100">
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Community Value (Pro-Tips / Best Practices)</label>
                                                <p className="text-xs text-slate-500 mb-2">What should another ATPerf member know if they implement this?</p>
                                                <textarea value={formData.pro_tips} onChange={e => setFormData({...formData, pro_tips: e.target.value})} rows={3} placeholder="Ensure shop-floor operators are involved..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all resize-none" />
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <Target className="text-indigo-500" size={20}/> Professional Visuals
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <label className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center hover:bg-slate-100 transition cursor-pointer flex-1 flex flex-col justify-center">
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                                                            if (e.target.files && e.target.files[0]) setThumbnailFile(e.target.files[0]);
                                                        }} />
                                                        <Upload size={24} className="mx-auto text-indigo-400 mb-2" />
                                                        <p className="text-sm font-bold text-slate-700">{thumbnailFile ? thumbnailFile.name : (formData.thumbnail_url ? 'Replace Thumbnail' : 'Upload Thumbnail Image')}</p>
                                                    </label>
                                                    <button onClick={() => openGallery('thumbnail')} className="py-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-xl flex items-center justify-center gap-2 transition-colors"><FolderOpen size={16}/> Browse Gallery</button>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center hover:bg-slate-100 transition cursor-pointer flex-1 flex flex-col justify-center">
                                                        <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
                                                            if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                                                        }} />
                                                        <Upload size={24} className="mx-auto text-indigo-400 mb-2" />
                                                        <p className="text-sm font-bold text-slate-700">{file ? file.name : (draftBaseMedia.img || draftBaseMedia.vid ? 'Replace Main Media (Video/Img)' : 'Main Demo Media')}</p>
                                                    </label>
                                                    <button onClick={() => openGallery('mainMedia')} className="py-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-xl flex items-center justify-center gap-2 transition-colors"><FolderOpen size={16}/> Browse Gallery</button>
                                                </div>

                                                <div className="md:col-span-2 flex flex-col gap-2">
                                                    <label className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-indigo-50/50 text-center hover:bg-indigo-50 transition cursor-pointer flex-1 flex flex-col justify-center">
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                                                            if (e.target.files && e.target.files[0]) setInfographicFile(e.target.files[0]);
                                                        }} />
                                                        <Upload size={24} className="mx-auto text-indigo-500 mb-2" />
                                                        <p className="text-sm font-bold text-indigo-900">{infographicFile ? infographicFile.name : (formData.infographic_url ? 'Replace Executive Hero Infographic' : 'Upload Project High-Level Infographic (Optional)')}</p>
                                                        <p className="text-xs text-indigo-500 mt-1">A single "Hero" infographic that summarizes the whole project.</p>
                                                    </label>
                                                    <button onClick={() => openGallery('infographic')} className="py-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-xl flex items-center justify-center gap-2 transition-colors"><FolderOpen size={16}/> Browse Gallery</button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-5 pt-4">
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Exhibit Title</label>
                                                    <input type="text" value={formData.exhibit_title} onChange={e => setFormData({...formData, exhibit_title: e.target.value})} placeholder="e.g. Exhibit 1: Correlation between SIC adherence and Daily Throughput" className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Exhibit Subtext / Media Caption</label>
                                                    <input type="text" value={formData.media_caption} onChange={e => setFormData({...formData, media_caption: e.target.value})} placeholder="Short description of what the visual proves..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 5 && (
                                        <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                                <div className="absolute -right-10 -top-10 text-white/10"><CheckCircle2 size={120}/></div>
                                                <h3 className="text-2xl font-black mb-2 relative z-10">Ready to Publish?</h3>
                                                <p className="text-indigo-100/80 mb-6 text-sm relative z-10">Ensure the narrative meets ATPerf's consulting standards.</p>
                                                
                                                <div className="bg-white/10 rounded-xl p-4 space-y-3 relative z-10">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-indigo-200">Project Title:</span>
                                                        <span className="font-bold">{draftTitle || '—'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-indigo-200">Company / Sector:</span>
                                                        <span className="font-bold">{draftCompany || '—'} / {formData.industry}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-indigo-200">Narrative blocks:</span>
                                                        <span className="font-bold">{[formData.hook, formData.problem_text, formData.methodology].filter(Boolean).length} completed</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-indigo-200">Data Proofs (Metrics):</span>
                                                        <span className="font-bold">{formData.metrics.length} mapped</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
                                                <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2">
                                                    <Shield size={16}/> Public Readiness & Compliance
                                                </h4>
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input type="checkbox" checked={formData.is_sanitized} onChange={(e) => setFormData({...formData, is_sanitized: e.target.checked})} className="mt-1 w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                                    <span className="text-sm font-medium text-amber-800/80 leading-snug">
                                                        I confirm that this case study meets professional standards and I have removed sensitive/confidential client system data (URLs, secret keys, proprietary internal names) from the screenshots and dataset before publishing.
                                                    </span>
                                                </label>
                                            </div>

                                            <div className="flex gap-4">
                                                <button onClick={() => handleSave('draft')} disabled={uploading} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex justify-center items-center gap-2">
                                                    {uploading && draftStatus === 'draft' ? <Loader2 size={16} className="animate-spin text-slate-500"/> : null}
                                                    Save as Draft
                                                </button>
                                                <button onClick={() => handleSave('published')} disabled={uploading} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition shadow-md shadow-green-600/20 flex justify-center items-center gap-2">
                                                    {uploading && draftStatus !== 'draft' ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                                                    Publish Use Case
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                Step {currentStep} of {totalSteps}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                                    disabled={currentStep === 1}
                                    className="px-5 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                                    disabled={currentStep === totalSteps}
                                    className="px-5 py-2 rounded-lg font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 transition-colors flex items-center gap-1"
                                >
                                    Next <ChevronRight size={16}/>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 sm:p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 animate-pulse">
                                <Trash2 size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-3">Delete Use Case?</h2>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Are you absolutely sure you want to delete this case study? This action cannot be undone and will permanently remove all associated data and media.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end items-center">
                            <button 
                                onClick={() => setDeleteConfirmId(null)} 
                                className="px-5 py-2.5 rounded-xl text-slate-700 font-bold hover:bg-slate-200 bg-white border border-slate-200 transition-colors text-sm flex-1 sm:flex-none shadow-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDelete(deleteConfirmId)} 
                                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-md shadow-red-600/20 transition-colors text-sm flex-1 sm:flex-none"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isGalleryOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto flex flex-col h-full max-h-[85vh] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FolderOpen className="text-indigo-600" size={28} />
                        {lang === 'fr' ? 'Gestion des Cas d\'Usage' : 'Use Cases Management'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {lang === 'fr' ? 'Créez et modifiez des cas d\'usage et des témoignages clients.' : 'Create, edit, and manage client use cases and testimonials.'}
                    </p>
                            </div>
                            <button onClick={() => setIsGalleryOpen(false)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-6 px-6 border-b border-slate-200 bg-slate-50">
                            <button onClick={() => setGalleryTab('photos')} className={`py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${galleryTab === 'photos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                <ImageIcon size={16} /> Photos ({galleryData.photos.length})
                            </button>
                            <button onClick={() => setGalleryTab('videos')} className={`py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${galleryTab === 'videos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                <Film size={16} /> Videos ({galleryData.videos.length})
                            </button>
                            <button onClick={() => setGalleryTab('pdfs')} className={`py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${galleryTab === 'pdfs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                <FileText size={16} /> PDFs ({galleryData.pdfs.length})
                            </button>
                            <button onClick={() => setGalleryTab('logos')} className={`py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${galleryTab === 'logos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                <ImageIcon size={16} /> Logos ({galleryData.logos?.length ?? 0})
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                            {loadingGallery ? (
                                <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {galleryTab === 'photos' && galleryData.photos.map(item => (
                                        <div key={item.url} onClick={() => selectFromGallery(item.url, 'photo')} className="bg-white border border-slate-200 rounded-xl p-2 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group">
                                            <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 mb-2">
                                                <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div className="text-xs font-semibold text-slate-700 truncate px-1" title={item.name}>{item.name}</div>
                                            <div className="text-[10px] text-slate-400 px-1 truncate">{item.folder}</div>
                                        </div>
                                    ))}
                                    {galleryTab === 'logos' && (galleryData.logos ?? []).map(item => (
                                        <div key={item.url} onClick={() => selectFromGallery(item.url, 'photo')} className="bg-white border border-slate-200 rounded-xl p-2 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group">
                                            <div className="aspect-video rounded-lg overflow-hidden bg-slate-50 mb-2 flex items-center justify-center">
                                                <img src={item.url} alt={item.name} className="max-h-16 object-contain group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div className="text-xs font-semibold text-slate-700 truncate px-1" title={item.name}>{item.name}</div>
                                            <div className="text-[10px] text-slate-400 px-1 truncate">{item.folder}</div>
                                        </div>
                                    ))}
                                    {galleryTab === 'videos' && galleryData.videos.map(item => (
                                        <div key={item.url} onClick={() => selectFromGallery(item.url, 'video')} className="bg-white border border-slate-200 rounded-xl p-2 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group">
                                            <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 mb-2 relative">
                                                <video src={item.url} className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute inset-0 flex items-center justify-center"><Film className="text-white/50" size={24}/></div>
                                            </div>
                                            <div className="text-xs font-semibold text-slate-700 truncate px-1" title={item.name}>{item.name}</div>
                                            <div className="text-[10px] text-slate-400 px-1 truncate">{item.folder}</div>
                                        </div>
                                    ))}
                                    {galleryTab === 'pdfs' && galleryData.pdfs.map(item => (
                                        <div key={item.url} onClick={() => selectFromGallery(item.url, 'pdf')} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group aspect-square">
                                            <FileText size={40} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                            <div className="text-center w-full">
                                                <div className="text-xs font-semibold text-slate-700 truncate" title={item.name}>{item.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate mt-1">{item.folder}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {galleryData[galleryTab].length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-400 text-sm font-medium">No {galleryTab} found in the media library.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Ensure Shield exists
function Shield(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
