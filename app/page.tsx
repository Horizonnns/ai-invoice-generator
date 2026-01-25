import HomeClient from '@/components/HomeClient'

export default function HomePage() {
	return (
		<HomeClient>
			<section className='sr-only'>
				<h2>Create invoices in minutes, not hours</h2>
				<p>
					AI Invoice Generator helps freelancers and small teams
					build beautiful invoices fast. Use Magic Fill, preview
					live, and download a clean PDF when you are ready.
				</p>
				<ul>
					<li>AI-powered Magic Fill from text or voice input.</li>
					<li>Instant PDF preview and download.</li>
					<li>Clean, professional layout for clients.</li>
				</ul>
			</section>
		</HomeClient>
	)
}
