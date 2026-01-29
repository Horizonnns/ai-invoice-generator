'use client'

import AuthControls from '@/components/AuthControls'
import InvoiceHistory from '@/components/InvoiceHistory'
import type { AuthUser, InvoiceRecord } from '@/types/invoice'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HistoryPageClient() {
	const apiBaseUrl = process.env.NEXT_PUBLIC_URL
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
		<div className='mx-auto max-w-5xl px-4 sm:px-6 py-10'>
			<div className='flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between'>
				<div className='flex items-center gap-3'>
					<Link
						href='/'
						className='icon-button'
						aria-label='Back to editor'
						title='Back to editor'
					>
						<ArrowLeft className='h-4 w-4' />
					</Link>
					<div>
						<h1 className='text-2xl font-semibold text-slate-900 dark:text-slate-100 font-display'>
							History
						</h1>
						<p className='text-xs text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]'>
							Drafts and recent invoices
						</p>
					</div>
				</div>
				<AuthControls
					user={user}
					onAuth={setUser}
					apiBaseUrl={apiBaseUrl}
				/>
			</div>

			{error ? <div className='mb-3 text-xs text-red-500'>{error}</div> : null}

			{user ? (
				<InvoiceHistory
					invoices={history}
					onLoad={handleLoadInvoice}
					onDelete={handleDeleteInvoice}
				/>
			) : (
				<div className='card p-4 text-xs text-slate-500 dark:text-slate-400'>
					Sign in to view your invoice history.
				</div>
			)}
		</div>
	)
}
