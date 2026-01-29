import { getSessionUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const user = await getSessionUser()
		return NextResponse.json({ user })
	} catch (error) {
		console.error('Auth check error:', error)
		return NextResponse.json(
			{ error: 'Failed to load session' },
			{ status: 500 }
		)
	}
}
