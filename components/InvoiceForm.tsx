'use client'

import { Building2, FileText, MessageSquare, User } from 'lucide-react'
import React from 'react'
import type { InvoiceData, PartyInfo } from '../types/invoice'
import DatePicker from './DatePicker'
import InvoiceItems from './InvoiceItems'

interface InvoiceFormProps {
	data: InvoiceData
	onChange: (data: InvoiceData) => void
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ data, onChange }) => {
	const handleSenderChange = (field: keyof PartyInfo, value: string) => {
		onChange({
			...data,
			sender: { ...data.sender, [field]: value }
		})
	}

	const handleRecipientChange = (field: keyof PartyInfo, value: string) => {
		onChange({
			...data,
			recipient: { ...data.recipient, [field]: value }
		})
	}

	return (
		<div className='space-y-4'>
			{/* Invoice Details */}
			<div className='card p-4'>
				<div className='flex items-center gap-2 mb-3'>
					<FileText className='w-4 h-4 text-indigo-600' />
					<h3 className='font-semibold text-gray-800 text-sm'>
						Invoice Details
					</h3>
				</div>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
					<div>
						<label className='block text-xs font-medium text-gray-600 mb-1'>
							Invoice Number
						</label>
						<input
							type='text'
							value={data.invoiceNumber}
							onChange={e =>
								onChange({ ...data, invoiceNumber: e.target.value })
							}
							className='input-field'
						/>
					</div>
					<DatePicker
						value={data.issueDate}
						onChange={(value: string) =>
							onChange({ ...data, issueDate: value })
						}
						label='Issue Date'
						placeholder='Select issue date'
					/>
					<DatePicker
						value={data.dueDate}
						onChange={(value: string) => onChange({ ...data, dueDate: value })}
						label='Due Date'
						placeholder='Select due date'
					/>
				</div>
			</div>

			{/* Sender & Recipient */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
				{/* From */}
				<div className='card p-4'>
					<div className='flex items-center gap-2 mb-3'>
						<div className='p-1.5 bg-indigo-100 rounded-md'>
							<User className='w-4 h-4 text-indigo-600' />
						</div>
						<div>
							<h3 className='font-semibold text-gray-800 text-sm'>From</h3>
							<p className='text-[11px] text-gray-500'>Your business info</p>
						</div>
					</div>
					<div className='space-y-2.5'>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Business Name
							</label>
							<input
								type='text'
								value={data.sender.name}
								onChange={e => handleSenderChange('name', e.target.value)}
								placeholder='Your Company Name'
								className='input-field'
							/>
						</div>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Email
							</label>
							<input
								type='email'
								value={data.sender.email}
								onChange={e => handleSenderChange('email', e.target.value)}
								placeholder='you@company.com'
								className='input-field'
							/>
						</div>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Address
							</label>
							<input
								type='text'
								value={data.sender.address}
								onChange={e => handleSenderChange('address', e.target.value)}
								placeholder='Street, City, Country'
								className='input-field'
							/>
						</div>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Phone
							</label>
							<input
								type='tel'
								value={data.sender.phone || ''}
								onChange={e => handleSenderChange('phone', e.target.value)}
								placeholder='+1 (555) 000-0000'
								className='input-field'
							/>
						</div>
					</div>
				</div>

				{/* To */}
				<div className='card p-4'>
					<div className='flex items-center gap-2 mb-3'>
						<div className='p-1.5 bg-emerald-100 rounded-md'>
							<Building2 className='w-4 h-4 text-emerald-600' />
						</div>
						<div>
							<h3 className='font-semibold text-gray-800 text-sm'>Bill To</h3>
							<p className='text-[11px] text-gray-500'>Client info</p>
						</div>
					</div>
					<div className='space-y-2.5'>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Client Name
							</label>
							<input
								type='text'
								value={data.recipient.name}
								onChange={e => handleRecipientChange('name', e.target.value)}
								placeholder='Client or Company Name'
								className='input-field'
							/>
						</div>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Email
							</label>
							<input
								type='email'
								value={data.recipient.email}
								onChange={e => handleRecipientChange('email', e.target.value)}
								placeholder='client@company.com'
								className='input-field'
							/>
						</div>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Address
							</label>
							<input
								type='text'
								value={data.recipient.address}
								onChange={e => handleRecipientChange('address', e.target.value)}
								placeholder='Street, City, Country'
								className='input-field'
							/>
						</div>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Phone
							</label>
							<input
								type='tel'
								value={data.recipient.phone || ''}
								onChange={e => handleRecipientChange('phone', e.target.value)}
								placeholder='+1 (555) 000-0000'
								className='input-field'
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Invoice Items */}
			<div className='card p-4'>
				<InvoiceItems
					items={data.items}
					onChange={items => onChange({ ...data, items })}
				/>
			</div>

			{/* Notes & Tax */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
				<div className='card p-4'>
					<div className='flex items-center gap-2 mb-2'>
						<MessageSquare className='w-4 h-4 text-indigo-600' />
						<h3 className='font-semibold text-gray-800 text-sm'>Notes</h3>
					</div>
					<textarea
						value={data.notes || ''}
						onChange={e => onChange({ ...data, notes: e.target.value })}
						placeholder='Payment instructions or additional notes...'
						rows={2}
						className='input-field resize-none'
					/>
				</div>

				<div className='card p-4'>
					<div className='flex items-center gap-2 mb-2'>
						<h3 className='font-semibold text-gray-800 text-sm'>
							Tax Rate (%)
						</h3>
					</div>
					<input
						type='number'
						min='0'
						max='100'
						step='0.1'
						value={data.tax || 0}
						onChange={e =>
							onChange({ ...data, tax: parseFloat(e.target.value) || 0 })
						}
						placeholder='0'
						className='input-field'
					/>
				</div>
			</div>
		</div>
	)
}

export default InvoiceForm
