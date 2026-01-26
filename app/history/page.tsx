import type { Metadata } from 'next'
import HistoryPageClient from '@/components/HistoryPageClient'

export const metadata: Metadata = {
	title: 'History - AI Invoice Generator',
	description: 'View your saved invoice drafts and history.'
}

export default function HistoryPage() {
	return <HistoryPageClient />
}
