import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   Shared EN/FR preference. Every component using this hook stays in sync:
   the sidebar's language switch updates the tool page next to it.
───────────────────────────────────────────────────────────── */

export type Lang = 'en' | 'fr';

const KEY = 'strap_lang';
const EVENT = 'strap-lang-change';

export function readLang(): Lang {
    try {
        return localStorage.getItem(KEY) === 'fr' ? 'fr' : 'en';
    } catch {
        return 'en';
    }
}

export function setStoredLang(l: Lang) {
    try {
        localStorage.setItem(KEY, l);
    } catch { /* storage unavailable: keep the in-memory value */ }
    window.dispatchEvent(new CustomEvent<Lang>(EVENT, { detail: l }));
}

export function useLang(): [Lang, (l: Lang) => void] {
    const [lang, setLang] = useState<Lang>(readLang);

    useEffect(() => {
        const onChange = (e: Event) => setLang((e as CustomEvent<Lang>).detail);
        window.addEventListener(EVENT, onChange);
        return () => window.removeEventListener(EVENT, onChange);
    }, []);

    return [lang, setStoredLang];
}
