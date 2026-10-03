import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

import API_URL from '../utils/apiUrl';

const translations = {
    en: {
        back: "Back",
        title: "Create your Digital Space",
        subtitle: "Register and verify your email to get started.",
        firstName: "First name",
        lastName: "Last name",
        email: "Work email",
        password: "Password",
        company: "Company name",
        industry: "Industry",
        location: "Your Location",
        submitting: "Creating account...",
        submitBtn: "Create Account",
        hasAccount: "Already have an account?",
        logInLink: "Log in here",
        verifyTitle: "Verify Your Email",
        verifySubtitle: "We sent a 6-digit code to ",
        verifyEnter: ". Enter it below.",
        verifying: "Verifying...",
        verifyBtn: "Verify Code",
        goToLogin: "Log in now",
        acceptTermsPrefix: "I accept the ",
        termsLink: "Terms and Conditions",
        acceptTermsAnd: " and ",
        privacyLink: "Privacy Policy",
        acceptTermsError: "You must accept the terms and policies to register."
    },
    fr: {
        back: "Retour",
        title: "Créez votre Espace Digital",
        subtitle: "Inscrivez-vous et vérifiez votre email pour commencer.",
        firstName: "Prénom",
        lastName: "Nom",
        email: "Email professionnel",
        password: "Mot de passe",
        company: "Nom de l'entreprise",
        industry: "Secteur d'activité",
        location: "Votre position",
        submitting: "Création du compte...",
        submitBtn: "Créer un compte",
        hasAccount: "Vous avez déjà un compte ?",
        logInLink: "Connectez-vous ici",
        verifyTitle: "Vérifiez votre Email",
        verifySubtitle: "Nous avons envoyé un code à 6 chiffres à ",
        verifyEnter: ". Entrez-le ci-dessous.",
        verifying: "Vérification...",
        verifyBtn: "Vérifier le code",
        goToLogin: "Se connecter maintenant",
        acceptTermsPrefix: "J'accepte les ",
        termsLink: "Conditions Générales",
        acceptTermsAnd: " et la ",
        privacyLink: "Politique de Confidentialité",
        acceptTermsError: "Vous devez accepter les conditions et politiques pour vous inscrire."
    }
};

export default function Register() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [company, setCompany] = useState('');
    const [companyIndustry, setCompanyIndustry] = useState('');
    const [location, setLocation] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
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
        
        if (!acceptedTerms) {
            setError(t.acceptTermsError);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password,
                    company_name: company || undefined,
                    company_industry: companyIndustry || undefined,
                    location: location || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || `Registration failed (${res.status})`);
            }
            // Move to OTP verification step
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
            setOtpSuccess(
                'Email verified! Your account is now active. You can log in immediately.'
            );
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setOtpError(err.message || 'Verification failed.');
        } finally {
            setOtpLoading(false);
        }
    };

    // --- OTP Verification Screen ---
    if (showOTP) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
                        <ArrowLeft size={16} /> {t.back}
                    </button>
                </nav>
                <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FF6B00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                    <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10 max-w-md w-full relative z-10 text-center transition-all">
                        <div className="flex justify-center mb-8">
                            <img src="/Logo_Atperf_transpart.png" alt="Atperf" className="h-10 w-auto object-contain" />
                        </div>

                        <div className="bg-[#FF6B00]/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound size={24} className="text-[#FF6B00]" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">{t.verifyTitle}</h2>
                        <p className="text-sm text-slate-500 mb-6">{t.verifySubtitle}<strong className="text-slate-700">{email}</strong>{t.verifyEnter}</p>
                        
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full border border-slate-200 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] mb-6 bg-slate-50 focus:bg-white transition-all shadow-inner"
                        />
                        
                        {otpError && <p className="text-sm text-red-600 mb-4 font-medium">{otpError}</p>}
                        {otpSuccess && <p className="text-sm text-emerald-600 mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100 font-medium">{otpSuccess}</p>}
                        
                        {!otpSuccess && (
                            <button
                                onClick={handleVerifyOTP}
                                disabled={otpLoading || otp.length !== 6}
                                className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/25 hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {otpLoading ? <><Loader2 size={18} className="animate-spin" /> {t.verifying}</> : t.verifyBtn}
                            </button>
                        )}
                        {otpSuccess && (
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white py-3.5 rounded-xl font-bold transition-all mt-2 shadow-lg shadow-[#FF6B00]/25 hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5"
                            >
                                {t.goToLogin}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- Registration Form ---
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
                    <ArrowLeft size={16} /> {t.back}
                </button>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FF6B00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10 max-w-lg w-full relative z-10 transition-all">
                    <div className="flex justify-center mb-8">
                        <img src="/Logo_Atperf_transpart.png" alt="Atperf" className="h-10 w-auto object-contain" />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">{t.title}</h1>
                        <p className="text-sm text-slate-500">{t.subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.firstName}</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.lastName}</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                />
                            </div>
                        </div>

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

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.company}</label>
                                <input
                                    type="text"
                                    value={company}
                                    onChange={e => setCompany(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.industry}</label>
                                <input
                                    type="text"
                                    value={companyIndustry}
                                    onChange={e => setCompanyIndustry(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.location}</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all bg-slate-50 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-2 mb-2">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="w-4 h-4 border border-slate-300 rounded bg-white checked:bg-[#FF6B00] checked:border-[#FF6B00] focus:ring-[#FF6B00]/40 transition-all cursor-pointer"
                                />
                            </div>
                            <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer select-none">
                                {t.acceptTermsPrefix}
                                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#FF6B00] hover:text-[#E66000] font-medium hover:underline transition-colors" onClick={(e) => e.stopPropagation()}>
                                    {t.termsLink}
                                </a>
                                {t.acceptTermsAnd}
                                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FF6B00] hover:text-[#E66000] font-medium hover:underline transition-colors" onClick={(e) => e.stopPropagation()}>
                                    {t.privacyLink}
                                </a>
                            </label>
                        </div>

                        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">{error}</div>}
                        
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/25 hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-4"
                            >
                                {loading ? <><Loader2 size={18} className="animate-spin" /> {t.submitting}</> : t.submitBtn}
                            </button>
                        </div>
                    </form>

                    <p className="text-sm text-center text-slate-500 font-medium">
                        {t.hasAccount}{' '}
                        <button onClick={() => navigate('/login')} className="text-[#FF6B00] font-bold hover:text-[#E66000] transition-colors hover:underline">
                            {t.logInLink}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
