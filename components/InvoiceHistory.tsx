'use client'

import type { InvoiceRecord } from '@/types/invoice'
import { Clock, Download, Trash2 } from 'lucide-react'

type InvoiceHistoryProps = {
	invoices: InvoiceRecord[]
	onLoad: (invoice: InvoiceRecord) => void
	onDelete: (id: string) => void
}

const formatDate = (value: number) =>
	new Date(value).toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})

export default function InvoiceHistory({
	invoices,
	onLoad,
	onDelete
}: InvoiceHistoryProps) {
	if (invoices.length === 0) {
		return (
			<div className='card p-4 text-xs text-gray-500 dark:text-slate-400'>2
				No drafts or invoices yet.
			</div>
		)
	}

	return (
		<div className='card p-4 space-y-3'>
			<div className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-200'>
				<Clock className='w-3.5 h-3.5' />
				<span>History</span>
			</div>
			<div className='space-y-2'>
				{invoices.map(invoice => (
					<div
						key={invoice.id}
						className='flex items-center justify-between gap-3 text-xs text-gray-600 dark:text-slate-300'
					>
						<div className='space-y-0.5'>
							<div className='font-medium text-gray-800 dark:text-slate-100'>
								{invoice.data.invoiceNumber || 'Untitled invoice'}
							</div>
							<div className='text-[11px] text-gray-500 dark:text-slate-400'>
								{invoice.status === 'draft' ? 'Draft' : 'Final'} ·{' '}
								{formatDate(invoice.updatedAt)}
							</div>
						</div>
						<div className='flex items-center gap-1.5'>
							<button
								onClick={() => onLoad(invoice)}
								className='btn-secondary flex items-center gap-1 text-[11px]'
							>
								<Download className='w-3.5 h-3.5' />
								Load
							</button>
							<button
								onClick={() => onDelete(invoice.id)}
								className='btn-secondary flex items-center gap-1 text-[11px]'
							>
								<Trash2 className='w-3.5 h-3.5' />
								Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
