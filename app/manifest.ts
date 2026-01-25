import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'AI Invoice Generator',
		short_name: 'Invoice AI',
		description:
			'Create professional invoices instantly with AI-powered Magic Fill.',
		start_url: '/',
		display: 'standalone',
		background_color: '#0f172a',
		theme_color: '#0f172a',
		icons: [
			{
				src: '/icon-192.svg',
				sizes: '192x192',
				type: 'image/svg+xml'
			},
			{
				src: '/icon-512.svg',
				sizes: '512x512',
				type: 'image/svg+xml'
			}
		]
	}
}
