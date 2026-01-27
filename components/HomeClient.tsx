'use client'

import AuthControls from '@/components/AuthControls'
import InvoiceForm from '@/components/InvoiceForm'
import InvoicePreview, {
	type InvoicePreviewRef
} from '@/components/InvoicePreview'
import MagicFill from '@/components/MagicFill'
import ThemeToggle from '@/components/ThemeToggle'
import type {
	AuthUser,
	InvoiceData,
	ParsedInvoiceResponse
} from '@/types/invoice'
import {
	calculateItemAmount,
	calculateSubtotal,
	calculateTax,
	calculateTotal,
	createEmptyItem,
	formatCurrency,
	formatDate,
	generateInvoiceNumber,
	getDefaultDueDate,
	getTodayDate
} from '@/utils/helpers'
import { Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const defaultInvoiceData: InvoiceData = {
	invoiceNumber: '',
	issueDate: getTodayDate(),
	dueDate: getDefaultDueDate(),
	sender: {
		name: '',
		email: '',
		address: '',
		phone: ''
	},
	recipient: {
		name: '',
		email: '',
		address: '',
		phone: ''
	},
	items: [createEmptyItem()],
	notes: '',
	tax: undefined
}

type HomeClientProps = {
	children?: React.ReactNode
}

export default function HomeClient({ children }: HomeClientProps) {
	const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
	const [invoiceData, setInvoiceData] =
		useState<InvoiceData>(defaultInvoiceData)
	const [isDownloading, setIsDownloading] = useState(false)
	const previewRef = useRef<InvoicePreviewRef>(null)
	const [user, setUser] = useState<AuthUser | null>(null)
	const [historyError, setHistoryError] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const subtotal = calculateSubtotal(invoiceData.items)
	const taxAmount = calculateTax(subtotal, invoiceData.tax || 0)
	const total = calculateTotal(subtotal, taxAmount)

	// Set initial invoice number on client side to prevent hydration mismatch
	useEffect(() => {
		setInvoiceData(prev =>
			prev.invoiceNumber
				? prev
				: {
						...prev,
						invoiceNumber: generateInvoiceNumber()
					}
		)
	}, [])

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
		const stored = window.localStorage.getItem('invoiceDraft')
		if (!stored) return
		try {
			const parsed = JSON.parse(stored) as InvoiceData
			setInvoiceData(parsed)
		} catch {
			// Ignore invalid cached draft.
		} finally {
			window.localStorage.removeItem('invoiceDraft')
		}
	}, [])

	useEffect(() => {
		const loadHistory = async () => {
			setHistoryError(null)
			try {
				const res = await fetch(`${apiBaseUrl}/api/invoices`, {
					credentials: 'include'
				})
				if (!res.ok) {
					throw new Error('Failed to load history')
				}
				const data = await res.json()
			} catch (error) {
				setHistoryError(
					error instanceof Error ? error.message : 'Failed to load history'
				)
			}
		}
		loadHistory()
	}, [apiBaseUrl, user])

	const handleDownload = async () => {
		if (!previewRef.current) return
		setIsDownloading(true)
		try {
			await previewRef.current.downloadPDF()
		} finally {
			setIsDownloading(false)
		}
	}

	const handleMagicFill = (parsedData: ParsedInvoiceResponse) => {
		const updatedData = { ...invoiceData }

		if (parsedData.sender) {
			updatedData.sender = {
				...invoiceData.sender,
				...parsedData.sender
			}
		}

		if (parsedData.recipient) {
			updatedData.recipient = {
				...invoiceData.recipient,
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

		setInvoiceData(updatedData)
	}

	const handleSaveDraft = async () => {
		if (!user) return
		setIsSaving(true)
		setHistoryError(null)
		try {
			const res = await fetch(`${apiBaseUrl}/api/invoices`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					status: 'draft',
					data: invoiceData
				})
			})
			if (!res.ok) {
				throw new Error('Failed to save draft')
			}
			const data = await res.json()
		} catch (error) {
			setHistoryError(
				error instanceof Error ? error.message : 'Failed to save draft'
			)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className='min-h-screen'>
			{/* Header */}
			<header className='sticky top-0 z-40 glass border-b border-slate-200/70 dark:border-slate-700/60'>
				<div className='mx-auto max-w-6xl px-4 sm:px-6'>
					<div className='flex items-center justify-between h-16'>
						<div className='flex items-center gap-2.5'>
							<div className='p-2 bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 rounded-xl shadow-md shadow-slate-900/25'>
								<FileText className='w-5 h-5 text-white' />
							</div>
							<div>
								<h1 className='text-lg font-bold text-slate-900 dark:text-slate-100 font-display'>
									AI Invoice Generator
								</h1>
								<p className='text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 tracking-wide uppercase'>
									Ledger-grade invoicing
								</p>
							</div>
						</div>
						<div className='flex items-center gap-2.5'>
							<MagicFill onFill={handleMagicFill} />
							<ThemeToggle />
							<Link
								href='/history'
								className='icon-button'
								aria-label='History'
								title='History'
							>
								<Clock className='relative h-4 w-4' />
							</Link>
							<AuthControls
								user={user}
								onAuth={setUser}
								apiBaseUrl={apiBaseUrl}
							/>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content - Balanced columns */}
			<main className='mx-auto max-w-6xl px-4 sm:px-6'>
				{children ? (
					<section className='mb-6 max-w-3xl'>{children}</section>
				) : null}

				<section className='mt-6 mb-8 grid gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/50'>
					<div className='flex flex-col gap-2'>
						<p className='text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400'>
							Invoice workspace
						</p>
						<h2 className='text-2xl font-semibold text-slate-900 dark:text-white font-display'>
							Create, review, and export with confidence.
						</h2>
					</div>
					<div className='grid gap-3 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3'>
						<div className='rounded-xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60'>
							<p className='font-semibold text-slate-900 dark:text-white'>
								Structured details
							</p>
							<p className='mt-1 text-[11px]'>
								Clean fields for clients, terms, and totals.
							</p>
						</div>
						<div className='rounded-xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60'>
							<p className='font-semibold text-slate-900 dark:text-white'>
								Magic Fill ready
							</p>
							<p className='mt-1 text-[11px]'>
								Drop in text or voice and polish the draft.
							</p>
						</div>
						<div className='rounded-xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60'>
							<p className='font-semibold text-slate-900 dark:text-white'>
								PDF perfect
							</p>
							<p className='mt-1 text-[11px]'>
								Export client-ready invoices with one click.
							</p>
						</div>
					</div>
				</section>

				<div className='flex flex-col lg:flex-row gap-8'>
					{/* Left Column - Form */}
					<div className='lg:w-[55%] lg:shrink-0'>
						<InvoiceForm data={invoiceData} onChange={setInvoiceData} />
					</div>

					{/* Right Column - Preview */}
					<div className='w-full lg:w-[45%] self-start space-y-4'>
						{historyError ? (
							<div className='mb-3 text-xs text-red-500'>{historyError}</div>
						) : null}

						<div className='card p-4'>
							<div className='flex items-center justify-between gap-2'>
								<div>
									<p className='text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400'>
										Invoice summary
									</p>
									<h3 className='text-lg font-semibold text-slate-900 dark:text-white font-display'>
										{formatCurrency(total)}
									</h3>
								</div>
								<button
									onClick={handleSaveDraft}
									className='btn-primary text-xs'
									disabled={!user || isSaving}
								>
									{isSaving ? 'Saving...' : 'Save draft'}
								</button>
							</div>
							<div className='mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300'>
								<div className='rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700/60 dark:bg-slate-900/40'>
									<p className='text-[11px] uppercase tracking-[0.2em] text-slate-400'>
										Client
									</p>
									<p className='mt-1 font-semibold text-slate-800 dark:text-slate-100'>
										{invoiceData.recipient.name || 'Client name'}
									</p>
								</div>
								<div className='rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700/60 dark:bg-slate-900/40'>
									<p className='text-[11px] uppercase tracking-[0.2em] text-slate-400'>
										Items
									</p>
									<p className='mt-1 font-semibold text-slate-800 dark:text-slate-100'>
										{invoiceData.items.length}
									</p>
								</div>
								<div className='rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700/60 dark:bg-slate-900/40'>
									<p className='text-[11px] uppercase tracking-[0.2em] text-slate-400'>
										Issue date
									</p>
									<p className='mt-1 font-semibold text-slate-800 dark:text-slate-100'>
										{invoiceData.issueDate
											? formatDate(invoiceData.issueDate)
											: '-'}
									</p>
								</div>
								<div className='rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700/60 dark:bg-slate-900/40'>
									<p className='text-[11px] uppercase tracking-[0.2em] text-slate-400'>
										Due date
									</p>
									<p className='mt-1 font-semibold text-slate-800 dark:text-slate-100'>
										{invoiceData.dueDate
											? formatDate(invoiceData.dueDate)
											: '-'}
									</p>
								</div>
							</div>
							<div className='mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300'>
								<span>Subtotal</span>
								<span className='font-semibold text-slate-800 dark:text-slate-100'>
									{formatCurrency(subtotal)}
								</span>
							</div>
							{(invoiceData.tax || 0) > 0 ? (
								<div className='mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300'>
									<span>Tax ({invoiceData.tax}%)</span>
									<span className='font-semibold text-slate-800 dark:text-slate-100'>
										{formatCurrency(taxAmount)}
									</span>
								</div>
							) : null}
							{!user ? (
								<p className='mt-3 text-[11px] text-slate-500 dark:text-slate-400'>
									Sign in to save drafts to history.
								</p>
							) : null}
						</div>

						<div className='sticky top-24'>
							<InvoicePreview
								ref={previewRef}
								data={invoiceData}
								isDownloading={isDownloading}
								onDownload={handleDownload}
							/>
						</div>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className='py-6 mt-6 border-t border-slate-200/70 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/40'>
				<div className='mx-auto max-w-6xl px-4 sm:px-6'>
					<div className='flex flex-col md:flex-row items-center justify-between gap-3'>
						<div className='flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs'>
							<FileText className='w-3.5 h-3.5' />
							<span>AI Invoice Generator</span>
						</div>

						<p className='text-slate-400 dark:text-slate-500 text-xs'>
							© {new Date().getFullYear()} All rights reserved
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
