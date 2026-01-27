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
			<div className='card p-4 text-xs text-slate-500 dark:text-slate-400'>
				No drafts or invoices yet.
			</div>
		)
	}

	return (
		<div className='card p-4 space-y-3'>
			<div className='flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]'>
				<Clock className='w-3.5 h-3.5' />
				<span>History</span>
			</div>
			<div className='space-y-2'>
				{invoices.map(invoice => (
					<div
						key={invoice.id}
						className='flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-3 text-xs text-slate-600 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between'
					>
						<div className='space-y-0.5'>
							<div className='font-semibold text-slate-800 dark:text-slate-100 font-display'>
								{invoice.data.invoiceNumber || 'Untitled invoice'}
							</div>
							<div className='text-[11px] text-slate-500 dark:text-slate-400'>
								<span className='inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-700/60 dark:text-slate-200'>
									{invoice.status === 'draft' ? 'Draft' : 'Final'}
								</span>
								<span className='mx-2 text-slate-300 dark:text-slate-600'>•</span>
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
