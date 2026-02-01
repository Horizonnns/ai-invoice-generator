'use client'

import { Loader2, Send, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

interface SupportModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isSent, setIsSent] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!message.trim() || !email.trim()) return

		setIsLoading(true)
		setError(null)

		try {
			const res = await fetch('/api/support', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, message })
			})

			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error || 'Failed to send message')
			}

			setIsSent(true)
			setTimeout(() => {
				setIsSent(false)
				setEmail('')
				setMessage('')
				onClose()
			}, 2000)
		} catch (err) {
			setError('Failed to send message. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	if (!isOpen) return null

	const content = (
		<div
			className='fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200'
			onClick={e => e.target === e.currentTarget && onClose()}
		>
			<div className='bg-white dark:bg-[#111111] rounded-[20px] shadow-[0_0_50px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden border border-slate-200 dark:border-white/5 animate-in zoom-in-95 duration-200 relative'>
				{/* Header */}
				<div className='px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5'>
					<div className='flex items-center gap-2'>
						<div className='w-2 h-2 rounded-full bg-indigo-500' />
						<span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
							Support Request
						</span>
					</div>
					<button
						onClick={onClose}
						className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors'
					>
						<X className='w-4 h-4' />
					</button>
				</div>

				<div className='p-8 pb-6'>
					{isSent ? (
						<div className='flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-bottom-4'>
							<div className='w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6'>
								<Send className='w-8 h-8 text-emerald-500' />
							</div>
							<h4 className='text-3xl font-display font-bold text-slate-900 dark:text-white mb-3'>
								Message Sent
							</h4>
							<p className='text-slate-500 dark:text-slate-400 text-lg max-w-[300px] leading-relaxed'>
								We've received your message and will get back to you shortly.
							</p>
						</div>
					) : (
						<div className='space-y-6'>
							<div>
								<h3 className='text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-2'>
									How can we <br /> help you today?
								</h3>
							</div>

							<div className='space-y-4'>
								<input
									type='email'
									value={email}
									onChange={e => setEmail(e.target.value)}
									placeholder='your@email.com'
									className='w-full bg-transparent border-b border-slate-200 dark:border-slate-800 py-2 text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors placeholder:text-slate-400 dark:text-white'
									required
								/>

								<textarea
									value={message}
									onChange={e => setMessage(e.target.value)}
									placeholder='Describe your issue or suggestion...'
									className='w-full h-32 p-0 text-lg font-medium bg-transparent border-none focus:ring-0 outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 dark:text-white'
									disabled={isLoading}
									required
								/>
							</div>

							{error && (
								<div className='text-xs font-bold text-rose-500'>{error}</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				{!isSent && (
					<div className='px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 dark:bg-white/5 flex items-center justify-between border-t border-slate-100 dark:border-white/5'>
						<div className='text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden sm:block'>
							We typically respond in 24h
						</div>

						<div className='flex items-center gap-3 w-full sm:w-auto justify-end'>
							<button
								onClick={onClose}
								className='text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-4'
								disabled={isLoading}
							>
								Cancel
							</button>

							<button
								onClick={e => handleSubmit(e as any)}
								disabled={isLoading || !email || !message}
								className='h-9 sm:h-11 px-4 sm:px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm sm:text-base rounded-lg sm:rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-slate-900/10 dark:shadow-none'
							>
								{isLoading ? (
									<Loader2 className='w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin' />
								) : (
									<>
										<span>Send Message</span>
										<Send className='w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-50' />
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)

	return createPortal(content, document.body)
}
