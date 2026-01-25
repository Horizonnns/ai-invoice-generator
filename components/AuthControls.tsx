'use client'

import type { AuthUser } from '@/types/invoice'
import { LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type AuthControlsProps = {
	user: AuthUser | null
	onAuth: (user: AuthUser | null) => void
	apiBaseUrl: string
}

declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (options: {
						client_id: string
						callback: (response: { credential: string }) => void
					}) => void
					renderButton: (
						container: HTMLElement,
						options: Record<string, string | number | boolean>
					) => void
				}
			}
		}
	}
}

const scriptId = 'google-identity-script'

export default function AuthControls({
	user,
	onAuth,
	apiBaseUrl
}: AuthControlsProps) {
	const isReadyRef = useRef(false)
	const [error, setError] = useState<string | null>(null)
	const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

	useEffect(() => {
		if (user || !clientId) return

		const initialize = () => {
			if (!window.google?.accounts?.id) return
			window.google.accounts.id.initialize({
				client_id: clientId,
				locale: 'en',
				callback: async response => {
					setError(null)
					try {
						const res = await fetch(`${apiBaseUrl}/api/auth/google`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({ credential: response.credential }),
							credentials: 'include'
						})
						if (!res.ok) {
							throw new Error('Google sign-in failed')
						}
						const data = await res.json()
						onAuth(data.user)
					} catch (err) {
						setError(err instanceof Error ? err.message : 'Sign-in failed')
					}
				}
			})
			isReadyRef.current = true
		}

		if (document.getElementById(scriptId)) {
			initialize()
			return
		}

		const script = document.createElement('script')
		script.id = scriptId
		script.src = 'https://accounts.google.com/gsi/client'
		script.async = true
		script.defer = true
		script.onload = initialize
		script.onerror = () => {
			setError('Failed to load Google sign-in')
		}
		document.body.appendChild(script)
	}, [apiBaseUrl, clientId, onAuth, user])

	const handleGoogleSignIn = () => {
		if (!isReadyRef.current || !window.google?.accounts?.id) {
			setError('Google sign-in is not ready')
			return
		}
		setError(null)
		window.google.accounts.id.prompt()
	}

	const handleLogout = async () => {
		setError(null)
		try {
			await fetch(`${apiBaseUrl}/api/auth/logout`, {
				method: 'POST',
				credentials: 'include'
			})
			onAuth(null)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Logout failed')
		}
	}

	if (!clientId) {
		return (
			<span className='text-xs text-red-500'>Missing Google client ID</span>
		)
	}

	return (
		<div className='flex items-center gap-2'>
			{user ? (
				<>
					<div className='flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300'>
						{user.picture ? (
							<img
								src={user.picture}
								alt={user.name ?? user.email}
								className='w-6 h-6 rounded-full'
							/>
						) : null}
						<span>{user.name ?? user.email}</span>
					</div>
					<button
						onClick={handleLogout}
						className='btn-secondary flex items-center gap-1.5 text-xs'
					>
						<LogOut className='w-3.5 h-3.5' />
						Sign out
					</button>
				</>
			) : (
				<button
					type='button'
					onClick={handleGoogleSignIn}
					className='group relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md'
					title='Sign in with Google'
					aria-label='Sign in with Google'
				>
					<span className='sr-only'>Sign in with Google</span>
					<svg aria-hidden='true' viewBox='0 0 48 48' className='w-4.5 h-4.5'>
						<path
							fill='#EA4335'
							d='M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 2.9 29.5 1 24 1 14.6 1 6.4 6.7 2.5 14.9l6.9 5.4C11.2 13.7 17.1 9.5 24 9.5z'
						/>
						<path
							fill='#4285F4'
							d='M46.5 24.5c0-1.6-.1-2.7-.4-3.9H24v7.4h12.7c-.3 1.9-1.7 4.8-4.8 6.8l7.4 5.7c4.4-4.1 7.2-10.1 7.2-16z'
						/>
						<path
							fill='#FBBC05'
							d='M9.4 28.6c-.4-1.2-.7-2.4-.7-3.6s.3-2.4.7-3.6l-6.9-5.4C1 19.1.2 22 .2 25s.8 5.9 2.3 8.6l6.9-5z'
						/>
						<path
							fill='#34A853'
							d='M24 48c6.5 0 12-2.1 16-5.6l-7.4-5.7c-2 1.3-4.6 2.2-8.6 2.2-6.9 0-12.8-4.2-14.6-10.2l-6.9 5C6.4 41.3 14.6 48 24 48z'
						/>
					</svg>
				</button>
			)}
			{error ? <span className='text-[11px] text-red-500'>{error}</span> : null}
		</div>
	)
}
