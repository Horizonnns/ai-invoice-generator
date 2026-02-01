'use client'

import Header from '@/components/Header'
import InvoiceHistory from '@/components/InvoiceHistory'
import InvoicePreview from '@/components/InvoicePreview'
import type {
	AuthUser,
	InvoiceData,
	InvoiceRecord,
	ParsedInvoiceResponse
} from '@/types/invoice'
import {
	calculateItemAmount,
	createEmptyItem,
	generateInvoiceNumber,
	getDefaultDueDate,
	getTodayDate
} from '@/utils/helpers'
import { Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function HistoryPageClient() {
	const apiBaseUrl = process.env.NEXT_PUBLIC_URL
	const [user, setUser] = useState<AuthUser | null>(null)
	const [history, setHistory] = useState<InvoiceRecord[]>([])
	const [error, setError] = useState<string | null>(null)
	const [showSuccess, setShowSuccess] = useState(false)
	const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(
		null
	)

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
			setShowSuccess(true)
			setTimeout(() => setShowSuccess(false), 3000)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete invoice')
		}
	}

	const handleMagicFill = (parsedData: ParsedInvoiceResponse) => {
		const updatedData: InvoiceData = {
			invoiceNumber: generateInvoiceNumber(),
			issueDate: getTodayDate(),
			dueDate: getDefaultDueDate(),
			sender: { name: '', email: '', address: '', phone: '' },
			recipient: { name: '', email: '', address: '', phone: '' },
			items: [createEmptyItem()],
			notes: '',
			tax: undefined
		}

		if (parsedData.sender) {
			updatedData.sender = { ...updatedData.sender, ...parsedData.sender }
		}

		if (parsedData.recipient) {
			updatedData.recipient = {
				...updatedData.recipient,
				...parsedData.recipient
			}
		}

		if (parsedData.items && parsedData.items.length > 0) {
			updatedData.items = parsedData.items.map(item => ({
				id: Math.random().toString(36).substring(2, 11),
				description: item.description,
				quantity: item.quantity,
				rate: item.rate,
				amount: calculateItemAmount(item.quantity, item.rate)
			}))
		}

		if (parsedData.issueDate) {
			updatedData.issueDate = parsedData.issueDate
		}

		if (parsedData.dueDate) {
			updatedData.dueDate = parsedData.dueDate
		}

		if (parsedData.notes) {
			updatedData.notes = parsedData.notes
		}

		window.localStorage.setItem('invoiceDraft', JSON.stringify(updatedData))
		window.location.href = '/'
	}

	const draftCount = history.filter(inv => inv.status === 'draft').length

	return (
		<div className='min-h-screen'>
			{/* Success Notification */}
			{showSuccess && (
				<div className='fixed top-20 right-4 z-50 animate-fade-in'>
					<div className='flex items-center gap-3 rounded-xl dark:bg-slate-900 px-4 py-3 dark:text-white shadow-2xl shadow-slate-900/40 bg-slate-100 text-slate-900'>
						<div className='flex h-6 w-6 items-center justify-center rounded-full bg-rose-500'>
							<Trash2 className='h-3.5 w-3.5 text-white' />
						</div>

						<p className='font-semibold text-[10px] uppercase tracking-wider'>
							Draft deleted
						</p>
					</div>
				</div>
			)}
			<Header
				user={user}
				onAuth={setUser}
				draftCount={draftCount}
				onMagicFill={handleMagicFill}
				apiBaseUrl={apiBaseUrl}
			/>

			<div className='mx-auto max-w-7xl px-4 sm:px-6 py-10'>
				<div className='mb-8'>
					<h1 className='text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 font-display'>
						History
					</h1>
					<p className='text-xs text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]'>
						Drafts and recent invoices
					</p>
				</div>

				{error ? (
					<div className='mb-3 text-xs text-red-500'>{error}</div>
				) : null}

				{user ? (
					<InvoiceHistory
						invoices={history}
						onLoad={handleLoadInvoice}
						onDelete={handleDeleteInvoice}
						onPreview={setPreviewInvoice}
					/>
				) : (
					<div className='card p-4 text-xs text-slate-500 dark:text-slate-400'>
						Sign in to view your invoice history.
					</div>
				)}
			</div>

			{previewInvoice &&
				createPortal(
					<div
						className='fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200'
						onClick={() => setPreviewInvoice(null)}
					>
						<div
							className='relative bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800'
							onClick={e => e.stopPropagation()}
						>
							{/* Header */}
							<div className='flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10'>
								<div className='flex items-center gap-3'>
									<h3 className='font-bold text-lg text-slate-900 dark:text-white font-display'>
										Invoice Preview
									</h3>
									<span className='px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider'>
										{previewInvoice.data.invoiceNumber || 'Untitled'}
									</span>
								</div>
								<button
									onClick={() => setPreviewInvoice(null)}
									className='p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
								>
									<X className='w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-white' />
								</button>
							</div>

							{/* Content */}
							<div className='flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-950/50 flex justify-center'>
								<div className='w-full max-w-[210mm] relative'>
									<div className='origin-top scale-[0.85] sm:scale-100 transition-transform'>
										<InvoicePreview data={previewInvoice.data} />
									</div>
								</div>
							</div>
						</div>
					</div>,
					document.body
				)}
		</div>
	)
}
