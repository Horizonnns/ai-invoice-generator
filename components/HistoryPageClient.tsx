'use client'

import AuthControls from '@/components/AuthControls'
import InvoiceHistory from '@/components/InvoiceHistory'
import type { AuthUser, InvoiceRecord } from '@/types/invoice'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function HistoryPageClient() {
	const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
	const [user, setUser] = useState<AuthUser | null>(null)
	const [history, setHistory] = useState<InvoiceRecord[]>([])
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const loadSession = async () => {
			try {
				const res = await fetch(`${apiBaseUrl}/api/auth/me`, {
					credentials: 'include'
				})
				if (!res.ok) return
				const data = await res.json()
				setUser(data.user ?? null)
			} catch {
				setUser(null)
			}
		}
		loadSession()
	}, [apiBaseUrl])

	useEffect(() => {
		if (!user) {
			setHistory([])
			return
		}

		const loadHistory = async () => {
			setError(null)
			try {
				const res = await fetch(`${apiBaseUrl}/api/invoices`, {
					credentials: 'include'
				})
				if (!res.ok) {
					throw new Error('Failed to load history')
				}
				const data = await res.json()
				setHistory(data.invoices ?? [])
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load history')
			}
		}
		loadHistory()
	}, [apiBaseUrl, user])

	const handleLoadInvoice = (invoice: InvoiceRecord) => {
		window.localStorage.setItem('invoiceDraft', JSON.stringify(invoice.data))
		window.location.href = '/'
	}

	const handleDeleteInvoice = async (id: string) => {
		setError(null)
		try {
			const res = await fetch(`${apiBaseUrl}/api/invoices/${id}`, {
				method: 'DELETE',
				credentials: 'include'
			})
			if (!res.ok) {
				throw new Error('Failed to delete invoice')
			}
			setHistory(prev => prev.filter(item => item.id !== id))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete invoice')
		}
	}

	return (
		<div className='mx-auto max-w-4xl px-4 sm:px-6 py-8'>
			<div className='flex items-center justify-between mb-6'>
				<div className='flex items-center gap-3'>
					<Link
						href='/'
						className='inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200'
						aria-label='Back to editor'
						title='Back to editor'
					>
						<ArrowLeft className='h-4 w-4' />
					</Link>
					<div>
						<h1 className='text-xl font-semibold text-gray-900 dark:text-slate-100'>
							History
						</h1>
						<p className='text-xs text-gray-500 dark:text-slate-400'>
							Drafts and recent invoices
						</p>
					</div>
				</div>
				<AuthControls user={user} onAuth={setUser} apiBaseUrl={apiBaseUrl} />
			</div>

			{error ? (
				<div className='mb-3 text-xs text-red-500'>{error}</div>
			) : null}

			{user ? (
				<InvoiceHistory
					invoices={history}
					onLoad={handleLoadInvoice}
					onDelete={handleDeleteInvoice}
				/>
			) : (
				<div className='card p-4 text-xs text-gray-500 dark:text-slate-400'>
					Sign in to view your invoice history.
				</div>
			)}
		</div>
	)
}
