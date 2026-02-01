'use client'

import type { InvoiceRecord } from '@/types/invoice'
import { Clock, Download, Eye, Trash2 } from 'lucide-react'

type InvoiceHistoryProps = {
	invoices: InvoiceRecord[]
	onLoad: (invoice: InvoiceRecord) => void
	onDelete: (id: string) => void
	onPreview: (invoice: InvoiceRecord) => void
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
	onDelete,
	onPreview
}: InvoiceHistoryProps) {
	if (invoices.length === 0) {
		return (
			<div className='card p-8 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 min-h-[200px]'>
				<div className='w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3'>
					<Clock className='w-6 h-6 text-slate-400' />
				</div>
				<p className='text-sm font-medium'>No drafts or invoices yet.</p>
				<p className='text-xs mt-1 opacity-70'>
					Create your first invoice to see it here.
				</p>
			</div>
		)
	}

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
			{invoices.map(invoice => (
				<div
					key={invoice.id}
					className='card p-5 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors'
				>
					<div className='space-y-4'>
						<div className='flex items-start justify-between gap-2'>
							<div className='min-w-0'>
								<div className='font-bold text-lg text-slate-900 dark:text-slate-100 font-display truncate'>
									{invoice.data.invoiceNumber || 'Untitled'}
								</div>
								<div className='text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2'>
									<Clock className='w-3 h-3' />
									{formatDate(invoice.updatedAt)}
								</div>
							</div>
							<span
								className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
									invoice.status === 'draft'
										? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
										: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
								}`}
							>
								{invoice.status === 'draft' ? 'Draft' : 'Final'}
							</span>
						</div>
					</div>

					<div className='pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2'>
						<button
							onClick={() => onLoad(invoice)}
							className='flex-1 flex justify-center items-center gap-2 text-xs h-9 rounded-lg bg-linear-to-br from-slate-900 via-slate-800 to-brass text-white shadow-md shadow-slate-900/20 hover:shadow-lg hover:shadow-slate-900/30 active:scale-[0.98] transition-all font-medium'
						>
							<Download className='w-3.5 h-3.5' />
							Load
						</button>

						<button
							onClick={() => onPreview(invoice)}
							className='h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all'
							title='Quick Preview'
						>
							<Eye className='w-4 h-4' />
						</button>

						<button
							onClick={() => onDelete(invoice.id)}
							className='h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20 transition-all'
							title='Delete draft'
						>
							<Trash2 className='w-4 h-4' />
						</button>
					</div>
				</div>
			))}
		</div>
	)
}
