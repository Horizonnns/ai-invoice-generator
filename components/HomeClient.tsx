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
import {
	Clock,
	Download,
	FileText,
	Loader2,
	LogOut,
	Menu,
	User,
	X
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const defaultInvoiceData: InvoiceData = {
	invoiceNumber: '',
	issueDate: getTodayDate(),
	dueDate: getDefaultDueDate(),
	sender: { name: '', email: '', address: '', phone: '' },
	recipient: { name: '', email: '', address: '', phone: '' },
	items: [createEmptyItem()],
	notes: '',
	tax: undefined
}

type HomeClientProps = {
	children?: React.ReactNode
}

export default function HomeClient({ children }: HomeClientProps) {
	const apiBaseUrl = process.env.NEXT_PUBLIC_URL
	const [invoiceData, setInvoiceData] =
		useState<InvoiceData>(defaultInvoiceData)
	const [isDownloading, setIsDownloading] = useState(false)
	const previewRef = useRef<InvoicePreviewRef>(null)
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [showSuccess, setShowSuccess] = useState(false)
	const [draftCount, setDraftCount] = useState(0)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const subtotal = calculateSubtotal(invoiceData.items)
	const taxAmount = calculateTax(subtotal, invoiceData.tax || 0)
	const total = calculateTotal(subtotal, taxAmount)

	// Set initial invoice number on client side to prevent hydration mismatch
	useEffect(() => {
		setInvoiceData(prev =>
			prev.invoiceNumber
				? prev
				: { ...prev, invoiceNumber: generateInvoiceNumber() }
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
		if (!user) {
			setDraftCount(0)
			return
		}
		const fetchDraftsCount = async () => {
			try {
				const res = await fetch(`${apiBaseUrl}/api/invoices`)
				if (res.ok) {
					const { invoices } = await res.json()
					const drafts = invoices.filter((inv: any) => inv.status === 'draft')
					setDraftCount(drafts.length)
				}
			} catch {}
		}
		fetchDraftsCount()
	}, [user, apiBaseUrl])

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
			updatedData.sender = { ...invoiceData.sender, ...parsedData.sender }
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
		try {
			const res = await fetch(`${apiBaseUrl}/api/invoices`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					status: 'draft',
					data: invoiceData
				})
			})
			if (!res.ok) {
				throw new Error('Failed to save draft')
			}
			await res.json()
			setDraftCount(prev => prev + 1)
			setShowSuccess(true)
			setTimeout(() => setShowSuccess(false), 3000)
		} catch (error) {
		} finally {
			setIsSaving(false)
		}
	}

	const handleLogout = async () => {
		try {
			await fetch(`${apiBaseUrl}/api/auth/logout`, {
				method: 'POST',
				credentials: 'include'
			})
			setUser(null)
			setIsMobileMenuOpen(false)
		} catch (err) {
			console.error('Logout failed:', err)
		}
	}

	return (
		<div className='min-h-screen'>
			{/* Success Notification */}
			{showSuccess && (
				<div className='fixed top-20 right-4 z-50 animate-fade-in'>
					<div className='flex items-center gap-3 rounded-xl dark:bg-slate-900 px-4 py-3 dark:text-white shadow-2xl shadow-slate-900/40 bg-slate-100 text-slate-900'>
						<div className='flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500'>
							<Clock className='h-3.5 w-3.5 text-white' />
						</div>

						<p className='font-semibold text-[10px] uppercase tracking-wider'>
							Stored in your drafts
						</p>
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
								<h1 className='text-lg font-bold text-slate-900 dark:text-slate-100 font-display leading-tight'>
									<span className='hidden sm:inline'>AI Invoice Generator</span>
									<span className='sm:hidden'>AI Invoice</span>
								</h1>
								<p className='text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 tracking-wide uppercase hidden sm:block'>
									Ledger-grade invoicing
								</p>
							</div>
						</div>

						<div className='flex items-center gap-2 sm:gap-2.5'>
							{/* Always visible: Magic Fill */}
							<MagicFill onFill={handleMagicFill} />

							{/* Desktop Controls */}
							<div className='hidden sm:flex items-center gap-2.5'>
								<ThemeToggle />
								<Link
									href='/history'
									className='icon-button'
									aria-label='History'
									title='History'
								>
									<Clock className='relative h-4 w-4' />
									{user && draftCount > 0 && (
										<span className='absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-in zoom-in duration-300'>
											{draftCount}
										</span>
									)}
								</Link>
								<AuthControls
									user={user}
									onAuth={setUser}
									apiBaseUrl={apiBaseUrl}
								/>
							</div>

							{/* Mobile Menu Button */}
							<div className='sm:hidden relative'>
								<button
									onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
									className='w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95'
								>
									{isMobileMenuOpen ? (
										<X className='w-4 h-4' />
									) : (
										<Menu className='w-4 h-4' />
									)}
									{user && draftCount > 0 && !isMobileMenuOpen && (
										<span className='absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900' />
									)}
								</button>

								{/* Mobile Dropdown */}
								<>
									<div
										className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-xs transition-opacity duration-200 ${
											isMobileMenuOpen
												? 'opacity-100 pointer-events-auto'
												: 'opacity-0 pointer-events-none'
										}`}
										onClick={() => setIsMobileMenuOpen(false)}
										aria-hidden='true'
									/>
									<div
										className={`absolute right-0 top-12 z-50 w-64 flex flex-col gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-200 origin-top-right ${
											isMobileMenuOpen
												? 'opacity-100 scale-100 pointer-events-auto'
												: 'opacity-0 scale-95 pointer-events-none'
										}`}
									>
										<div className='flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/50'>
											<span className='text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1'>
												Menu
											</span>
											<ThemeToggle />
										</div>

										{/* User & Auth Section */}
										{user ? (
											<>
												{/* User Profile Item */}
												<div className='flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default'>
													<div className='relative'>
														{user.picture ? (
															<img
																src={user.picture}
																alt={user.name || 'User'}
																className='w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700'
															/>
														) : (
															<div className='w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700'>
																<User className='w-4 h-4 text-slate-400' />
															</div>
														)}
													</div>
													<div className='flex flex-col'>
														<span className='text-sm font-medium text-slate-900 dark:text-slate-200 truncate max-w-[140px]'>
															{user.name || 'User'}
														</span>
														<span className='text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]'>
															{user.email}
														</span>
													</div>
												</div>

												{/* History Link */}
												<Link
													href='/history'
													className='flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group'
													onClick={() => setIsMobileMenuOpen(false)}
												>
													<div className='flex items-center gap-3'>
														<div className='p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors'>
															<Clock className='w-4 h-4' />
														</div>

														<span className='text-sm font-medium text-slate-600 dark:text-slate-300'>
															History
														</span>
													</div>

													{user && draftCount > 0 && (
														<span className='min-w-[20px] h-5 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm shadow-rose-500/20'>
															{draftCount}
														</span>
													)}
												</Link>

												<div className='h-px bg-slate-100 dark:bg-slate-800/50 my-1' />

												{/* Logout Button */}
												<button
													onClick={handleLogout}
													className='flex items-center w-full gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group'
												>
													<div className='p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/20 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors'>
														<LogOut className='w-4 h-4' />
													</div>
													<span className='text-sm font-medium'>Log out</span>
												</button>
											</>
										) : (
											<>
												<Link
													href='/history'
													className='flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group'
													onClick={() => setIsMobileMenuOpen(false)}
												>
													<div className='flex items-center gap-3'>
														<div className='p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors'>
															<Clock className='w-4 h-4' />
														</div>
														<span className='text-sm font-medium text-slate-600 dark:text-slate-300'>
															History
														</span>
													</div>
												</Link>

												<div className='pt-2 border-t border-slate-100 dark:border-slate-800/50'>
													<div className='px-1'>
														<AuthControls
															user={user}
															onAuth={setUser}
															apiBaseUrl={apiBaseUrl}
															layout='full'
														/>
													</div>
												</div>
											</>
										)}
									</div>
								</>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content - Balanced columns */}
			<main className='mx-auto max-w-7xl px-4 sm:px-6 sm:py-8 py-4'>
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start'>
					{/* Left Column: Editor (Approx 60%) */}
					<div className='lg:col-span-7 space-y-6'>
						<InvoiceForm
							data={invoiceData}
							onChange={setInvoiceData}
						/>
					</div>

					{/* Right Column: Preview & Actions (Approx 40%) */}
					<div className='lg:col-span-5 sticky top-24 space-y-4'>
						{/* Actions Card */}
						<div className='card p-5 flex flex-col gap-4'>
							<div className='flex items-center justify-between'>
								<div>
									<h2 className='text-sm font-semibold text-slate-900 dark:text-slate-200 font-display'>
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
									className='flex items-center justify-center gap-2 h-9 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
									className='flex items-center justify-center gap-2 h-9 rounded-lg px-4 bg-linear-to-br from-slate-900 via-slate-800 to-brass text-white text-[12px] font-medium shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.98] transition-all disabled:opacity-70'
								>
									{isDownloading ? (
										<>
											<Loader2 className='w-3.5 h-3.5 animate-spin' />
											<span>Generating...</span>
										</>
									) : (
										<>
											<Download className='w-3.5 h-3.5' />
											<span>Download PDF</span>
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
								onLogoChange={logo =>
									setInvoiceData(prev => ({ ...prev, logo }))
								}
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
