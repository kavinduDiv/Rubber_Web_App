import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Rubber Tree Collector',
        short_name: 'RubberData',
        description: 'Offline-first Rubber Tree Collection App',
        start_url: '/',
        display: 'standalone',
        background_color: '#10b981',
        theme_color: '#10b981',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    };
}
