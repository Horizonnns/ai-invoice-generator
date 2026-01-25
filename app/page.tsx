'use client'

import InvoiceForm from '@/components/InvoiceForm'
import InvoicePreview, {
	type InvoicePreviewRef
} from '@/components/InvoicePreview'
import MagicFill from '@/components/MagicFill'
import type { InvoiceData, ParsedInvoiceResponse } from '@/types/invoice'
import {
	calculateItemAmount,
	createEmptyItem,
	generateInvoiceNumber,
	getDefaultDueDate,
	getTodayDate
} from '@/utils/helpers'
import { FileText } from 'lucide-react'
import { useRef, useState } from 'react'

const initialInvoiceData: InvoiceData = {
	invoiceNumber: generateInvoiceNumber(),
	issueDate: getTodayDate(),
	dueDate: getDefaultDueDate(),
	sender: {
		name: '',
		email: '',
		address: '',
		phone: ''
	},
	recipient: {
		name: '',
		email: '',
		address: '',
		phone: ''
	},
	items: [createEmptyItem()],
	notes: '',
	tax: 0
}

export default function HomePage() {
	const [invoiceData, setInvoiceData] =
		useState<InvoiceData>(initialInvoiceData)
	const [isDownloading, setIsDownloading] = useState(false)
	const previewRef = useRef<InvoicePreviewRef>(null)

	const handleDownload = async () => {
		if (!previewRef.current) return
		setIsDownloading(true)
		try {
			await previewRef.current.downloadPDF()
		} finally {
			setIsDownloading(false)
		}
	}

	const handleMagicFill = (parsedData: ParsedInvoiceResponse) => {
		const updatedData = { ...invoiceData }

		if (parsedData.sender) {
			updatedData.sender = {
				...invoiceData.sender,
				...parsedData.sender
			}
		}

		if (parsedData.recipient) {
			updatedData.recipient = {
				...invoiceData.recipient,
				...parsedData.recipient
			}
		}

		if (parsedData.items && parsedData.items.length > 0) {
			updatedData.items = parsedData.items.map(item => ({
				id: Math.random().toString(36).substring(2, 11),
				description: item.description,
				quantity: item.quantity,
				rate: item.rate,
				amount: calculateItemAmount(item.quantity, item.rate)
			}))
		}

		if (parsedData.issueDate) {
			updatedData.issueDate = parsedData.issueDate
		}

		if (parsedData.dueDate) {
			updatedData.dueDate = parsedData.dueDate
		}

		if (parsedData.notes) {
			updatedData.notes = parsedData.notes
		}

		setInvoiceData(updatedData)
	}

	return (
		<div className='min-h-screen'>
			{/* Header */}
			<header className='sticky top-0 z-40 glass border-b border-gray-200/50'>
				<div className='mx-auto px-4 sm:px-6'>
					<div className='flex items-center justify-between h-14'>
						<div className='flex items-center gap-2.5'>
							<div className='p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md shadow-indigo-500/25'>
								<FileText className='w-5 h-5 text-white' />
							</div>
							<div>
								<h1 className='text-lg font-bold text-gray-900'>
									AI Invoice Generator
								</h1>
								<p className='text-[11px] text-gray-500 -mt-0.5'>
									Create professional invoices instantly
								</p>
							</div>
						</div>
						<MagicFill onFill={handleMagicFill} />
					</div>
				</div>
			</header>

			{/* Main Content - Balanced columns */}
			<main className='mx-auto px-4 sm:px-6 py-4'>
				<div className='flex flex-col lg:flex-row gap-6'>
					{/* Left Column - Form */}
					<div className='lg:w-1/2 lg:shrink-0'>
						<InvoiceForm
							data={invoiceData}
							onChange={setInvoiceData}
						/>
					</div>

					{/* Right Column - Preview */}
					<div className='w-full sticky top-20'>
						<InvoicePreview
							ref={previewRef}
							data={invoiceData}
							isDownloading={isDownloading}
							onDownload={handleDownload}
						/>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className='py-5 mt-6 border-t border-gray-200 bg-white/50'>
				<div className='mx-auto px-4 sm:px-6'>
					<div className='flex flex-col md:flex-row items-center justify-between gap-3'>
						<div className='flex items-center gap-2 text-gray-500 text-xs'>
							<FileText className='w-3.5 h-3.5' />
							<span>AI Invoice Generator</span>
						</div>

						<p className='text-gray-400 text-xs'>
							© {new Date().getFullYear()} All rights reserved
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
