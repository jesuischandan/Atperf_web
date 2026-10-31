import React, { useState, useEffect } from 'react';
import { X, Loader2, Trash2, AlertTriangle, ShieldCheck, MailWarning, Building, CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import API_URL from '../utils/apiUrl';
import { logout as endSession } from '../utils/apiClient';

interface User {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
    company_id: string;
    company_name?: string;
    plan_type?: string;
    credit_balance?: number;
    total_reports_generated?: number;
    is_email_verified?: number;
    created_at?: string;
}

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onUpdate: (updatedUser: User) => void;
}

export default function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
    const navigate = useNavigate();

    // Data State
    const [fullUser, setFullUser] = useState<User>(user);
    const [loadingData, setLoadingData] = useState(true);

    // Profile form state
    const [firstName, setFirstName] = useState(user.first_name || '');
    const [lastName, setLastName] = useState(user.last_name || '');
    const [email, setEmail] = useState(user.email || '');

    // Tabs
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing'>('profile');

    // Messages
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Delete state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Password Change State
    const [pwdFlowState, setPwdFlowState] = useState<'idle' | 'sending_otp' | 'entering_otp' | 'success'>('idle');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_URL}/users/${user.user_id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFullUser(data);
                    setFirstName(data.first_name);
                    setLastName(data.last_name);
                    setEmail(data.email);
                }
            } catch (err) {
                console.error("Failed to fetch user details", err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchUser();
    }, [user.user_id]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`${API_URL}/users/${user.user_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ first_name: firstName, last_name: lastName, email }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || `Update failed (${res.status})`);
            }

            setSuccess('Profile updated successfully!');
            setFullUser({...fullUser, ...data});
            onUpdate(data);
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/users/${fullUser.user_id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to delete account');
            }
            endSession('user');
            navigate('/');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to delete account');
            setShowDeleteConfirm(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Password OTP Flow
    const handleSendOtp = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fullUser.email })
            });
            if (!res.ok) throw new Error('Failed to send OTP.');
            setPwdFlowState('entering_otp');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fullUser.email, otp, new_password: newPassword })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to reset password.');
            
            setPwdFlowState('success');
            setOtp('');
            setNewPassword('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl flex items-center gap-3">
                    <Loader2 className="animate-spin text-[#FF6B00]" size={24} />
                    <span className="font-semibold text-slate-700">Loading Profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-slate-50 overflow-hidden">
            {/* Sidebar / Left Side */}
            <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm relative z-10">
                <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
                    <h2 className="text-2xl font-extrabold text-slate-900">Account</h2>
                    <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                {/* Tabs */}
                <div className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
                    <button onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }} className={`text-left px-5 py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${activeTab === 'profile' ? 'bg-[#FFF8F4] text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>Profile Info</button>
                    <button onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }} className={`text-left px-5 py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${activeTab === 'security' ? 'bg-[#FFF8F4] text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>Security</button>
                    <button onClick={() => { setActiveTab('billing'); setError(''); setSuccess(''); }} className={`text-left px-5 py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${activeTab === 'billing' ? 'bg-[#FFF8F4] text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>Billing & Usage</button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto relative w-full">
                {/* Desktop Close Button */}
                <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm z-20">
                    <X size={20} />
                </button>
                
                <div className="max-w-3xl mx-auto p-6 md:p-10 lg:py-16">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 md:p-8">
                            {/* --- PROFILE INFO TAB --- */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40" />
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 mt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Account Metadata</h4>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-2"><Building size={16}/> Company Name</span>
                                    <span className="font-semibold text-slate-800">{fullUser.company_name || 'Independent / N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                                    <span className="text-slate-500">Member Since</span>
                                    <span className="font-medium text-slate-700">
                                        {fullUser.created_at ? new Date(fullUser.created_at).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                                    <span className="text-slate-500">Status</span>
                                    <span className={`font-semibold capitalize ${fullUser.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>{fullUser.status}</span>
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                            {success && <p className="text-sm text-emerald-600 font-medium bg-emerald-50 p-2 rounded-lg">{success}</p>}

                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                                <button type="button" onClick={() => setShowDeleteConfirm(true)}
                                    className="text-sm font-semibold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                                    <Trash2 size={16} /> Delete Account
                                </button>
                                <button type="submit" disabled={loading || (firstName === fullUser.first_name && lastName === fullUser.last_name && email === fullUser.email)}
                                    className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#E66000] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- SECURITY TAB --- */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* Email Verification Status */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {fullUser.is_email_verified === 1 ? (
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <ShieldCheck size={20} />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                            <MailWarning size={20} />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Email Verification</h3>
                                        <p className="text-xs text-slate-500">
                                            {fullUser.is_email_verified === 1 ? 'Your email address is verified.' : 'Your email address is not verified.'}
                                        </p>
                                    </div>
                                </div>
                                {fullUser.is_email_verified !== 1 && (
                                    <button className="text-xs font-bold text-[#FF6B00] bg-[#FFF8F4] px-3 py-1.5 rounded-lg border border-orange-200">
                                        Verify Now
                                    </button>
                                )}
                            </div>

                            {/* Password Change Section */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="p-4 bg-white flex items-center gap-3 border-b border-slate-100">
                                    <Lock size={20} className="text-slate-400" />
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Change Password</h3>
                                        <p className="text-xs text-slate-500">Securely update your password using OTP verification.</p>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-slate-50">
                                    {pwdFlowState === 'idle' && (
                                        <div className="text-center py-2">
                                            <p className="text-sm text-slate-600 mb-4">To change your password, we'll first send a One-Time Password (OTP) to your email <strong>{fullUser.email}</strong> to verify your identity.</p>
                                            <button onClick={handleSendOtp} disabled={loading}
                                                className="bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 mx-auto">
                                                {loading && <Loader2 size={16} className="animate-spin" />}
                                                Send Verification Code
                                            </button>
                                        </div>
                                    )}

                                    {pwdFlowState === 'entering_otp' && (
                                        <form onSubmit={handleResetPassword} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Enter OTP Code</label>
                                                <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B00] text-center tracking-widest font-mono" placeholder="123456" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                                                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6}
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B00]" placeholder="••••••••" />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button type="button" onClick={() => setPwdFlowState('idle')} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100">Cancel</button>
                                                <button type="submit" disabled={loading} className="flex-1 bg-[#FF6B00] text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-[#E66000] flex items-center justify-center gap-2">
                                                    {loading && <Loader2 size={16} className="animate-spin" />} Update Password
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {pwdFlowState === 'success' && (
                                        <div className="text-center py-4 text-emerald-600">
                                            <CheckCircle2 size={32} className="mx-auto mb-2" />
                                            <h4 className="font-bold text-lg mb-1">Password Updated</h4>
                                            <p className="text-sm text-emerald-700/80">Your password has been changed successfully.</p>
                                        </div>
                                    )}

                                    {error && <p className="text-sm text-red-600 mt-3 text-center bg-red-50 p-2 rounded-lg">{error}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- BILLING & USAGE TAB --- */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            {/* Current Plan Card */}
                            <div className="bg-white border-2 border-[#FF6B00] rounded-2xl overflow-hidden shadow-sm relative">
                                <div className="absolute top-0 right-0 bg-[#FF6B00] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">Current Plan</div>
                                <div className="p-5">
                                    <h3 className="text-2xl font-extrabold text-slate-900 capitalize mb-1">{fullUser.plan_type || 'Free'} Plan</h3>
                                    <p className="text-sm text-slate-500 mb-6">You are currently enjoying the essential StrAP Tool Suite.</p>
                                    
                                    <div className="flex flex-col gap-3">
                                        <button disabled className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold border border-slate-200 cursor-not-allowed">
                                            Premium - Coming Soon
                                        </button>
                                        <button onClick={() => { onClose(); navigate('/contact'); window.scrollTo(0,0); }}
                                            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
                                            Upgrade to Enterprise
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Credits Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-[#FF6B00] shrink-0 border border-orange-100">
                                    <CreditCard size={24} />
                                </div>
                                <div className="flex-1 flex gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Available Credits</h4>
                                        <div className="text-3xl font-extrabold text-slate-800">{fullUser.credit_balance || 0}</div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Reports Generated</h4>
                                        <div className="text-3xl font-extrabold text-slate-500">{fullUser.total_reports_generated || 0}</div>
                                    </div>
                                </div>
                                <button className="shrink-0 px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:text-[#FF6B00] hover:border-[#FF6B00] rounded-xl transition-all shadow-sm">
                                    Buy Credits
                                </button>
                            </div>
                        </div>
                    )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden text-center animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Account?</h2>
                            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                                This action cannot be undone. All your data, credits, and history will be permanently deleted.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                    className="w-full bg-red-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-red-500 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {deleteLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleteLoading}
                                    className="w-full bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
