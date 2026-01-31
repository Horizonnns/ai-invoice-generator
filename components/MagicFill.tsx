'use client'

import VoiceInput from '@/components/VoiceInput'
import type { ParsedInvoiceResponse } from '@/types/invoice'
import { Brain, CornerDownLeft, HelpCircle, Loader2, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface MagicFillProps {
	onFill: (data: ParsedInvoiceResponse) => void
}

const MagicFill: React.FC<MagicFillProps> = ({ onFill }) => {
	const apiBaseUrl = process.env.NEXT_PUBLIC_URL
	const [isOpen, setIsOpen] = useState(false)
	const [text, setText] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

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
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			})

			if (!response.ok) throw new Error('Failed to parse invoice data')

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
			className='fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
			onClick={e => e.target === e.currentTarget && setIsOpen(false)}
		>
			<div className='bg-white dark:bg-[#111111] rounded-[20px] shadow-[0_0_50px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden border border-slate-200 dark:border-white/5 animate-in fade-in zoom-in duration-300'>
				{/* Workspace Header: Minimal */}
				<div className='px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5'>
					<div className='flex items-center gap-2'>
						<div className='w-2 h-2 rounded-full bg-emerald-500' />
						<span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
							AI Workspace Active
						</span>
					</div>
					<button
						onClick={() => setIsOpen(false)}
						className='text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors'
					>
						<X className='w-4 h-4' />
					</button>
				</div>

				<div className='p-8 pb-6'>
					<div className='space-y-4'>
						<h3 className='text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]'>
							Describe your <br /> invoice details
						</h3>

						<div className='relative mt-6'>
							<textarea
								value={text}
								onChange={e => setText(e.target.value)}
								placeholder='Explain the details...'
								className='w-full h-32 p-0 text-lg font-medium bg-transparent border-none focus:ring-0 outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-800 dark:text-white'
								disabled={isLoading}
								autoFocus
							/>
						</div>
					</div>

					{error && (
						<div className='mt-2 text-xs font-bold text-rose-500'>{error}</div>
					)}
				</div>

				{/* Toolbar: Clean & Utility focused */}
				<div className='px-6 py-4 bg-slate-50 dark:bg-white/5 flex items-center justify-between border-t border-slate-100 dark:border-white/5'>
					<div className='flex items-center gap-4'>
						<div className='flex items-center'>
							<VoiceInput
								onTranscript={t => setText(t)}
								disabled={isLoading}
							/>
						</div>

						<div className='group relative'>
							<HelpCircle className='w-4 h-4 text-slate-300 cursor-help hover:text-slate-500 transition-colors' />
							<div className='absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity'>
								Mention: Business name, client name, services, rates and totals.
							</div>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						<button
							onClick={() => setIsOpen(false)}
							className='text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-4'
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={isLoading || !text.trim()}
							className='h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-slate-900/10 dark:shadow-none'
						>
							{isLoading ? (
								<Loader2 className='w-4 h-4 animate-spin' />
							) : (
								(
									<>
										<span>Process</span>
										<CornerDownLeft className='w-3.5 h-3.5 opacity-50' />
									</>
								) || 'Process Draft'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	) : null

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className='group h-9 w-9 sm:w-auto p-0 sm:px-3 flex items-center justify-center sm:justify-start gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm active:scale-95'
				title='AI Magic Fill'
			>
				<Brain className='w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform' />
				<span className='hidden sm:inline'>Magic Fill</span>
			</button>
			{modalContent && createPortal(modalContent, document.body)}
		</>
	)
}

export default MagicFill
