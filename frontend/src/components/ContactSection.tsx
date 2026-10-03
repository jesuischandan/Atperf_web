import { useState } from 'react';
import { Mail, Phone, Linkedin, Plus, Minus, CheckCircle } from 'lucide-react';

const TRANSLATIONS = {
    en: {
        contactUs: 'CONTACT US',
        getInTouch: 'Get in touch today',
        nameLabel: 'Name',
        namePlaceholder: 'John Carter',
        emailLabel: 'Email',
        emailPlaceholder: 'example@email.com',
        phoneLabel: 'Phone',
        phonePlaceholder: '(123) 456 - 789',
        companyLabel: 'Company',
        companyPlaceholder: 'Facebook',
        messageLabel: 'Leave us a message',
        messagePlaceholder: 'Please type your message here...',
        sendBtn: 'Send Message',
        sendingBtn: 'Sending...',
        sentMsg: 'Message Sent Successfully',
        reachDirectly: 'Want to reach out directly?',
        emailDirect: 'Email:',
        phoneDirect: 'Phone:',
        faqTitle1: 'Most ',
        faqTitleHighlight: 'frequent questions',
        faqTitle2: '.',
        faqSubtitle1: 'For any questions about our services, please consult our FAQ or ',
        faqSubtitleHighlight: 'contact us directly.',
        faqs: [
            { q: 'Can we guarantee sustainable results?', a: 'Yes, our StrAP\u00ae methodology is specifically designed to anchor routines and secure lasting change. We don\'t just deliver a report; we implement tools that enforce discipline on the shop floor.' },
            { q: 'In which industries do you operate?', a: 'We primarily serve the manufacturing and heavy industries, but our methodology applies to any operational environment experiencing friction, including logistics and supply chain.' },
            { q: 'I want to work with you, what are the next steps?', a: 'First, reach out via this form or by phone. We will schedule a scoping call to understand your challenges, followed by a proposed engagement plan tailored to your site.' },
            { q: 'How long does a project take?', a: 'Our engagements are designed for speed. You can expect average time-to-first-result within 6 weeks, depending on the complexity of your operations.' },
            { q: 'What is the pricing of your services?', a: 'Our pricing is customized based on the scope of the project and the tools deployed. We optimize for a fast ROI\u2014often achieving $1M+ average yearly savings per program.' }
        ]
    },
    fr: {
        contactUs: 'NOUS CONTACTER',
        getInTouch: 'Discutons de votre projet',
        nameLabel: 'Nom',
        namePlaceholder: 'Jean Dupont',
        emailLabel: 'Email',
        emailPlaceholder: 'exemple@email.com',
        phoneLabel: 'T\u00e9l\u00e9phone',
        phonePlaceholder: '+33 6 00 00 00 00',
        companyLabel: 'Entreprise',
        companyPlaceholder: 'Votre entreprise',
        messageLabel: 'Laissez-nous un message',
        messagePlaceholder: 'Veuillez taper votre message ici...',
        sendBtn: 'Envoyer',
        sendingBtn: 'Envoi...',
        sentMsg: 'Message envoy\u00e9 avec succ\u00e8s',
        reachDirectly: 'Vous souhaitez nous joindre directement ?',
        emailDirect: 'Email :',
        phoneDirect: 'T\u00e9l\u00e9phone :',
        faqTitle1: 'Les ',
        faqTitleHighlight: 'questions',
        faqTitle2: ' les plus fr\u00e9quentes.',
        faqSubtitle1: 'Pour toutes questions sur nos services, consultez notre FAQ ou ',
        faqSubtitleHighlight: 'contactez-nous directement.',
        faqs: [
            { q: 'Pouvons-nous garantir des r\u00e9sultats durables ?', a: 'Oui, notre m\u00e9thodologie StrAP\u00ae est sp\u00e9cifiquement con\u00e7ue pour ancrer les routines et garantir un changement durable. Nous ne faisons pas que livrer un rapport ; nous impl\u00e9mentons des outils qui imposent la discipline sur le terrain.' },
            { q: 'Dans quels secteurs d\'activit\u00e9 intervenez-vous ?', a: 'Nous intervenons principalement dans le secteur manufacturier et l\'industrie lourde, mais notre m\u00e9thodologie s\'applique \u00e0 tout environnement op\u00e9rationnel rencontrant des frictions, y compris la logistique et la supply chain.' },
            { q: 'Je souhaite travailler avec vous, quels sont les prochaines \u00e9tapes ?', a: 'Tout d\'abord, contactez-nous via ce formulaire ou par t\u00e9l\u00e9phone. Nous planifierons un appel de cadrage pour comprendre vos d\u00e9fis, suivi d\'une proposition de plan d\'intervention adapt\u00e9 \u00e0 votre site.' },
            { q: 'Combien de temps dure un projet ?', a: 'Nos interventions sont con\u00e7ues pour \u00eatre rapides. Vous pouvez vous attendre \u00e0 de premiers r\u00e9sultats en 6 semaines en moyenne, selon la complexit\u00e9 de vos op\u00e9rations.' },
            { q: 'Quel est le prix de nos services ?', a: 'Notre tarification est personnalis\u00e9e en fonction de la port\u00e9e du projet et des outils d\u00e9ploy\u00e9s. Nous optimisons pour un retour sur investissement rapide, r\u00e9alisant souvent plus d\'1M$ d\'\u00e9conomies annuelles moyennes par programme.' }
        ]
    }
};

export default function ContactSection({ lang }: { lang: 'en' | 'fr' }) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: (formData.get('phone') as string) || '',
            company: (formData.get('company') as string) || '',
            message: formData.get('message') as string,
        };

        try {
            const apiUrl = import.meta.env.VITE_API_URL || "https://atperf.com/api";
            const response = await fetch(`${apiUrl}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setIsSent(true);
                form.reset();
                setTimeout(() => setIsSent(false), 5000);
            } else {
                alert('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className="py-24 px-6 bg-[#FAFAFA]">
            <div className="max-w-4xl mx-auto flex flex-col gap-24">
                
                {/* 1. Form */}
                <div className="flex flex-col">
                    <div className="text-center mb-10">
                        <div className="inline-block text-[#FF6B00] font-bold text-sm tracking-[0.15em] uppercase mb-3">
                            {t.contactUs}
                        </div>
                        <h2 className="text-4xl md:text-[2.75rem] font-extrabold text-[#0B1E36] tracking-tight">{t.getInTouch}</h2>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 w-full relative">
                        {isSent ? (
                            <div className="h-full min-h-[450px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">{t.sentMsg}</h3>
                                <p className="text-slate-500">We will get back to you shortly.</p>
                                <button 
                                    onClick={() => setIsSent(false)} 
                                    className="mt-8 text-[#FF6B00] font-medium hover:underline"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                                <div className="grid sm:grid-cols-2 gap-6 w-full">
                                    <div className="flex flex-col gap-2 relative">
                                        <label className="font-bold text-[#1a2f4c] text-sm">{t.nameLabel}</label>
                                        <input 
                                            required
                                            name="name"
                                            type="text" 
                                            placeholder={t.namePlaceholder}
                                            className="px-5 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all placeholder:text-slate-400 font-medium text-slate-700 w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 relative">
                                        <label className="font-bold text-[#1a2f4c] text-sm">{t.emailLabel}</label>
                                        <input 
                                            required
                                            name="email"
                                            type="email" 
                                            placeholder={t.emailPlaceholder}
                                            className="px-5 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all placeholder:text-slate-400 font-medium text-slate-700 w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 relative">
                                        <label className="font-bold text-[#1a2f4c] text-sm">{t.phoneLabel}</label>
                                        <input 
                                            name="phone"
                                            type="tel" 
                                            placeholder={t.phonePlaceholder}
                                            className="px-5 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all placeholder:text-slate-400 font-medium text-slate-700 w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 relative">
                                        <label className="font-bold text-[#1a2f4c] text-sm">{t.companyLabel}</label>
                                        <input 
                                            name="company"
                                            type="text" 
                                            placeholder={t.companyPlaceholder}
                                            className="px-5 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all placeholder:text-slate-400 font-medium text-slate-700 w-full"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 relative w-full">
                                    <label className="font-bold text-[#1a2f4c] text-sm">{t.messageLabel}</label>
                                    <textarea 
                                        required
                                        name="message"
                                        rows={4}
                                        placeholder={t.messagePlaceholder}
                                        className="px-5 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all placeholder:text-slate-400 font-medium text-slate-700 resize-none w-full"
                                    />
                                </div>
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-[#FF6B00]/25 transition-all hover:shadow-[#FF6B00]/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t.sendingBtn}
                                            </>
                                        ) : (
                                            <>
                                                {t.sendBtn}
                                            </>
                                        )}
                                    </button>
                                    <a href="https://linkedin.com/company/atperf-conseil" target="_blank" rel="noopener noreferrer" className="p-3 text-[#0077b5] bg-sky-50 hover:text-white hover:bg-[#0077b5] rounded-full transition-colors cursor-pointer mr-auto sm:mr-0 hidden sm:flex">
                                        <Linkedin size={24} className="fill-current" />
                                    </a>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* 2. FAQ */}
                <div className="flex flex-col">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight text-center">
                        {t.faqTitle1}
                        <span className="bg-[#FF6B00] text-white px-2 py-1 rounded-md mx-1 inline-block transform -rotate-1">{t.faqTitleHighlight}</span>
                        {t.faqTitle2}
                    </h2>
                    <p className="text-slate-600 font-medium mb-8 text-lg text-center">
                        {t.faqSubtitle1}
                        <br className="hidden sm:block" />
                        <span className="bg-[#FFF0E6] text-[#FF6B00] px-2 py-0.5 rounded-md mt-1 inline-block">{t.faqSubtitleHighlight}</span>
                    </p>

                    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col divide-y divide-slate-100">
                        {t.faqs.map((faq, idx) => (
                            <div key={idx} className="group">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-slate-800 pr-8 text-[0.95rem]">{faq.q}</span>
                                    <span className="shrink-0 text-slate-400 group-hover:text-[#FF6B00] transition-colors">
                                        {openFaq === idx ? <Minus size={20} /> : <Plus size={20} />}
                                    </span>
                                </button>
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="p-6 pt-0 text-slate-500 leading-relaxed bg-slate-50/50 text-sm">
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Direct Contact */}
                <div className="flex flex-col">
                    <h3 className="text-2xl font-bold text-[#0B1E36] mb-6 text-center">{t.reachDirectly}</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* Email Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-5 flex items-center gap-4 hover:shadow-md transition-all hover:border-orange-200">
                            <div className="w-12 h-12 shrink-0 bg-[#FF6B00] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
                                <Mail size={22} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium leading-tight">{t.emailDirect}</p>
                                <a href="mailto:r.rahbi@atperf.com" className="text-[#FF6B00] font-bold mt-1 block hover:underline">
                                    r.rahbi@atperf.com
                                </a>
                            </div>
                        </div>

                        {/* Phone Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-5 flex items-center gap-4 hover:shadow-md transition-all hover:border-orange-200">
                            <div className="w-12 h-12 shrink-0 bg-[#FF6B00] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
                                <Phone size={22} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium leading-tight">{t.phoneDirect}</p>
                                <a href="tel:+33661409529" className="text-[#FF6B00] font-bold mt-1 block hover:underline">
                                    +33 6 61 40 95 29
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
