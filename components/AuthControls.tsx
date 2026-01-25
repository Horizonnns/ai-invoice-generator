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
	const buttonRef = useRef<HTMLDivElement>(null)
	const [error, setError] = useState<string | null>(null)
	const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

	useEffect(() => {
		if (user || !clientId || !buttonRef.current) return

		const initialize = () => {
			if (!window.google?.accounts?.id || !buttonRef.current) return
			window.google.accounts.id.initialize({
				client_id: clientId,
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
			window.google.accounts.id.renderButton(buttonRef.current, {
				theme: 'outline',
				size: 'medium',
				text: 'signin_with'
			})
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
				<div ref={buttonRef} />
			)}
			{error ? <span className='text-[11px] text-red-500'>{error}</span> : null}
		</div>
	)
}
