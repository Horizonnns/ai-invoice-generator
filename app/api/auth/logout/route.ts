import { clearSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST() {
	try {
		await clearSession()
		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error('Logout error:', error)
		return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
	}
}
