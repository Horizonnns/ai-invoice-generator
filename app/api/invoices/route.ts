import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const user = await getSessionUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const invoices = await prisma.invoice.findMany({
			where: { userId: user.id },
			orderBy: { updatedAt: 'desc' }
		})

		return NextResponse.json({ invoices })
	} catch (error) {
		console.error('List invoices error:', error)
		return NextResponse.json(
			{ error: 'Failed to list invoices' },
			{ status: 500 }
		)
	}
}

export async function POST(req: Request) {
	try {
		const user = await getSessionUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { status, data: invoiceData } = await req.json()
		if (!invoiceData) {
			return NextResponse.json(
				{ error: 'Missing invoice data' },
				{ status: 400 }
			)
		}

		const payloadStatus = status === 'final' ? 'final' : 'draft'

		const invoice = await prisma.invoice.create({
			data: {
				userId: user.id,
				status: payloadStatus,
				data: invoiceData
			}
		})

		return NextResponse.json({ invoice }, { status: 201 })
	} catch (error) {
		console.error('Create invoice error:', error)
		return NextResponse.json(
			{ error: 'Failed to save invoice' },
			{ status: 500 }
		)
	}
}
