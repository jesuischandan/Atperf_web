const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// If local, talk to your Mac's backend. If on GCP, talk to Nginx /api
const API_URL: string = isLocal
    ? `http://localhost:35001`
    : `${window.location.protocol}//${window.location.hostname}/api`;

export default API_URL;