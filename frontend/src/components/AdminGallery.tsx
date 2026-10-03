import { useState, useCallback, useEffect } from 'react';
import { Loader2, Upload, Trash2, Copy, Check, Image as ImageIcon, Film, FileText, FolderOpen, AlertTriangle } from 'lucide-react';
import API_URL from '../utils/apiUrl';

type MediaTab = 'photos' | 'videos' | 'pdfs' | 'logos';

interface MediaItem {
    name: string;
    url: string;
    folder: string;
    created: number;
}

interface GalleryData {
    photos: MediaItem[];
    videos: MediaItem[];
    pdfs: MediaItem[];
    logos: MediaItem[];
}

const TAB_CONFIG: { key: MediaTab; label: string; icon: typeof ImageIcon; accept: string }[] = [
    { key: 'photos',  label: 'Photos',  icon: ImageIcon, accept: 'image/*' },
    { key: 'videos',  label: 'Videos',  icon: Film,      accept: 'video/*' },
    { key: 'pdfs',    label: 'PDFs',    icon: FileText,  accept: 'application/pdf' },
    { key: 'logos',   label: 'Logos',   icon: ImageIcon, accept: 'image/*' },
];

export default function AdminGallery() {
    const [activeTab, setActiveTab] = useState<MediaTab>('photos');
    const [gallery, setGallery] = useState<GalleryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');

    const fetchGallery = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/use-cases/gallery`);
            if (!res.ok) throw new Error('Failed to load media gallery');
            const data = await res.json();
            setGallery(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on first render
    useEffect(() => { fetchGallery(); }, []);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setError('');
        try {
            for (const file of Array.from(files)) {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('company_name', '');
                const res = await fetch(`${API_URL}/use-cases/upload`, { method: 'POST', body: fd });
                if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
            }
            await fetchGallery();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`${API_URL}/use-cases/gallery/file?url=${encodeURIComponent(deleteTarget.url)}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete file');
            setDeleteTarget(null);
            await fetchGallery();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    }, []);

    const currentItems = gallery ? gallery[activeTab] : [];
    const tabConfig = TAB_CONFIG.find(t => t.key === activeTab)!;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <FolderOpen size={22} className="text-indigo-500" /> Media Library
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Centralized repository for all ATPerf media assets.</p>
                </div>
                <button onClick={fetchGallery} disabled={loading} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                    <Loader2 size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Icon size={15} />
                        {label}
                        {gallery && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                {gallery[key].length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Upload Drop Zone */}
            <label
                className={`relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
            >
                <input
                    type="file"
                    className="hidden"
                    multiple
                    accept={tabConfig.accept}
                    onChange={e => handleUpload(e.target.files)}
                />
                {uploading ? (
                    <><Loader2 size={28} className="animate-spin text-indigo-500" /><p className="text-sm font-semibold text-indigo-600">Uploading…</p></>
                ) : (
                    <>
                        <Upload size={28} className={dragOver ? 'text-indigo-500' : 'text-slate-400'} />
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-700">Drop {tabConfig.label.toLowerCase()} here or click to upload</p>
                            <p className="text-xs text-slate-400 mt-1">Files will be automatically saved to /media/{activeTab === 'photos' ? 'images' : activeTab}/</p>
                        </div>
                    </>
                )}
            </label>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
            ) : currentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <tabConfig.icon size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-semibold">No {tabConfig.label.toLowerCase()} in the library yet.</p>
                    <p className="text-xs mt-1">Upload files using the dropzone above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {currentItems.map(item => (
                        <div key={item.url} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all">
                            {/* Preview */}
                            <div className="aspect-square bg-slate-100 overflow-hidden relative">
                                {(activeTab === 'photos' || activeTab === 'logos') ? (
                                    <img src={item.url} alt={item.name} className="w-full h-full object-contain p-2" />
                                ) : activeTab === 'videos' ? (
                                    <>
                                        <video src={item.url} className="w-full h-full object-cover opacity-80" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Film className="text-white/70 drop-shadow" size={28} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                        <FileText size={36} className="text-red-400" />
                                        <span className="text-xs font-bold text-red-500 uppercase">PDF</span>
                                    </div>
                                )}
                            </div>

                            {/* Info & Actions */}
                            <div className="p-2">
                                <p className="text-xs font-semibold text-slate-700 truncate mb-2" title={item.name}>{item.name}</p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => copyUrl(item.url)}
                                        title="Copy URL"
                                        className="flex-1 flex items-center justify-center gap-1 py-1 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        {copiedUrl === item.url ? <><Check size={12} className="text-green-500" /> Copied</> : <><Copy size={12} /> Copy URL</>}
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(item)}
                                        title="Delete"
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Delete File?</h3>
                                <p className="text-sm text-slate-500">This cannot be undone.</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-700 truncate">{deleteTarget.name}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{deleteTarget.url}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors shadow-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
