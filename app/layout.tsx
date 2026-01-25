import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'AI Invoice Generator - Create Professional Invoices Instantly',
	description:
		'Create professional invoices instantly with AI-powered Magic Fill. Generate, preview, and download PDF invoices with ease. Voice input supported.',
	keywords: [
		'invoice generator',
		'AI invoice',
		'PDF invoice',
		'create invoice',
		'billing software',
		'voice input invoice',
		'professional invoices'
	],
	authors: [{ name: 'AI Invoice Generator' }],
	openGraph: {
		title: 'AI Invoice Generator - Create Professional Invoices Instantly',
		description:
			'Generate beautiful invoices with AI-powered Magic Fill feature. Download as PDF instantly.',
		type: 'website',
		locale: 'en_US',
		siteName: 'AI Invoice Generator'
	},
	twitter: {
		card: 'summary_large_image',
		title: 'AI Invoice Generator',
		description: 'Create professional invoices with AI-powered tools'
	},
	viewport: {
		width: 'device-width',
		initialScale: 1
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1
		}
	}
}

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }
})();
`

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang='en'
			suppressHydrationWarning
		>
			<head>
				<link
					rel='icon'
					type='image/svg+xml'
					href='/vite.svg'
				/>
				<script
					dangerouslySetInnerHTML={{ __html: themeScript }}
				/>
			</head>
			<body>{children}</body>
		</html>
	)
}
