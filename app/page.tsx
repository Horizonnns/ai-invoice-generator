import HomeClient from '@/components/HomeClient'

export default function HomePage() {
	const siteUrl =
		process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'AI Invoice Generator',
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		description:
			'Create professional invoices instantly with AI-powered Magic Fill. Generate, preview, and download PDF invoices with ease.',
		url: siteUrl,
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		}
	}

	return (
		<>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd)
				}}
			/>
			<HomeClient>
				<section className='sr-only'>
					<h1>AI Invoice Generator</h1>
					<h2>Create invoices in minutes, not hours</h2>
					<p>
						AI Invoice Generator helps freelancers and small teams
						build beautiful invoices fast. Use Magic Fill, preview
						live, and download a clean PDF when you are ready.
					</p>
					<h2>How it works</h2>
					<ol>
						<li>Enter sender, recipient, and item details.</li>
						<li>Use Magic Fill to parse text or voice notes.</li>
						<li>Preview and export a professional PDF.</li>
					</ol>
					<h2>Use cases</h2>
					<ul>
						<li>Freelancers invoicing clients quickly.</li>
						<li>Small teams sending monthly billing.</li>
						<li>Agencies generating branded invoices.</li>
					</ul>
					<ul>
						<li>AI-powered Magic Fill from text or voice input.</li>
						<li>Instant PDF preview and download.</li>
						<li>Clean, professional layout for clients.</li>
					</ul>
				</section>
			</HomeClient>
		</>
	)
}
