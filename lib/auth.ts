import { cookies } from 'next/headers'
import { prisma } from './prisma'

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 7)

export async function getSessionUser() {
	const cookieStore = await cookies()
	const token = cookieStore.get('session')?.value

	if (!token) return null

	const session = await prisma.session.findUnique({
		where: { token },
		include: { user: true }
	})

	// If session not found or expired
	if (!session) return null

	if (session.expiresAt < new Date()) {
		// Cleanup expired session
		await prisma.session.delete({ where: { token } })
		return null
	}

	return session.user
}

export async function createSession(userId: string) {
	const token = crypto.randomUUID()
	const ttlMs = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
	const expiresAt = new Date(Date.now() + ttlMs)

	await prisma.session.create({
		data: {
			token,
			userId,
			expiresAt
		}
	})

	const cookieStore = await cookies()
	cookieStore.set('session', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: Math.floor(ttlMs / 1000),
		path: '/'
	})

	return token
}

export async function clearSession() {
	const cookieStore = await cookies()
	const token = cookieStore.get('session')?.value

	if (token) {
		try {
			await prisma.session.delete({ where: { token } })
		} catch {
			// Ignore if session already deleted
		}
	}

	cookieStore.delete('session')
}
