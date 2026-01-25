'use client'

import type { ParsedInvoiceResponse } from '@/types/invoice'
import { Loader2, Sparkles, Wand2, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import VoiceInput from './VoiceInput'

interface MagicFillProps {
	onFill: (data: ParsedInvoiceResponse) => void
}

const MagicFill: React.FC<MagicFillProps> = ({ onFill }) => {
	const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
	const [isOpen, setIsOpen] = useState(false)
	const [text, setText] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	const handleSubmit = async () => {
		if (!text.trim()) return

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(`${apiBaseUrl}/api/parse-invoice`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ text })
			})

			if (!response.ok) {
				throw new Error('Failed to parse invoice data')
			}

			const data: ParsedInvoiceResponse = await response.json()
			onFill(data)
			setIsOpen(false)
			setText('')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong')
		} finally {
			setIsLoading(false)
		}
	}

	const modalContent = isOpen ? (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: '100vw',
				height: '100vh',
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
				backdropFilter: 'blur(8px)',
				WebkitBackdropFilter: 'blur(8px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 9999,
				padding: '16px'
			}}
			onClick={e => {
				if (e.target === e.currentTarget) {
					setIsOpen(false)
				}
			}}
		>
			<div className='bg-white dark:bg-slate-900 dark:text-slate-100 rounded-xl shadow-2xl w-full max-w-md overflow-hidden'>
				{/* Header */}
				<div
					className='px-4 py-3 flex items-center justify-between'
					style={{
						background:
							'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)'
					}}
				>
					<div className='flex items-center gap-2 text-white'>
						<div className='p-1.5 bg-white/20 rounded-md'>
							<Wand2 className='w-4 h-4' />
						</div>
						<div>
							<h3 className='font-semibold text-sm'>AI Magic Fill</h3>
							<p className='text-white/80 text-xs'>
								Describe your invoice in plain text
							</p>
						</div>
					</div>
					<button
						onClick={() => setIsOpen(false)}
						className='p-1.5 hover:bg-white/20 rounded-md transition-colors text-white'
					>
						<X className='w-4 h-4' />
					</button>
				</div>

				{/* Body */}
				<div className='p-4'>
					<textarea
						value={text}
						onChange={e => setText(e.target.value)}
						placeholder='Example: I did 5 hours of design work at $50/hour for John Doe from Acme Corp. My business name is Creative Studio and my email is hello@creative.com.'
						className='input-field h-28 resize-none text-sm'
						disabled={isLoading}
					/>

					{error && (
						<div className='mt-2 p-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300 rounded-md text-xs'>
							{error}
						</div>
					)}

					{/* Voice Input */}
					<div className='mt-3 flex items-center justify-between p-3 bg-linear-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/15 dark:to-purple-500/15 rounded-lg border border-indigo-100 dark:border-indigo-500/30'>
						<span className='text-xs font-medium text-indigo-700 dark:text-indigo-200'>
							Or use voice input:
						</span>
						<VoiceInput
							onTranscript={transcript => setText(transcript)}
							disabled={isLoading}
						/>
					</div>

					<div className='mt-3 flex gap-2'>
						<button
							onClick={() => setIsOpen(false)}
							className='btn-secondary flex-1'
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={isLoading || !text.trim()}
							className='btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{isLoading ? (
								<>
									<Loader2 className='w-4 h-4 animate-spin' />
									Processing...
								</>
							) : (
								<>
									<Sparkles className='w-4 h-4' />
									Fill Invoice
								</>
							)}
						</button>
					</div>
				</div>

				{/* Tips */}
				<div className='px-4 pb-4'>
					<div className='p-3 bg-linear-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/15 dark:to-purple-500/15 rounded-lg border border-indigo-100 dark:border-indigo-500/30'>
						<p className='text-xs text-indigo-700 dark:text-indigo-200 font-medium mb-1.5'>
							💡 Tips for best results:
						</p>
						<ul className='text-[11px] text-indigo-600 dark:text-indigo-200/80 space-y-0.5'>
							<li>• Include your business name and contact info</li>
							<li>• Mention the client's name and company</li>
							<li>• Describe services with quantities and rates</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	) : null

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className='group relative flex items-center justify-center w-9 h-9 rounded-lg font-medium text-white text-sm overflow-hidden transition-all duration-300 hover:scale-105'
				style={{
					background:
						'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)',
					boxShadow: '0 3px 12px rgba(99, 102, 241, 0.35)'
				}}
				title='Magic Fill'
			>
				<div className='absolute inset-0 bg-linear-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700' />
				<Wand2 className='w-4 h-4' />
			</button>
			{modalContent && createPortal(modalContent, document.body)}
		</>
	)
}

export default MagicFill
