'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeToggle = () => {
	const [theme, setTheme] = useState<Theme>('light')
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
		const attr =
			(document.documentElement.getAttribute('data-theme') as Theme | null) ||
			null
		const stored = window.localStorage.getItem('theme') as Theme | null
		const prefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)'
		).matches
		const resolved = attr || stored || (prefersDark ? 'dark' : 'light')
		setTheme(resolved)
		document.documentElement.setAttribute('data-theme', resolved)
		document.documentElement.classList.toggle('dark', resolved === 'dark')
	}, [])

	const updateTheme = (nextTheme: Theme) => {
		setTheme(nextTheme)
		document.documentElement.setAttribute('data-theme', nextTheme)
		document.documentElement.classList.toggle('dark', nextTheme === 'dark')
		window.localStorage.setItem('theme', nextTheme)
	}

	const handleToggle = () => {
		updateTheme(theme === 'dark' ? 'light' : 'dark')
	}

	const title =
		theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

	return (
		<button
			type='button'
			onClick={handleToggle}
			className='group relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/20 bg-white/70 text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200'
			aria-label='Toggle theme'
			title={title}
		>
			<span className='absolute inset-0 rounded-lg bg-linear-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-slate-700/40' />
			{mounted ? (
				theme === 'dark' ? (
					<Sun className='relative h-4 w-4' />
				) : (
					<Moon className='relative h-4 w-4' />
				)
			) : (
				<span className='relative h-4 w-4' />
			)}
		</button>
	)
}

export default ThemeToggle
