import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.svg',
                'pwa-192x192.png',
                'pwa-512x512.png',
                'robots.txt'
            ],
            manifest: {
                name: 'Loopr',
                short_name: 'Loopr',
                description: 'Loopr is a monitoring platform for your websites and applications.',
                theme_color: '#4f46e5',
                background_color: '#1e1b4b',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    optimizeDeps: {
        include: ['appwrite']
    }
});