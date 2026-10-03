import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft, Loader2, Eye, EyeOff, Shield, KeyRound } from 'lucide-react';

import API_URL from '../utils/apiUrl';

const translations = {
    en: {
        back: "Back",
        title: "Staff Registration",
        subtitle: "Internal access — @atperf.com emails only",
        firstName: "First name",
        lastName: "Last name",
        email: "Work email",
        password: "Password",
        submitting: "Submitting...",
        submitBtn: "Register as Staff",
        hasAccount: "Already have access?",
        logInLink: "Staff Login",
        verifyTitle: "Verify Your Email",
        verifySubtitle: "We sent a 6-digit code to ",
        verifyEnter: ". Enter it below.",
        verifying: "Verifying...",
        verifyBtn: "Verify Code",
        goToLogin: "Go to Staff Login"
    },
    fr: {
        back: "Retour",
        title: "Inscription du Personnel",
        subtitle: "Accès interne — emails @atperf.com uniquement",
        firstName: "Prénom",
        lastName: "Nom",
        email: "Email professionnel",
        password: "Mot de passe",
        submitting: "Soumission...",
        submitBtn: "S'inscrire",
        hasAccount: "Vous avez déjà accès ?",
        logInLink: "Connexion Personnel",
        verifyTitle: "Vérifiez votre Email",
        verifySubtitle: "Nous avons envoyé un code à 6 chiffres à ",
        verifyEnter: ". Entrez-le ci-dessous.",
        verifying: "Vérification...",
        verifyBtn: "Vérifier le code",
        goToLogin: "Aller à la connexion personnel"
    }
};

export default function StaffRegister() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OTP step
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');

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
            const res = await fetch(`${API_URL}/staff/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || `Registration failed (${res.status})`);
            }
            // Transition to OTP step
            setShowOTP(true);
        } catch (err: any) {
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setOtpLoading(true);
        setOtpError('');
        setOtpSuccess('');
        try {
            const res = await fetch(`${API_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || 'Verification failed.');
            }
            setOtpSuccess('Email verified! Your account is now pending admin approval. You will be notified once approved.');
        } catch (err: any) {
            setOtpError(err.message || 'Verification failed.');
        } finally {
            setOtpLoading(false);
        }
    };

    if (showOTP) {
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
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-8 max-w-md w-full text-center">
                        <div className="bg-indigo-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound size={24} className="text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 mb-2">{t.verifyTitle}</h2>
                        <p className="text-sm text-slate-500 mb-6">{t.verifySubtitle}<strong>{email}</strong>{t.verifyEnter}</p>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 mb-4"
                        />
                        {otpError && <p className="text-sm text-red-600 mb-3">{otpError}</p>}
                        {otpSuccess && <p className="text-sm text-emerald-600 mb-3 bg-emerald-50 p-3 rounded-lg">{otpSuccess}</p>}
                        {!otpSuccess && (
                            <button
                                onClick={handleVerifyOTP}
                                disabled={otpLoading || otp.length !== 6}
                                className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                {otpLoading ? <><Loader2 size={16} className="animate-spin" /> {t.verifying}</> : t.verifyBtn}
                            </button>
                        )}
                        {otpSuccess && (
                            <button
                                onClick={() => navigate('/staff/login')}
                                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-500 transition-all mt-2"
                            >
                                {t.goToLogin}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-8 max-w-lg w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-slate-800 p-2 rounded-xl"><Shield size={20} className="text-white" /></div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900">{t.title}</h1>
                            <p className="text-xs text-slate-500">{t.subtitle}</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.firstName}</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.lastName}</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                />
                            </div>
                        </div>
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
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.password}</label>
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
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> {t.submitting}</> : t.submitBtn}
                        </button>
                    </form>
                    <p className="text-sm text-center text-slate-500 mt-5">
                        {t.hasAccount}{' '}
                        <button onClick={() => navigate('/staff/login')} className="text-indigo-600 font-semibold hover:underline">
                            {t.logInLink}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
