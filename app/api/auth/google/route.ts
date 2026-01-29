import { createSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export async function POST(req: Request) {
	try {
		const { credential } = await req.json()
		if (!credential || typeof credential !== 'string') {
			return NextResponse.json({ error: 'Missing credential' }, { status: 400 })
		}

		const tokenInfoRes = await fetch(
			`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
				credential
			)}`
		)
		if (!tokenInfoRes.ok) {
			return NextResponse.json(
				{ error: 'Invalid Google token' },
				{ status: 401 }
			)
		}
		const tokenInfo = await tokenInfoRes.json()

		if (GOOGLE_CLIENT_ID && tokenInfo.aud !== GOOGLE_CLIENT_ID) {
			return NextResponse.json(
				{ error: 'Invalid token audience' },
				{ status: 401 }
			)
		}
		// Google returns boolean or string "true" depending on endpoint/version sometimes
		if (
			tokenInfo.email_verified !== 'true' &&
			tokenInfo.email_verified !== true
		) {
			return NextResponse.json({ error: 'Email not verified' }, { status: 401 })
		}

		const userId = tokenInfo.sub
		const email = tokenInfo.email
		const name = tokenInfo.name
		const picture = tokenInfo.picture

		// Create or Update User
		const user = await prisma.user.upsert({
			where: { id: userId },
			update: { email, name, picture },
			create: { id: userId, email, name, picture }
		})

		await createSession(user.id)

		return NextResponse.json({ user })
	} catch (error) {
		console.error('Auth error:', error)
		return NextResponse.json(
			{ error: 'Authentication failed' },
			{ status: 500 }
		)
	}
}
