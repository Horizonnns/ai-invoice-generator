import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getSessionUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params
		const { status, data: invoiceData } = await req.json()
		const existing = await prisma.invoice.findUnique({ where: { id } })

		if (!existing || existing.userId !== user.id) {
			return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
		}

		const updated = await prisma.invoice.update({
			where: { id },
			data: {
				status:
					status === 'final' || status === 'draft' ? status : existing.status,
				data: invoiceData ?? existing.data
			}
		})

		return NextResponse.json({ invoice: updated })
	} catch (error) {
		console.error('Update invoice error:', error)
		return NextResponse.json(
			{ error: 'Failed to update invoice' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getSessionUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params
		const existing = await prisma.invoice.findUnique({ where: { id } })

		if (!existing || existing.userId !== user.id) {
			return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
		}

		await prisma.invoice.delete({ where: { id } })
		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error('Delete invoice error:', error)
		return NextResponse.json(
			{ error: 'Failed to delete invoice' },
			{ status: 500 }
		)
	}
}
