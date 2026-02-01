'use client'

import AuthControls from '@/components/AuthControls'
import MagicFill from '@/components/MagicFill'
import SupportModal from '@/components/SupportModal'
import ThemeToggle from '@/components/ThemeToggle'
import type { AuthUser, ParsedInvoiceResponse } from '@/types/invoice'
import {
	Clock,
	FileText,
	HelpCircle,
	LogOut,
	Menu,
	User,
	X
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface HeaderProps {
	user: AuthUser | null
	onAuth: (user: AuthUser | null) => void
	draftCount: number
	onMagicFill: (data: ParsedInvoiceResponse) => void
	apiBaseUrl?: string
}

export default function Header({
	user,
	onAuth,
	draftCount,
	onMagicFill,
	apiBaseUrl
}: HeaderProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [isSupportOpen, setIsSupportOpen] = useState(false)

	const handleLogout = async () => {
		if (!apiBaseUrl) return
		try {
			await fetch(`${apiBaseUrl}/api/auth/logout`, {
				method: 'POST',
				credentials: 'include'
			})
			onAuth(null)
			setIsMobileMenuOpen(false)
		} catch (err) {
			console.error('Logout failed:', err)
		}
	}

	return (
		<>
			<header className='sticky top-0 z-40 glass border-b border-slate-200/70 dark:border-slate-700/60'>
				<div className='mx-auto max-w-7xl px-4 sm:px-6'>
					<div className='flex items-center justify-between h-16'>
						<div className='flex items-center gap-2.5'>
							<div className='p-2 bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 rounded-xl shadow-md shadow-slate-900/25'>
								<FileText className='w-5 h-5 text-white' />
							</div>

							<Link href='/'>
								<h1 className='text-lg font-bold text-slate-900 dark:text-slate-100 font-display leading-tight'>
									<span className='hidden sm:inline'>AI Invoice Generator</span>
									<span className='sm:hidden'>AI Invoice</span>
								</h1>
								<p className='text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 tracking-wide uppercase hidden sm:block'>
									Ledger-grade invoicing
								</p>
							</Link>
						</div>

						<div className='flex items-center gap-2 sm:gap-2.5'>
							{/* Always visible: Magic Fill */}
							<MagicFill onFill={onMagicFill} />

							{/* Desktop Controls */}
							<div className='hidden sm:flex items-center gap-2.5'>
								<button
									onClick={() => setIsSupportOpen(true)}
									className='icon-button'
									aria-label='Support'
									title='Support'
								>
									<HelpCircle className='relative h-4 w-4' />
								</button>
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
									onAuth={onAuth}
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

												{/* Support Link Mobile */}
												<button
													onClick={() => {
														setIsMobileMenuOpen(false)
														setIsSupportOpen(true)
													}}
													className='w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group'
												>
													<div className='flex items-center gap-3'>
														<div className='p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors'>
															<HelpCircle className='w-4 h-4' />
														</div>
														<span className='text-sm font-medium text-slate-600 dark:text-slate-300'>
															Help & Support
														</span>
													</div>
												</button>

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
															onAuth={onAuth}
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
			<SupportModal
				isOpen={isSupportOpen}
				onClose={() => setIsSupportOpen(false)}
			/>
		</>
	)
}
