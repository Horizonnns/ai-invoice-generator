'use client'

import type { InvoiceItem } from '@/types/invoice'
import { calculateItemAmount, createEmptyItem } from '@/utils/helpers'
import { Plus, Trash2 } from 'lucide-react'
import React from 'react'

interface InvoiceItemsProps {
	items: InvoiceItem[]
	onChange: (items: InvoiceItem[]) => void
}

const InvoiceItems: React.FC<InvoiceItemsProps> = ({ items, onChange }) => {
	const handleAddItem = () => {
		onChange([...items, createEmptyItem()])
	}

	const handleRemoveItem = (id: string) => {
		if (items.length > 1) {
			onChange(items.filter(item => item.id !== id))
		}
	}

	const handleItemChange = (
		id: string,
		field: keyof InvoiceItem,
		value: string | number | undefined
	) => {
		onChange(
			items.map(item => {
				if (item.id !== id) return item

				const updatedItem = { ...item, [field]: value }

				// Auto-calculate amount when quantity or rate changes
				if (field === 'quantity' || field === 'rate') {
					const newVal =
						value === '' ? undefined : (value as number | undefined)
					const q =
						field === 'quantity'
							? newVal
							: (item.quantity as number | undefined)
					const r =
						field === 'rate' ? newVal : (item.rate as number | undefined)
					updatedItem.amount = calculateItemAmount(q, r)
				}

				return updatedItem
			})
		)
	}

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between'>
				<label className='block text-sm font-semibold text-gray-700 dark:text-slate-200'>
					Invoice Items
				</label>
				<button
					onClick={handleAddItem}
					className='flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200 transition-colors'
				>
					<Plus className='w-3.5 h-3.5' />
					Add Item
				</button>
			</div>

			<div className='space-y-2'>
				{/* Header */}
				<div className='grid grid-cols-12 gap-2 text-[10px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider px-1'>
					<div className='col-span-5'>Description</div>
					<div className='col-span-2 text-center'>Qty</div>
					<div className='col-span-2 text-center'>Rate</div>
					<div className='col-span-2 text-right'>Amount</div>
					<div className='col-span-1'></div>
				</div>

				{/* Items */}
				{items.map((item, index) => (
					<div
						key={item.id}
						className='grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 dark:bg-slate-800/40 rounded-lg border border-gray-100 dark:border-slate-700/70 hover:border-gray-200 dark:hover:border-slate-600/70 transition-all animate-fade-in'
						style={{ animationDelay: `${index * 40}ms` }}
					>
						<div className='col-span-5'>
							<input
								type='text'
								onChange={e =>
									handleItemChange(item.id, 'description', e.target.value)
								}
								value={item.description}
								placeholder='Service description'
								className='input-field'
							/>
						</div>
						<div className='col-span-2'>
							<input
								type='number'
								min='1'
								value={item.quantity ?? ''}
								onChange={e =>
									handleItemChange(
										item.id,
										'quantity',
										e.target.value === ''
											? undefined
											: parseFloat(e.target.value)
									)
								}
								className='input-field text-center'
							/>
						</div>
						<div className='col-span-2'>
							<div className='relative'>
								<span className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs'>
									$
								</span>
								<input
									type='number'
									min='0'
									step='0.01'
									value={item.rate ?? ''}
									onChange={e =>
										handleItemChange(
											item.id,
											'rate',
											e.target.value === ''
												? undefined
												: parseFloat(e.target.value)
										)
									}
									className='input-field pl-5 text-center'
								/>
							</div>
						</div>
						<div className='col-span-2 text-right font-semibold text-gray-800 dark:text-slate-100 text-sm'>
							${item.amount.toFixed(2)}
						</div>
						<div className='col-span-1 flex justify-center'>
							<button
								onClick={() => handleRemoveItem(item.id)}
								disabled={items.length <= 1}
								className='p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed'
							>
								<Trash2 className='w-3.5 h-3.5' />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default InvoiceItems
