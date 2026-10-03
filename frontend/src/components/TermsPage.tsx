import { useState, useEffect } from 'react';
import LandingPageNav from './LandingPageNav';
import Footer from './Footer';

const TRANSLATIONS = {
    fr: {
        title: "Conditions Générales d’Utilisation - ATPERF CONSEIL",
        sections: [
            {
                title: "1. Informations légales",
                content: `ATPERF CONSEIL
SAS – Société par actions simplifiée
📍 3 Avenue de la Reine Anne, 78490 Montfort-l'Amaury – France
📄 SIREN : 909 581 365
📄 SIRET : 909 581 365 00014
📄 TVA : FR53 909 581 365
📊 Code APE : 70.22Z

📧 Contact : r.rabhi@atperf.com`
            },
            {
                title: "2. Objet",
                content: `Les présentes Conditions Générales ont pour objet de définir :
- les conditions d’accès et d’utilisation des solutions SaaS proposées par ATPERF CONSEIL
- les droits et obligations des utilisateurs
- les modalités commerciales applicables`
            },
            {
                title: "3. Définitions",
                content: `Plateforme : application SaaS éditée par ATPERF CONSEIL
Utilisateur : toute personne utilisant la plateforme
Client : personne morale ayant souscrit à une offre
Services : fonctionnalités proposées (IA, automatisation, analytics, etc.)`
            },
            {
                title: "4. Accès aux services",
                content: `L’accès à la plateforme nécessite :
- la création d’un compte
- une connexion internet
- un équipement compatible

ATPERF CONSEIL se réserve le droit de suspendre l’accès :
- en cas de non-respect des conditions
- pour maintenance ou évolution`
            },
            {
                title: "5. Création de compte",
                content: `L’utilisateur s’engage à :
- fournir des informations exactes
- maintenir la confidentialité de ses identifiants

Toute utilisation du compte engage la responsabilité du client.`
            },
            {
                title: "6. Description des services",
                content: `Les services peuvent inclure :
- automatisation de workflows (ex : email outreach)
- analyse de données
- extraction et traitement de documents
- outils d’aide à la décision
- intégrations avec outils tiers

Les fonctionnalités peuvent évoluer à tout moment.`
            },
            {
                title: "7. Conditions financières",
                content: `7.1 Abonnement
Les services sont proposés sous forme :
- d’abonnement mensuel ou annuel
- ou de facturation à l’usage

7.2 Paiement
- Paiement à l’avance
- Par carte bancaire ou virement
- Facturation en euros (€) HT

7.3 Retard de paiement
- Suspension automatique du service
- Pénalités légales applicables`
            },
            {
                title: "8. Période d’essai (si applicable)",
                content: `Une période d’essai peut être proposée.
À son expiration :
- l’accès peut être restreint
- ou automatiquement converti en abonnement payant`
            },
            {
                title: "9. Engagements du client",
                content: `Le client s’engage à :
- utiliser la plateforme de manière conforme
- ne pas détourner les services
- respecter la réglementation (RGPD, emailing, etc.)`
            },
            {
                title: "10. Données",
                content: `10.1 Données client
Le client reste propriétaire de ses données.

10.2 Traitement
ATPERF CONSEIL agit en tant que sous-traitant au sens du RGPD.

10.3 Sécurité
Nous mettons en place :
- chiffrement
- accès sécurisés
- stockage conforme`
            },
            {
                title: "11. Intelligence artificielle",
                content: `Les services peuvent inclure des fonctionnalités d’IA.
Le client reconnaît que :
- les résultats peuvent contenir des approximations
- les décisions basées sur ces résultats restent sous sa responsabilité`
            },
            {
                title: "12. Disponibilité du service (SLA)",
                content: `ATPERF CONSEIL s’efforce d’assurer une disponibilité maximale.
Cependant :
- aucune garantie de disponibilité 100% n’est donnée
- des interruptions peuvent survenir (maintenance, incidents)`
            },
            {
                title: "13. Responsabilité",
                content: `ATPERF CONSEIL est soumis à une obligation de moyens.
La responsabilité est limitée :
- aux dommages directs
- au montant payé sur les 12 derniers mois

Sont exclus :
- pertes de chiffre d’affaires
- pertes de données (si sauvegardes non effectuées par le client)`
            },
            {
                title: "14. Propriété intellectuelle",
                content: `La plateforme, ses algorithmes et technologies restent la propriété exclusive d’ATPERF CONSEIL.
Le client bénéficie d’un droit d’usage non exclusif.`
            },
            {
                title: "15. Résiliation",
                content: `Le client peut résilier :
- à tout moment (selon abonnement)

ATPERF CONSEIL peut résilier en cas :
- de non-paiement
- d’usage abusif`
            },
            {
                title: "16. Réversibilité des données",
                content: `En cas de résiliation :
- les données peuvent être exportées sur demande
- elles seront supprimées après un délai raisonnable`
            },
            {
                title: "17. Confidentialité",
                content: `Chaque partie s’engage à :
- protéger les informations échangées
- ne pas les divulguer`
            },
            {
                title: "18. Force majeure",
                content: `Aucune responsabilité en cas d’événement imprévisible empêchant l’exécution du service.`
            },
            {
                title: "19. Droit applicable",
                content: `Les présentes conditions sont régies par le droit français.`
            },
            {
                title: "20. Litiges",
                content: `En cas de litige :
- Tentative de résolution amiable
- À défaut : juridictions françaises compétentes`
            }
        ]
    },
    en: {
        title: "Terms and Conditions - ATPERF CONSEIL",
        sections: [
            {
                title: "1. Legal Information",
                content: `ATPERF CONSEIL
SAS – Simplified joint-stock company
📍 3 Avenue de la Reine Anne, 78490 Montfort-l'Amaury – France
📄 SIREN: 909 581 365
📄 SIRET: 909 581 365 00014
📄 VAT: FR53 909 581 365
📊 APE Code: 70.22Z

📧 Contact: r.rabhi@atperf.com`
            },
            {
                title: "2. Object",
                content: `The purpose of these General Conditions is to define:
- the access and usage conditions for the SaaS solutions provided by ATPERF CONSEIL
- the rights and obligations of the users
- the applicable commercial terms`
            },
            {
                title: "3. Definitions",
                content: `Platform: SaaS application developed by ATPERF CONSEIL
User: any person using the platform
Client: legal entity that has subscribed to an offer
Services: features provided (AI, automation, analytics, etc.)`
            },
            {
                title: "4. Access to Services",
                content: `Access to the platform requires:
- an account creation
- an internet connection
- compatible equipment

ATPERF CONSEIL reserves the right to suspend access:
- in the event of non-compliance with the conditions
- for maintenance or updates`
            },
            {
                title: "5. Account Creation",
                content: `The user agrees to:
- provide accurate information
- maintain the confidentiality of their credentials

Any use of the account engages the client's responsibility.`
            },
            {
                title: "6. Description of Services",
                content: `Services may include:
- workflow automation (e.g., email outreach)
- data analysis
- document extraction and processing
- decision support tools
- integrations with third-party tools

Features may evolve at any time.`
            },
            {
                title: "7. Financial Conditions",
                content: `7.1 Subscription
Services are offered as:
- a monthly or annual subscription
- or usage-based billing

7.2 Payment
- Advance payment
- By credit card or bank transfer
- Invoicing in euros (€) excl. tax

7.3 Late Payment
- Automatic suspension of service
- Applicable legal penalties`
            },
            {
                title: "8. Trial Period (if applicable)",
                content: `A trial period may be offered.
Upon expiration:
- access may be restricted
- or automatically converted into a paid subscription`
            },
            {
                title: "9. Client Commitments",
                content: `The client agrees to:
- use the platform compliantly
- not misuse the services
- comply with regulations (GDPR, emailing, etc.)`
            },
            {
                title: "10. Data",
                content: `10.1 Client Data
The client remains the owner of their data.

10.2 Processing
ATPERF CONSEIL acts as a data processor under the GDPR.

10.3 Security
We implement:
- encryption
- secure access
- compliant storage`
            },
            {
                title: "11. Artificial Intelligence",
                content: `Services may involve AI features.
The client acknowledges that:
- results may contain approximations
- decisions made based on these results remain their sole responsibility`
            },
            {
                title: "12. Service Availability (SLA)",
                content: `ATPERF CONSEIL strives to ensure maximum availability.
However:
- no 100% availability guarantee is provided
- interruptions may occur (maintenance, incidents)`
            },
            {
                title: "13. Liability",
                content: `ATPERF CONSEIL is subject to a best-efforts obligation.
Liability is limited to:
- direct damages
- the amount paid over the last 12 months

Excluded are:
- loss of revenue
- data loss (if backups are not performed by the client)`
            },
            {
                title: "14. Intellectual Property",
                content: `The platform, its algorithms, and technologies remain the exclusive property of ATPERF CONSEIL.
The client benefits from a non-exclusive right of use.`
            },
            {
                title: "15. Termination",
                content: `The client may terminate:
- at any time (depending on the subscription)

ATPERF CONSEIL may terminate in the event of:
- non-payment
- abusive use`
            },
            {
                title: "16. Data Reversibility",
                content: `In the event of termination:
- data may be exported upon request
- data will be deleted after a reasonable timeframe`
            },
            {
                title: "17. Confidentiality",
                content: `Each party agrees to:
- protect exchanged information
- not disclose it`
            },
            {
                title: "18. Force Majeure",
                content: `No liability in the event of an unforeseeable event preventing the execution of the service.`
            },
            {
                title: "19. Applicable Law",
                content: `These conditions are governed by French law.`
            },
            {
                title: "20. Disputes",
                content: `In the event of a dispute:
- Attempt at an amicable resolution
- Failing that: competent French jurisdictions`
            }
        ]
    }
};

export default function TermsPage() {
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
