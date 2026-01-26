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

const previewColors = {
	ink: '#0b1b2b',
	inkSoft: '#1f2937',
	muted: '#6b7280',
	line: '#e2e8f0',
	surface: '#f8f4ee',
	accent: '#b08968',
	accentDark: '#8f6b4f',
	accentSoft: '#f3ece4',
	noteBg: '#fff3e2',
	noteBorder: '#f2d4b0',
	noteText: '#a16207'
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
			<div className='bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-black/40 overflow-hidden border border-slate-200/70 dark:border-slate-800/80 relative'>
				{/* Download PDF Button - Top Right Corner */}
				<button
					onClick={onDownload}
					disabled={isDownloading}
					style={{
						position: 'absolute',
						top: '12px',
						right: '12px',
						padding: '8px 14px',
						background:
							'linear-gradient(135deg, #0b1b2b 0%, #1e3550 55%, #b08968 100%)',
						borderRadius: '10px',
						color: '#ffffff',
						fontWeight: '500',
						fontSize: '13px',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
						boxShadow: '0 10px 20px rgba(11, 27, 43, 0.25)',
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
						color: previewColors.inkSoft,
						fontFamily:
							'Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif'
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
								background: 'linear-gradient(135deg, #0b1b2b 0%, #1f3a5a 100%)',
								borderRadius: '10px'
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
									color: previewColors.ink,
									margin: 0
								}}
							>
								INVOICE
							</h1>
							<p
								style={{
									fontSize: '12px',
									color: previewColors.muted,
									margin: 0
								}}
							>
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
									color: previewColors.muted,
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
									color: previewColors.ink,
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
									color: previewColors.muted,
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.sender.email}
							</p>
							<p
								style={{
									fontSize: '12px',
									color: previewColors.muted,
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.sender.address}
							</p>
							{data.sender.phone && (
								<p
									style={{
										fontSize: '12px',
										color: previewColors.muted,
										margin: 0
									}}
								>
									{data.sender.phone}
								</p>
							)}
						</div>
						<div>
							<p
								style={{
									fontSize: '10px',
									fontWeight: '600',
									color: previewColors.muted,
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
									color: previewColors.ink,
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
									color: previewColors.muted,
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.recipient.email}
							</p>
							<p
								style={{
									fontSize: '12px',
									color: previewColors.muted,
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.recipient.address}
							</p>
							{data.recipient.phone && (
								<p
									style={{
										fontSize: '12px',
										color: previewColors.muted,
										margin: 0
									}}
								>
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
							backgroundColor: previewColors.surface,
							borderRadius: '10px',
							border: `1px solid ${previewColors.line}`
						}}
					>
						<div>
							<p
								style={{
									fontSize: '10px',
									fontWeight: '600',
									color: previewColors.muted,
									textTransform: 'uppercase',
									margin: '0 0 2px 0'
								}}
							>
								Issue Date
							</p>
							<p
								style={{
									fontWeight: '500',
									color: previewColors.ink,
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
									color: previewColors.muted,
									textTransform: 'uppercase',
									margin: '0 0 2px 0'
								}}
							>
								Due Date
							</p>
							<p
								style={{
									fontWeight: '500',
									color: previewColors.ink,
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
											color: previewColors.muted,
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
											color: previewColors.muted,
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
											color: previewColors.muted,
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
											color: previewColors.muted,
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
												color: previewColors.ink,
												wordBreak: 'break-word'
											}}
										>
											{item.description || '-'}
										</td>
										<td
											style={{
												padding: '10px 0',
												textAlign: 'center',
												color: previewColors.muted
											}}
										>
											{item.quantity ?? 0}
										</td>
										<td
											style={{
												padding: '10px 0',
												textAlign: 'right',
												color: previewColors.muted
											}}
										>
											{formatCurrency(item.rate ?? 0)}
										</td>
										<td
											style={{
												padding: '10px 0',
												textAlign: 'right',
												fontWeight: '500',
												color: previewColors.ink
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
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							gap: '16px',
							marginBottom: '16px'
						}}
					>
						<div style={{ flex: 1 }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									padding: '8px 0',
									borderBottom: '1px solid #f3f4f6',
									fontSize: '12px'
								}}
							>
								<span style={{ color: previewColors.muted }}>Subtotal</span>
								<span style={{ fontWeight: '500', color: previewColors.ink }}>
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
									<span style={{ color: previewColors.muted }}>
										Tax ({data.tax}%)
									</span>
									<span style={{ fontWeight: '500', color: previewColors.ink }}>
										{formatCurrency(taxAmount)}
									</span>
								</div>
							)}
						</div>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								alignSelf: 'flex-end',
								minWidth: '200px',
								padding: '6px 12px',
								borderRadius: '10px',
								color: '#ffffff',
								background: `linear-gradient(90deg, ${previewColors.ink} 0%, ${previewColors.accentDark} 100%)`
							}}
						>
							<span style={{ fontWeight: '600', fontSize: '14px' }}>Total</span>
							<span style={{ fontWeight: 'bold', fontSize: '14px' }}>
								{formatCurrency(total)}
							</span>
						</div>
					</div>

					{/* Notes */}
					{data.notes && (
						<div
							style={{
								padding: '12px 16px',
								backgroundColor: previewColors.noteBg,
								border: `1px solid ${previewColors.noteBorder}`,
								borderRadius: '10px',
								marginBottom: '16px'
							}}
						>
							<p
								style={{
									fontSize: '10px',
									fontWeight: '600',
									color: previewColors.noteText,
									textTransform: 'uppercase',
									margin: '0 0 4px 0'
								}}
							>
								Notes
							</p>
							<p
								style={{
									fontSize: '12px',
									color: previewColors.inkSoft,
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
						<p
							style={{
								fontSize: '12px',
								color: previewColors.muted,
								margin: 0
							}}
						>
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
