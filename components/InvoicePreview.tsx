'use client'

import type { InvoiceData } from '@/types/invoice'
import {
	calculateSubtotal,
	calculateTax,
	calculateTotal,
	formatCurrency,
	formatDate
} from '@/utils/helpers'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Download, FileText, Loader2 } from 'lucide-react'
import { forwardRef, useImperativeHandle, useRef } from 'react'

interface InvoicePreviewProps {
	data: InvoiceData
	isDownloading?: boolean
	onDownload?: () => void
}

export interface InvoicePreviewRef {
	downloadPDF: () => Promise<void>
}

// Helper to convert oklch colors to rgb
const convertOklchToRgb = (element: HTMLElement) => {
	const computed = window.getComputedStyle(element)
	const properties = ['color', 'background-color', 'border-color', 'background']

	properties.forEach(prop => {
		const value = computed.getPropertyValue(prop)
		if (value && value.includes('oklch')) {
			const canvas = document.createElement('canvas')
			canvas.width = 1
			canvas.height = 1
			const ctx = canvas.getContext('2d')
			if (ctx) {
				ctx.fillStyle = value
				const rgb = ctx.fillStyle
				element.style.setProperty(prop, rgb, 'important')
			}
		}
	})

	Array.from(element.children).forEach(child => {
		if (child instanceof HTMLElement) {
			convertOklchToRgb(child)
		}
	})
}

const InvoicePreview = forwardRef<InvoicePreviewRef, InvoicePreviewProps>(
	({ data, isDownloading, onDownload }, ref) => {
		const invoiceRef = useRef<HTMLDivElement>(null)

		const subtotal = calculateSubtotal(data.items)
		const taxAmount = calculateTax(subtotal, data.tax || 0)
		const total = calculateTotal(subtotal, taxAmount)

		const handleDownloadPDF = async () => {
			if (!invoiceRef.current) return

			try {
				const canvas = await html2canvas(invoiceRef.current, {
					scale: 2,
					useCORS: true,
					logging: false,
					backgroundColor: '#ffffff',
					onclone: (_clonedDoc, element) => {
						convertOklchToRgb(element)
					}
				})

				const imgData = canvas.toDataURL('image/png')
				const pdf = new jsPDF({
					orientation: 'portrait',
					unit: 'mm',
					format: 'a4'
				})

				const pdfWidth = pdf.internal.pageSize.getWidth()
				const imgWidth = canvas.width
				const imgHeight = canvas.height
				const ratio = pdfWidth / imgWidth
				const scaledHeight = imgHeight * ratio

				pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight)
				pdf.save(`${data.invoiceNumber || 'invoice'}.pdf`)
			} catch (error) {
				console.error('Error generating PDF:', error)
			}
		}

		useImperativeHandle(ref, () => ({
			downloadPDF: handleDownloadPDF
		}))

		return (
			<div className='bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 relative'>
				{/* Download PDF Button - Top Right Corner */}
				<button
					onClick={onDownload}
					disabled={isDownloading}
					style={{
						position: 'absolute',
						top: '12px',
						right: '12px',
						padding: '8px 14px',
						background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
						borderRadius: '8px',
						color: '#ffffff',
						fontWeight: '500',
						fontSize: '13px',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
						boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
						zIndex: 10,
						opacity: isDownloading ? 0.6 : 1
					}}
				>
					{isDownloading ? (
						<>
							<Loader2
								style={{
									width: '14px',
									height: '14px',
									animation: 'spin 1s linear infinite'
								}}
							/>
							Generating...
						</>
					) : (
						<>
							<Download style={{ width: '14px', height: '14px' }} />
							Download PDF
						</>
					)}
				</button>

				<div
					ref={invoiceRef}
					style={{
						padding: '24px',
						backgroundColor: '#ffffff',
						color: '#1e293b',
						fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
					}}
				>
					{/* Header */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '10px',
							marginBottom: '20px'
						}}
					>
						<div
							style={{
								padding: '8px',
								background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
								borderRadius: '8px'
							}}
						>
							<FileText
								style={{ width: '20px', height: '20px', color: '#ffffff' }}
							/>
						</div>
						<div>
							<h1
								style={{
									fontSize: '20px',
									fontWeight: 'bold',
									color: '#111827',
									margin: 0
								}}
							>
								INVOICE
							</h1>
							<p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
								{data.invoiceNumber}
							</p>
						</div>
					</div>

					{/* Parties */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '16px',
							marginBottom: '20px'
						}}
					>
						<div>
							<p
								style={{
									fontSize: '10px',
									fontWeight: '600',
									color: '#9ca3af',
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									marginBottom: '4px'
								}}
							>
								From
							</p>
							<p
								style={{
									fontWeight: '600',
									color: '#111827',
									fontSize: '14px',
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.sender.name || 'Your Business'}
							</p>
							<p
								style={{
									fontSize: '12px',
									color: '#6b7280',
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.sender.email}
							</p>
							<p
								style={{
									fontSize: '12px',
									color: '#6b7280',
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.sender.address}
							</p>
							{data.sender.phone && (
								<p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
									{data.sender.phone}
								</p>
							)}
						</div>
						<div>
							<p
								style={{
									fontSize: '10px',
									fontWeight: '600',
									color: '#9ca3af',
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									marginBottom: '4px'
								}}
							>
								Bill To
							</p>
							<p
								style={{
									fontWeight: '600',
									color: '#111827',
									fontSize: '14px',
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.recipient.name || 'Client Name'}
							</p>
							<p
								style={{
									fontSize: '12px',
									color: '#6b7280',
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.recipient.email}
							</p>
							<p
								style={{
									fontSize: '12px',
									color: '#6b7280',
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.recipient.address}
							</p>
							{data.recipient.phone && (
								<p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
									{data.recipient.phone}
								</p>
							)}
						</div>
					</div>

					{/* Dates */}
					<div
						style={{
							display: 'flex',
							gap: '32px',
							marginBottom: '20px',
							padding: '12px 16px',
							backgroundColor: '#f9fafb',
							borderRadius: '8px'
						}}
					>
						<div>
							<p
								style={{
									fontSize: '10px',
									fontWeight: '600',
									color: '#9ca3af',
									textTransform: 'uppercase',
									margin: '0 0 2px 0'
								}}
							>
								Issue Date
							</p>
							<p
								style={{
									fontWeight: '500',
									color: '#111827',
									fontSize: '14px',
									margin: 0
								}}
							>
								{data.issueDate ? formatDate(data.issueDate) : '-'}
							</p>
						</div>
						<div>
							<p
								style={{
									fontSize: '10px',
									fontWeight: '600',
									color: '#9ca3af',
									textTransform: 'uppercase',
									margin: '0 0 2px 0'
								}}
							>
								Due Date
							</p>
							<p
								style={{
									fontWeight: '500',
									color: '#111827',
									fontSize: '14px',
									margin: 0
								}}
							>
								{data.dueDate ? formatDate(data.dueDate) : '-'}
							</p>
						</div>
					</div>

					{/* Items Table */}
					<div style={{ marginBottom: '20px' }}>
						<table
							style={{
								width: '100%',
								fontSize: '12px',
								borderCollapse: 'collapse'
							}}
						>
							<thead>
								<tr style={{ borderBottom: '2px solid #e5e7eb' }}>
									<th
										style={{
											textAlign: 'left',
											padding: '8px 0',
											fontSize: '10px',
											fontWeight: '600',
											color: '#6b7280',
											textTransform: 'uppercase'
										}}
									>
										Description
									</th>
									<th
										style={{
											textAlign: 'center',
											padding: '8px 0',
											width: '60px',
											fontSize: '10px',
											fontWeight: '600',
											color: '#6b7280',
											textTransform: 'uppercase'
										}}
									>
										Qty
									</th>
									<th
										style={{
											textAlign: 'right',
											padding: '8px 0',
											width: '80px',
											fontSize: '10px',
											fontWeight: '600',
											color: '#6b7280',
											textTransform: 'uppercase'
										}}
									>
										Rate
									</th>
									<th
										style={{
											textAlign: 'right',
											padding: '8px 0',
											width: '90px',
											fontSize: '10px',
											fontWeight: '600',
											color: '#6b7280',
											textTransform: 'uppercase'
										}}
									>
										Amount
									</th>
								</tr>
							</thead>
							<tbody>
								{data.items.map((item, index) => (
									<tr
										key={item.id}
										style={{
											backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff'
										}}
									>
										<td
											style={{
												padding: '10px 8px 10px 0',
												color: '#111827',
												wordBreak: 'break-word'
											}}
										>
											{item.description || '-'}
										</td>
										<td
											style={{
												padding: '10px 0',
												textAlign: 'center',
												color: '#6b7280'
											}}
										>
											{item.quantity ?? 0}
										</td>
										<td
											style={{
												padding: '10px 0',
												textAlign: 'right',
												color: '#6b7280'
											}}
										>
											{formatCurrency(item.rate ?? 0)}
										</td>
										<td
											style={{
												padding: '10px 0',
												textAlign: 'right',
												fontWeight: '500',
												color: '#111827'
											}}
										>
											{formatCurrency(item.amount)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Totals */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							marginBottom: '16px'
						}}
					>
						<div style={{ width: '200px' }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									padding: '8px 0',
									borderBottom: '1px solid #f3f4f6',
									fontSize: '12px'
								}}
							>
								<span style={{ color: '#6b7280' }}>Subtotal</span>
								<span style={{ fontWeight: '500', color: '#111827' }}>
									{formatCurrency(subtotal)}
								</span>
							</div>
							{(data.tax || 0) > 0 && (
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										padding: '8px 0',
										borderBottom: '1px solid #f3f4f6',
										fontSize: '12px'
									}}
								>
									<span style={{ color: '#6b7280' }}>Tax ({data.tax}%)</span>
									<span style={{ fontWeight: '500', color: '#111827' }}>
										{formatCurrency(taxAmount)}
									</span>
								</div>
							)}
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '10px 14px',
									background:
										'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
									borderRadius: '8px',
									marginTop: '8px',
									color: '#ffffff'
								}}
							>
								<span style={{ fontWeight: '600', fontSize: '14px' }}>
									Total
								</span>
								<span style={{ fontWeight: 'bold', fontSize: '14px' }}>
									{formatCurrency(total)}
								</span>
							</div>
						</div>
					</div>

					{/* Notes */}
					{data.notes && (
						<div
							style={{
								padding: '12px 16px',
								backgroundColor: '#fef3c7',
								border: '1px solid #fde68a',
								borderRadius: '8px',
								marginBottom: '16px'
							}}
						>
							<p
								style={{
									fontSize: '10px',
									fontWeight: '600',
									color: '#b45309',
									textTransform: 'uppercase',
									margin: '0 0 4px 0'
								}}
							>
								Notes
							</p>
							<p
								style={{
									fontSize: '12px',
									color: '#374151',
									margin: 0,
									wordBreak: 'break-word'
								}}
							>
								{data.notes}
							</p>
						</div>
					)}

					{/* Footer */}
					<div
						style={{
							paddingTop: '12px',
							borderTop: '1px solid #f3f4f6',
							textAlign: 'center'
						}}
					>
						<p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
							Thank you for your business!
						</p>
					</div>
				</div>
			</div>
		)
	}
)

InvoicePreview.displayName = 'InvoicePreview'

export default InvoicePreview
