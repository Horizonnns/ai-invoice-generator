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
	createEmptyItem,
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
			<header className='sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-slate-800/70'>
				<div className='mx-auto px-4 sm:px-6'>
					<div className='flex items-center justify-between h-14'>
						<div className='flex items-center gap-2.5'>
							<div className='p-1.5 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md shadow-indigo-500/25'>
								<FileText className='w-5 h-5 text-white' />
							</div>
							<div>
								<h1 className='text-lg font-bold text-gray-900 dark:text-slate-100'>
									AI Invoice Generator
								</h1>
								<p className='text-[11px] text-gray-500 dark:text-slate-400 -mt-0.5'>
									Create professional invoices instantly
								</p>
							</div>
						</div>
						<div className='flex items-center gap-2.5'>
							<MagicFill onFill={handleMagicFill} />
							<ThemeToggle />
							<Link
								href='/history'
								className='group relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/20 bg-white/70 text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200'
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
			<main className='mx-auto px-4 sm:px-6'>
				{children ? (
					<section className='mb-6 max-w-3xl'>{children}</section>
				) : null}

				<div className='flex flex-col lg:flex-row gap-6'>
					{/* Left Column - Form */}
					<div className='lg:w-1/2 lg:shrink-0'>
						<InvoiceForm
							data={invoiceData}
							onChange={setInvoiceData}
							onSaveDraft={handleSaveDraft}
							canSaveDraft={Boolean(user)}
							isSaving={isSaving}
						/>
					</div>

					{/* Right Column - Preview */}
					<div className='w-full sticky top-20'>
						{historyError ? (
							<div className='mb-3 text-xs text-red-500'>{historyError}</div>
						) : null}

						<InvoicePreview
							ref={previewRef}
							data={invoiceData}
							isDownloading={isDownloading}
							onDownload={handleDownload}
						/>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className='py-5 mt-6 border-t border-gray-200 bg-white/50 dark:border-slate-800/70 dark:bg-slate-900/50'>
				<div className='mx-auto px-4 sm:px-6'>
					<div className='flex flex-col md:flex-row items-center justify-between gap-3'>
						<div className='flex items-center gap-2 text-gray-500 dark:text-slate-400 text-xs'>
							<FileText className='w-3.5 h-3.5' />
							<span>AI Invoice Generator</span>
						</div>

						<p className='text-gray-400 dark:text-slate-500 text-xs'>
							© {new Date().getFullYear()} All rights reserved
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
