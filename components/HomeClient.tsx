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
	generateInvoiceNumber,
	getDefaultDueDate,
	getTodayDate
} from '@/utils/helpers'
import { Clock, Download, FileText, Loader2 } from 'lucide-react'
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
	const [showSuccess, setShowSuccess] = useState(false)
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
			setShowSuccess(true)
			setTimeout(() => setShowSuccess(false), 3000)
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
			{/* Success Notification */}
			{showSuccess && (
				<div className='fixed top-20 right-4 z-50 animate-fade-in'>
					<div className='flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl shadow-slate-900/40 dark:bg-slate-100 dark:text-slate-900'>
						<div className='flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500'>
							<Clock className='h-3.5 w-3.5 text-white' />
						</div>

						<div>
							<p className='font-semibold text-[10px] uppercase tracking-wider'>
								Stored in your drafts
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<header className='sticky top-0 z-40 glass border-b border-slate-200/70 dark:border-slate-700/60'>
				<div className='mx-auto max-w-7xl px-4 sm:px-6'>
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
			<main className='mx-auto max-w-7xl px-4 sm:px-6 py-8'>
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
					{/* Left Column: Editor (Approx 60%) */}
					<div className='lg:col-span-7 space-y-6'>
						<InvoiceForm
							data={invoiceData}
							onChange={setInvoiceData}
						/>
					</div>

					{/* Right Column: Preview & Actions (Approx 40%) */}
					<div className='lg:col-span-5 sticky top-24 space-y-6'>
						{/* Actions Card */}
						<div className='card p-5 flex flex-col gap-4'>
							<div className='flex items-center justify-between'>
								<div>
									<h2 className='text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider'>
										Invoice Summary
									</h2>
									<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
										Total due amount
									</p>
								</div>
								<div className='text-right'>
									<div className='text-xl font-display font-bold text-slate-900 dark:text-white'>
										{formatCurrency(total)}
									</div>
									<p className='text-[10px] text-slate-500 dark:text-slate-400 font-medium'>
										{invoiceData.items.length} items • Tax:{' '}
										{formatCurrency(taxAmount)}
									</p>
								</div>
							</div>

							<div className='h-px bg-slate-200 dark:bg-slate-800 w-full' />

							<div className='grid grid-cols-2 gap-3'>
								<button
									onClick={handleSaveDraft}
									disabled={isSaving || !user}
									className='flex items-center justify-center gap-2 h-11 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
								>
									{isSaving ? (
										<span className='animate-pulse'>Saving...</span>
									) : (
										'Save Draft'
									)}
								</button>

								<button
									onClick={handleDownload}
									disabled={isDownloading}
									style={{
										padding: '8px 14px',
										background:
											'linear-gradient(135deg, #0b1b2b 0%, #1e3550 55%, #b08968 100%)',
										borderRadius: '10px',
										color: '#ffffff',
										fontWeight: '500',
										fontSize: '13px',
										border: 'none',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '6px',
										zIndex: 10,
										boxShadow: '0 10px 20px rgba(11, 27, 43, 0.25)',
										opacity: isDownloading ? 0.6 : 1
									}}
								>
									{isDownloading ? (
										<>
											<Loader2
												style={{
													width: '14px',
													height: '14px',
													animation: 'spin 1s linear infinite'
												}}
											/>
											Generating...
										</>
									) : (
										<>
											<Download style={{ width: '14px', height: '14px' }} />
											Download PDF
										</>
									)}
								</button>
							</div>
						</div>

						{/* Interactive Preview */}
						<div className='relative group perspective-1000'>
							<InvoicePreview
								ref={previewRef}
								data={invoiceData}
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
