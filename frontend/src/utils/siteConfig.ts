/* ─────────────────────────────────────────────────────────────
   Public-site switches and entry-link handling
───────────────────────────────────────────────────────────── */

/**
 * Show "try the interactive demonstrator" buttons on public pages.
 * Off until the STRAP Maintenance demonstrator has been tested and approved:
 * pages show "Démonstrateur interactif prochainement disponible" instead.
 * The simulator stays reachable for testing at /strap-software/maintenance/demo.
 */
export const MAINTENANCE_DEMO_PUBLIC = false;

/** Campaign links can force the language: https://atperf.com/discover?lang=fr */
export function applyLangFromUrl() {
    try {
        const lang = new URLSearchParams(window.location.search).get('lang');
        if (lang === 'fr' || lang === 'en') localStorage.setItem('strap_lang', lang);
    } catch { /* storage unavailable: pages fall back to their default */ }
}
