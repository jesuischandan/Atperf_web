import API_URL from './apiUrl';

/* ─────────────────────────────────────────────────────────────
   API session handling

   The backend authenticates with httpOnly session cookies, so every call to
   the API must send credentials. Rather than editing every fetch() call site,
   installApiClient() wraps window.fetch once: requests to API_URL get
   `credentials: 'include'`, and a 401 on a protected call clears the cached
   profile (the session expired or predates cookie sessions) and sends the
   visitor to the right login page.
───────────────────────────────────────────────────────────── */

export const USER_KEY = 'proextract_user';
export const STAFF_KEY = 'proextract_staff';

// Calls where a 401 is an expected answer (bad password, wrong OTP…), not an expired session.
const AUTH_PATHS = ['/login', '/register', '/verify-otp', '/staff/login', '/staff/register',
    '/staff/forgot-password', '/staff/reset-password', '/api/auth/', '/logout', '/me'];

const urlOf = (input: RequestInfo | URL) =>
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

export function installApiClient() {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = urlOf(input);
        if (!url.startsWith(API_URL)) return nativeFetch(input, init);

        const res = await nativeFetch(input, { credentials: 'include', ...init });

        const path = url.slice(API_URL.length).split('?')[0];
        if (res.status === 401 && !AUTH_PATHS.some(p => path.startsWith(p))) {
            const hadStaff = !!localStorage.getItem(STAFF_KEY);
            const hadUser = !!localStorage.getItem(USER_KEY);
            if (hadStaff || hadUser) {
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(STAFF_KEY);
                const back = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.assign(hadStaff && !hadUser ? '/staff/login' : `/login?redirect=${back}`);
            }
        }
        return res;
    };
}

/** End the server session(s) and clear the cached profile. */
export async function logout(kind: 'user' | 'staff' | 'all' = 'user') {
    const calls: Promise<unknown>[] = [];
    if (kind !== 'staff') {
        localStorage.removeItem(USER_KEY);
        calls.push(fetch(`${API_URL}/logout`, { method: 'POST' }).catch(() => undefined));
    }
    if (kind !== 'user') {
        localStorage.removeItem(STAFF_KEY);
        calls.push(fetch(`${API_URL}/staff/logout`, { method: 'POST' }).catch(() => undefined));
    }
    await Promise.all(calls);
}
