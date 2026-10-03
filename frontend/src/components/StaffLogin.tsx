import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft, Loader2, Eye, EyeOff, Shield } from 'lucide-react';

import API_URL from '../utils/apiUrl';

const translations = {
    en: {
        back: "Back",
        title: "Staff Login",
        subtitle: "Internal access for atperf.com team",
        email: "Email",
        password: "Password",
        loggingIn: "Logging in...",
        logInBtn: "Staff Login",
        noAccount: "New staff member?",
        signUpLink: "Register here",
        forgotPassword: "Forgot password?",
        forgotTitle: "Recover Password",
        forgotDesc: "Enter your staff email. We'll send you an OTP.",
        sendOtp: "Send OTP",
        resetTitle: "Reset Password",
        resetDesc: "Enter the OTP sent to your email.",
        otp: "OTP Code",
        newPassword: "New Password",
        confirmPassword: "Confirm Password",
        resetBtn: "Update Password",
        successMsg: "Password updated successfully! You can now log in."
    },
    fr: {
        back: "Retour",
        title: "Portail du Personnel",
        subtitle: "Accès interne pour l'équipe atperf.com",
        email: "Email",
        password: "Mot de passe",
        loggingIn: "Connexion...",
        logInBtn: "Connexion Personnel",
        noAccount: "Nouveau membre du personnel ?",
        signUpLink: "Inscrivez-vous ici",
        forgotPassword: "Mot de passe oublié ?",
        forgotTitle: "Récupérer le mot de passe",
        forgotDesc: "Entrez votre email. Nous vous enverrons un code OTP.",
        sendOtp: "Envoyer l'OTP",
        resetTitle: "Réinitialiser le mot de passe",
        resetDesc: "Entrez le code OTP reçu par email.",
        otp: "Code OTP",
        newPassword: "Nouveau mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        resetBtn: "Mettre à jour le mot de passe",
        successMsg: "Mot de passe mis à jour ! Vous pouvez vous connecter."
    }
};

export default function StaffLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [view, setView] = useState<'login' | 'forgot_password' | 'reset_password'>('login');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [lang] = useState<'en' | 'fr'>(() => {
        const saved = localStorage.getItem('strap_lang');
        return (saved === 'fr' ? 'fr' : 'en');
    });
    const t = translations[lang];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/staff/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || `Login failed (${res.status})`);
            }
            localStorage.setItem('proextract_staff', JSON.stringify(data));
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/staff/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || `Request failed`);
            }
            setView('reset_password');
        } catch (err: any) {
            setError(err.message || 'Request failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/staff/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, new_password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || `Reset failed`);
            }
            // Success
            setSuccessMsg(t.successMsg);
            setView('login');
            setPassword('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Reset failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium">
                    <ArrowLeft size={16} /> {t.back}
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg"><Zap size={16} className="fill-white" /></div>
                    <span className="font-bold text-slate-900 tracking-tight">StrAP Tools</span>
                </div>
                <div />
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-8 max-w-md w-full">
                    {successMsg && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                            {successMsg}
                        </div>
                    )}
                    
                    {view === 'login' && (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-slate-800 p-2 rounded-xl"><Shield size={20} className="text-white" /></div>
                                <div>
                                    <h1 className="text-2xl font-extrabold text-slate-900">{t.title}</h1>
                                    <p className="text-xs text-slate-500">{t.subtitle}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.email}</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@atperf.com"
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-semibold text-slate-700">{t.password}</label>
                                        <button 
                                            type="button" 
                                            onClick={() => { setView('forgot_password'); setError(''); setSuccessMsg(''); }}
                                            className="text-xs text-indigo-600 font-semibold hover:underline"
                                        >
                                            {t.forgotPassword}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loading ? <><Loader2 size={16} className="animate-spin" /> {t.loggingIn}</> : t.logInBtn}
                                </button>
                            </form>
                            <p className="text-sm text-center text-slate-500 mt-5">
                                {t.noAccount}{' '}
                                <button onClick={() => navigate('/staff/register')} className="text-indigo-600 font-semibold hover:underline">
                                    {t.signUpLink}
                                </button>
                            </p>
                        </>
                    )}

                    {view === 'forgot_password' && (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <button onClick={() => { setView('login'); setError(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <ArrowLeft size={16} className="text-slate-500" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-extrabold text-slate-900">{t.forgotTitle}</h1>
                                    <p className="text-xs text-slate-500">{t.forgotDesc}</p>
                                </div>
                            </div>
                            <form onSubmit={handleForgotPassword} className="space-y-4 mt-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.email}</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@atperf.com"
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                    />
                                </div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : null} {t.sendOtp}
                                </button>
                            </form>
                        </>
                    )}

                    {view === 'reset_password' && (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <button onClick={() => { setView('forgot_password'); setError(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <ArrowLeft size={16} className="text-slate-500" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-extrabold text-slate-900">{t.resetTitle}</h1>
                                    <p className="text-xs text-slate-500">{t.resetDesc}</p>
                                </div>
                            </div>
                            <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.otp}</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="123456"
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 tracking-widest font-mono font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.newPassword}</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.confirmPassword}</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading || !otp || !newPassword || !confirmPassword}
                                    className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : null} {t.resetBtn}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
