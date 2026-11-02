import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll to `#section` links (e.g. /discover#methode) once the page has rendered.
 * Browsers try before React has drawn the page, so retry briefly.
 */
export default function ScrollToHash() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (!hash) return;
        const id = decodeURIComponent(hash.slice(1));
        let tries = 0;
        const timer = window.setInterval(() => {
            const el = document.getElementById(id);
            if (el || ++tries > 20) {
                window.clearInterval(timer);
                // Leave room for the fixed site header.
                if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
            }
        }, 100);
        return () => window.clearInterval(timer);
    }, [pathname, hash]);

    return null;
}
