import { useState, useEffect } from 'react';
import LandingPageNav from './LandingPageNav';
import Footer from './Footer';

const TRANSLATIONS = {
    fr: {
        title: "Politique de confidentialité – ATPERF CONSEIL",
        sections: [
            {
                title: "1. Introduction",
                content: `La société ATPERF CONSEIL, société par actions simplifiée (SAS), immatriculée sous le SIREN 909 581 365, accorde une importance primordiale à la protection de vos données personnelles.

La présente politique de confidentialité a pour objectif de vous informer de manière transparente sur :
- la collecte de vos données
- leur utilisation
- vos droits
- les moyens de les exercer

Nous nous engageons à respecter le Règlement Général sur la Protection des Données (RGPD) ainsi que la loi Informatique et Libertés.`
            },
            {
                title: "2. Identité du responsable de traitement",
                content: `ATPERF CONSEIL
📍 3 Avenue de la Reine Anne, 78490 Montfort-l'Amaury – France
📄 SIREN : 909 581 365
📄 SIRET : 909 581 365 00014
📄 TVA intracommunautaire : FR53 909 581 365
🏢 Forme juridique : SAS
📊 Activité : Conseil pour les affaires et autres conseils de gestion (Code APE 70.22Z)
📅 Date de création : 01/01/2022

📧 Contact : r.rabhi@atperf.com`
            },
            {
                title: "3. Données personnelles collectées",
                content: `Nous collectons uniquement les données strictement nécessaires à nos activités, notamment :

Données d’identification
- Nom, prénom

Données professionnelles
- Société, fonction

Données de contact
- Adresse email
- Numéro de téléphone

Données techniques
- Adresse IP
- Données de navigation (cookies)`
            },
            {
                title: "4. Finalités du traitement",
                content: `4.1 Gestion des demandes
Répondre à vos messages via formulaire ou email
👉 Base légale : intérêt légitime

4.2 Développement commercial
Prospection B2B
Envoi de contenus ou offres
👉 Base légale : consentement

4.3 Gestion des relations clients
Élaboration de propositions commerciales
Réalisation de missions de conseil
👉 Base légale : contractuelle / précontractuelle

4.4 Analyse du site
Mesure d’audience
Amélioration de l’expérience utilisateur
👉 Base légale : consentement (cookies)`
            },
            {
                title: "5. Caractère obligatoire des données",
                content: `Certaines données sont indispensables pour :
- traiter vos demandes
- établir une relation commerciale
- exécuter nos prestations

Sans ces informations, nous ne pourrons pas répondre efficacement.`
            },
            {
                title: "6. Durée de conservation",
                content: `Vos données sont conservées selon les durées suivantes :

- Prospects / clients : 5 ans après le dernier contact
- Cookies : 13 mois maximum`
            },
            {
                title: "7. Destinataires des données",
                content: `Vos données peuvent être partagées avec :
- les équipes internes d’ATPERF CONSEIL
- les prestataires techniques (hébergement, outils SaaS, CRM)

Nous ne vendons jamais vos données.`
            },
            {
                title: "8. Transferts hors Union Européenne",
                content: `Certains outils peuvent entraîner des transferts de données hors UE.

Dans ce cas, nous mettons en place des garanties conformes au RGPD (clauses contractuelles types, etc.).`
            },
            {
                title: "9. Sécurité des données",
                content: `Nous appliquons des mesures de sécurité adaptées :
- accès restreint aux données
- hébergement sécurisé
- protection contre les accès non autorisés`
            },
            {
                title: "10. Vos droits",
                content: `Conformément au RGPD, vous disposez des droits suivants :

- Droit d’accès
- Droit de rectification
- Droit d’effacement
- Droit d’opposition
- Droit à la limitation
- Droit à la portabilité
- Droit de retirer votre consentement`
            },
            {
                title: "11. Exercice de vos droits",
                content: `Vous pouvez exercer vos droits à tout moment :

📧 r.rabhi@atperf.com

Une réponse vous sera apportée sous 1 mois maximum.`
            },
            {
                title: "12. Autorité de contrôle",
                content: `Vous pouvez introduire une réclamation auprès de la CNIL :
https://www.cnil.fr`
            },
            {
                title: "13. Mise à jour de la politique",
                content: `Cette politique peut être modifiée à tout moment afin de garantir sa conformité avec la réglementation en vigueur.`
            }
        ]
    },

    en: {
        title: "Privacy Policy – ATPERF CONSEIL",
        sections: [
            {
                title: "1. Introduction",
                content: `ATPERF CONSEIL, a simplified joint-stock company (SAS), registered under SIREN 909 581 365, places great importance on the protection of your personal data.

This Privacy Policy explains:
- how your data is collected
- how it is used
- your rights
- how to exercise them

We comply with the General Data Protection Regulation (GDPR) and applicable French laws.`
            },
            {
                title: "2. Data Controller",
                content: `ATPERF CONSEIL
📍 3 Avenue de la Reine Anne, 78490 Montfort-l'Amaury – France
📄 SIREN: 909 581 365
📄 SIRET: 909 581 365 00014
📄 VAT: FR53 909 581 365
🏢 Legal form: SAS
📊 Activity: Business and management consulting (APE Code 70.22Z)

📧 Contact: r.rabhi@atperf.com`
            },
            {
                title: "3. Personal Data Collected",
                content: `We only collect data strictly necessary for our activities:

Identification data
- First name, last name

Professional data
- Company, role

Contact data
- Email address
- Phone number

Technical data
- IP address
- Browsing data (cookies)`
            },
            {
                title: "4. Purpose of Processing",
                content: `4.1 Contact management
Respond to inquiries via forms or email
👉 Legal basis: legitimate interest

4.2 Business development
B2B prospecting and communication
👉 Legal basis: consent

4.3 Client relationship management
Commercial proposals and service delivery
👉 Legal basis: contractual / pre-contractual

4.4 Website analytics
Traffic measurement and UX improvement
👉 Legal basis: consent (cookies)`
            },
            {
                title: "5. Mandatory Data",
                content: `Some data is required to:
- process your requests
- establish business relationships
- deliver services

Without it, we cannot respond effectively.`
            },
            {
                title: "6. Data Retention",
                content: `Data is retained as follows:
- Prospects/clients: 5 years after last contact
- Cookies: maximum 13 months`
            },
            {
                title: "7. Data Recipients",
                content: `Your data may be shared with:
- internal teams of ATPERF CONSEIL
- technical providers (hosting, SaaS tools, CRM)

We never sell your data.`
            },
            {
                title: "8. International Transfers",
                content: `Some tools may involve data transfers outside the EU.

In such cases, appropriate safeguards are implemented (standard contractual clauses, etc.).`
            },
            {
                title: "9. Data Security",
                content: `We implement appropriate security measures:
- restricted access
- secure hosting
- protection against unauthorized access`
            },
            {
                title: "10. Your Rights",
                content: `Under GDPR, you have the following rights:
- access
- rectification
- deletion
- objection
- restriction
- portability
- withdrawal of consent`
            },
            {
                title: "11. Exercising Your Rights",
                content: `You can exercise your rights at any time:

📧 r.rabhi@atperf.com

We will respond within 1 month.`
            },
            {
                title: "12. Supervisory Authority",
                content: `You can file a complaint with CNIL:
https://www.cnil.fr`
            },
            {
                title: "13. Policy Updates",
                content: `This policy may be updated at any time to remain compliant with regulations.`
            }
        ]
    }
};

export default function PrivacyPage() {
    const [lang, setLang] = useState<'en' | 'fr'>(() =>
        (localStorage.getItem('strap_lang') === 'fr' ? 'fr' : 'en')
    );

    const switchLang = (l: 'en' | 'fr') => {
        setLang(l);
        localStorage.setItem('strap_lang', l);
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const content = TRANSLATIONS[lang] || TRANSLATIONS.en;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <LandingPageNav lang={lang} onLangChange={switchLang} />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-24 md:py-32">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-10 text-[#FF6B00]">
                        {content.title}
                    </h1>

                    <div className="flex flex-col gap-8">
                        {content.sections.map((section, idx) => (
                            <section key={idx}>
                                <h2 className="text-xl font-bold mb-3 text-slate-800">{section.title}</h2>
                                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </main>

            <Footer lang={lang} />
        </div>
    );
}