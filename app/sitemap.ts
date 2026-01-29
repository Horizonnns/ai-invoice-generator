import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5173'

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: siteUrl,
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 1
		}
	]
}
