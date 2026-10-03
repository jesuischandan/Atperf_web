import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Check if we are running on the GCP server
const isProduction = process.env.NODE_ENV === 'production' || process.env.USER === 'c_kumar';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 35000,
        host: true,
        strictPort: true,
        allowedHosts: ["atperf.com", "www.atperf.com", "localhost"],
        // If on GCP, use the secure tunnel. If on Mac, use default local HMR.
        hmr: isProduction ? {
            host: 'atperf.com',
            protocol: 'wss',
            clientPort: 443,
        } : true,
    },
})