import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

import API_URL from '../utils/apiUrl';

const translations = {
    en: {
        back: "Back",
        title: "Welcome to your Digital Space",
        subtitle: "Log in to continue",
        email: "Email",
        password: "Password",
        loggingIn: "Logging in...",
        logInBtn: "Log in",
        noAccount: "Don't have an account?",
        signUpLink: "Sign up here",
        forgotPwd: "Forgot password?",
        forgotTitle: "Reset Password",
        forgotDesc: "Enter your email address and we'll send you an OTP.",
        sendOtp: "Send OTP",
        sending: "Sending...",
        enterOtp: "Enter 6-digit OTP",
        otpSent: "An OTP snippet has been sent to your email.",
        verifyOtp: "Reset Password",
        newPwd: "New Password",
        resetPwd: "Reset Password",
        backToLogin: "Back to login"
    },
    fr: {
        back: "Retour",
        title: "Bienvenue dans votre Espace Digital",
        subtitle: "Connectez-vous pour continuer",
        email: "Email",
        password: "Mot de passe",
        loggingIn: "Connexion...",
        logInBtn: "Se connecter",
        noAccount: "Vous n'avez pas de compte ?",
        signUpLink: "Inscrivez-vous ici",
        forgotPwd: "Mot de passe oublié ?",
        forgotTitle: "Réinitialiser le mot de passe",
        forgotDesc: "Entrez votre email et nous vous enverrons un code OTP.",
        sendOtp: "Envoyer OTP",
        sending: "Envoi en cours...",
        enterOtp: "Entrez le code OTP à 6 chiffres",
        otpSent: "Un code OTP a été envoyé à votre email.",
        verifyOtp: "Réinitialiser le mot de passe",
        newPwd: "Nouveau mot de passe",
        resetPwd: "Réinitialiser",
        backToLogin: "Retour à la connexion"
    }
};

type Step = 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_reset';

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [step, setStep] = useState<Step>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [lang] = useState<'en' | 'fr'>(() => {
        const saved = localStorage.getItem('strap_lang');
        return (saved === 'fr' ? 'fr' : 'en');
    });
    const t = translations[lang];

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(''); setInfo('');
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || `Login failed`);
            
            localStorage.setItem('proextract_user', JSON.stringify(data));
            setInfo(`Welcome back, ${data.first_name}.`);
            // Return to the page that asked for a login (internal paths only, never another site).
            const redirect = searchParams.get('redirect');
            if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
                navigate(redirect);
            } else if (data.role === 'admin' || data.role === 'super_admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(''); setInfo('');
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || `Failed to send OTP`);
            
            setInfo(t.otpSent);
            setStep('forgot_otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(''); setInfo('');
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, new_password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || `Failed to reset password`);
            
            setStep('login');
            setPassword('');
            setOtp('');
            setNewPassword('');
            setInfo("Password reset successful. Please log in with your new password.");
        } catch (err: any) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
                    <ArrowLeft size={16} /> {t.back}
                </button>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FF6B00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10 max-w-md w-full relative z-10 transition-all">
                    <div className="flex justify-center mb-8">
                        <img src="/Logo_Atperf_transpart.png" alt="Atperf" className="h-10 w-auto object-contain" />
                    </div>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
                            {step === 'login' ? t.title : t.forgotTitle}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {step === 'login' ? t.subtitle : t.forgotDesc}
                        </p>
                    </div>

                    {step === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.email}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.password}</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute inset-y-0 right-0 top-[28px] flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">{error}</div>}
                            {info && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 font-medium">{info}</div>}

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/25 hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-3"
                                >
                                    {loading ? <><Loader2 size={18} className="animate-spin" /> {t.loggingIn}</> : t.logInBtn}
                                </button>
                                <div className="text-center">
                                    <button type="button" onClick={() => {setStep('forgot_email'); setError(''); setInfo('');}} className="text-sm font-semibold text-slate-500 hover:text-[#FF6B00] transition-colors whitespace-nowrap">
                                        {t.forgotPwd}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 'forgot_email' && (
                        <form onSubmit={handleSendRestOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.email}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                    placeholder="you@example.com"
                                />
                            </div>
                            
                            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">{error}</div>}

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/25 hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-3"
                                >
                                    {loading ? <><Loader2 size={18} className="animate-spin" /> {t.sending}</> : t.sendOtp}
                                </button>
                                <div className="text-center">
                                    <button type="button" onClick={() => {setStep('login'); setError(''); setInfo('');}} className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">
                                        {t.backToLogin}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 'forgot_otp' && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {info && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 font-medium mb-4">{info}</div>}
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.enterOtp}</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white tracking-widest font-mono"
                                    placeholder="123456"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.newPwd}</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute inset-y-0 right-0 top-[28px] flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">{error}</div>}

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/25 hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-3"
                                >
                                    {loading ? <><Loader2 size={18} className="animate-spin" /> {t.sending}</> : t.resetPwd}
                                </button>
                                <div className="text-center">
                                    <button type="button" onClick={() => {setStep('login'); setError(''); setInfo('');}} className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">
                                        {t.backToLogin}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 'login' && (
                        <p className="text-sm text-center text-slate-500 mt-8 font-medium">
                            {t.noAccount}{' '}
                            <button onClick={() => navigate('/register')} className="text-[#FF6B00] font-bold hover:text-[#E66000] transition-colors hover:underline">
                                {t.signUpLink}
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

