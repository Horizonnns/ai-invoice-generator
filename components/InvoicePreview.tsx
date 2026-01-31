'use client'

import type { InvoiceData } from '@/types/invoice'
import {
	calculateSubtotal,
	calculateTax,
	calculateTotal,
	formatCurrency,
	formatDate
} from '@/utils/helpers'
import { FileText } from 'lucide-react'
import { forwardRef, useImperativeHandle, useRef } from 'react'

interface InvoicePreviewProps {
	data: InvoiceData
}

export interface InvoicePreviewRef {
	downloadPDF: () => Promise<void>
}

const previewColors = {
	ink: '#0b1b2b',
	inkSoft: '#1f2937',
	muted: '#6b7280',
	line: '#e9d7c2',
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
	({ data }, ref) => {
		const invoiceRef = useRef<HTMLDivElement>(null)

		const subtotal = calculateSubtotal(data.items)
		const taxAmount = calculateTax(subtotal, data.tax || 0)
		const total = calculateTotal(subtotal, taxAmount)

		const handleDownloadPDF = async () => {
			try {
				const { default: PDFDocument } =
					await import('pdfkit/js/pdfkit.standalone.js')
				const { default: blobStream } = await import('blob-stream')

				// Fetch Fonts from the local public directory
				// Note: Ensure you have placed these .ttf files in /public/fonts/
				const [regRes, boldRes] = await Promise.all([
					fetch('/fonts/space-grotesk-regular.ttf'),
					fetch('/fonts/space-grotesk-bold.ttf')
				])

				// Fallback to CDN if local fonts are missing
				if (!regRes.ok || !boldRes.ok) {
					console.warn('Local fonts not found, falling back to CDN...')
					const [fReg, fBold] = await Promise.all([
						fetch(
							'https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-400-normal.ttf'
						),
						fetch(
							'https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.ttf'
						)
					])

					const [regBuf, boldBuf] = await Promise.all([
						fReg.arrayBuffer(),
						fBold.arrayBuffer()
					])
					setupPDF(regBuf, boldBuf)
				} else {
					const [regBuf, boldBuf] = await Promise.all([
						regRes.arrayBuffer(),
						boldRes.arrayBuffer()
					])
					setupPDF(regBuf, boldBuf)
				}

				function setupPDF(regBuf: ArrayBuffer, boldBuf: ArrayBuffer) {
					const doc = new PDFDocument({
						margin: 40,
						size: 'A4',
						bufferPages: true
					})

					const stream = doc.pipe(blobStream())
					doc.registerFont('SpaceGrotesk', regBuf)
					doc.registerFont('SpaceGrotesk-Bold', boldBuf)

					const colors = {
						ink: '#0b1b2b',
						muted: '#6b7280',
						line: '#e5e7eb',
						white: '#ffffff',
						accentDark: '#332b26',
						tableLine: '#f9fafb'
					}

					const drawLine = (y: number, color = colors.line) => {
						doc
							.strokeColor(color)
							.lineWidth(0.5)
							.moveTo(40, y)
							.lineTo(555, y)
							.stroke()
					}

					// 1. Header
					const headerSize = 48
					const logoGrad = doc.linearGradient(
						40,
						40,
						40 + headerSize,
						40 + headerSize
					)
					logoGrad.stop(0, '#0b1b2b').stop(1, '#1f3a5a')

					doc.roundedRect(40, 40, headerSize, headerSize, 14).fill(logoGrad)

					// Larger Document Icon (Lucide FileText style)
					doc.save()
					doc.translate(52, 51)
					doc
						.lineWidth(2)
						.strokeColor(colors.white)
						.lineJoin('round')
						.lineCap('round')

					const w = 24
					const h = 28
					const f = 8

					doc
						.moveTo(0, 2)
						.quadraticCurveTo(0, 0, 2, 0)
						.lineTo(w - f, 0)
						.lineTo(w, f)
						.lineTo(w, h - 2)
						.quadraticCurveTo(w, h, w - 2, h)
						.lineTo(2, h)
						.quadraticCurveTo(0, h, 0, h - 2)
						.closePath()
						.stroke()

					doc
						.moveTo(w - f, 0)
						.lineTo(w - f, f)
						.lineTo(w, f)
						.stroke()

					doc.lineWidth(1.5)
					doc
						.moveTo(6, 12)
						.lineTo(w - 6, 12)
						.stroke()
					doc
						.moveTo(6, 17)
						.lineTo(w - 6, 17)
						.stroke()
					doc
						.moveTo(6, 22)
						.lineTo(w - 10, 22)
						.stroke()

					doc.restore()

					doc
						.fillColor(colors.ink)
						.fontSize(26)
						.font('SpaceGrotesk-Bold')
						.text('INVOICE', 100, 42)
					doc
						.fillColor(colors.muted)
						.fontSize(14)
						.font('SpaceGrotesk')
						.text(data.invoiceNumber || '-', 100, 70)

					// 2. Parties
					const partyY = 125
					doc
						.fillColor(colors.muted)
						.fontSize(12)
						.font('SpaceGrotesk-Bold')
						.text('FROM', 40, partyY)
						.text('BILL TO', 300, partyY)

					doc
						.fillColor(colors.ink)
						.font('SpaceGrotesk-Bold')
						.fontSize(20)
						.text(data.sender.name || 'Your Business', 40, partyY + 15)

					doc
						.fontSize(18)
						.text(data.recipient.name || 'Client Name', 300, partyY + 15)

					doc.fillColor(colors.muted).fontSize(14).font('SpaceGrotesk')

					let currentPartyY = partyY + 40
					doc.text(data.sender.email || '', 40, currentPartyY)
					doc.text(data.sender.address || '', 40, doc.y + 2, { width: 240 })
					if (data.sender.phone) doc.text(data.sender.phone, 40, doc.y + 2)

					currentPartyY = partyY + 40
					doc.text(data.recipient.email || '', 300, currentPartyY)
					doc.text(data.recipient.address || '', 300, doc.y + 2, { width: 240 })
					if (data.recipient.phone)
						doc.text(data.recipient.phone, 300, doc.y + 2)

					// 3. Issue & Due Date Box
					const datesY = Math.max(doc.y + 30, 240)
					doc
						.roundedRect(40, datesY, 515, 65, 12)
						.fillColor(previewColors.surface)
						.fillAndStroke(previewColors.surface, previewColors.line)

					doc
						.fillColor(colors.muted)
						.fontSize(12)
						.font('SpaceGrotesk-Bold')
						.text('ISSUE DATE', 60, datesY + 16)
						.text('DUE DATE', 250, datesY + 16)
					doc
						.fillColor(colors.ink)
						.fontSize(16)
						.font('SpaceGrotesk') // Using medium weight equivalent (Regular for now)
						.text(
							data.issueDate ? formatDate(data.issueDate) : '-',
							60,
							datesY + 32
						)
						.text(
							data.dueDate ? formatDate(data.dueDate) : '-',
							250,
							datesY + 32
						)

					// 4. Table
					const tableY = datesY + 110
					doc
						.fillColor(colors.muted)
						.fontSize(12)
						.font('SpaceGrotesk-Bold')
						.text('DESCRIPTION', 52, tableY) // Left padding 12px
						.text('QTY', 330, tableY, { width: 40, align: 'center' })
						.text('RATE', 410, tableY, { width: 60, align: 'right' })
						.text('AMOUNT', 473, tableY, { width: 70, align: 'right' }) // Right padding 12px
					drawLine(tableY + 24)

					let currentY = tableY + 45
					data.items.forEach((item, index) => {
						if (currentY > 750) {
							doc.addPage()
							currentY = 50
							drawLine(currentY - 10)
						}

						// Zebra striping for even rows
						if (index % 2 === 0) {
							doc
								.roundedRect(
									40,
									currentY - 18,
									515,
									data.items.length > 5 ? 45 : 55,
									6
								)
								.fillColor('#f9fafb')
								.fill()
						}

						doc
							.fillColor(colors.ink)
							.fontSize(14)
							.font('SpaceGrotesk')
							.text(item.description || '-', 52, currentY, {
								width: 270,
								lineGap: 4
							})
						doc
							.fillColor(colors.muted)
							.text((item.quantity || 0).toString(), 330, currentY, {
								width: 40,
								align: 'center'
							})
							.text(formatCurrency(item.rate || 0), 410, currentY, {
								width: 60,
								align: 'right'
							})
						doc
							.fillColor(colors.ink)
							.font('SpaceGrotesk-Bold')
							.text(formatCurrency(item.amount || 0), 473, currentY, {
								width: 70,
								align: 'right'
							})
						currentY += data.items.length > 5 ? 45 : 55
						drawLine(currentY - 15, colors.tableLine)
					})

					// 5. Summary
					if (currentY > 700) {
						doc.addPage()
						currentY = 50
					}
					const summaryY = currentY + 10
					doc
						.fillColor(colors.muted)
						.fontSize(14)
						.font('SpaceGrotesk')
						.text('Subtotal', 40, summaryY)
					doc
						.fillColor(colors.ink)
						.font('SpaceGrotesk-Bold')
						.fontSize(14)
						.text(formatCurrency(subtotal), 105, summaryY)

					if ((data.tax || 0) > 0) {
						doc
							.fillColor(colors.muted)
							.fontSize(14)
							.font('SpaceGrotesk')
							.text(`Tax (${data.tax}%)`, 200, summaryY)
						doc
							.fillColor(colors.ink)
							.font('SpaceGrotesk-Bold')
							.fontSize(14)
							.text(formatCurrency(taxAmount), 265, summaryY)
					}

					const pillY = summaryY + 30
					const pillX = 40
					const pillWidth = 515
					const pillHeight = 50
					const grad = doc.linearGradient(
						pillX,
						pillY,
						pillX + pillWidth,
						pillY
					)
					grad.stop(0, '#0b1b2b').stop(0.55, '#1e3550').stop(1, '#b08968')
					doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 14).fill(grad)

					doc
						.fillColor(colors.white)
						.fontSize(16)
						.font('SpaceGrotesk-Bold')
						.text('Total', pillX + 25, pillY + 16)
					doc.text(formatCurrency(total), pillX, pillY + 16, {
						width: pillWidth - 25,
						align: 'right'
					})

					let nextSummaryY = pillY + pillHeight

					// 6. Notes
					if (data.notes) {
						let notesY = Math.max(nextSummaryY + 20, pillY + 68)

						// Check if notes fit, if not add page
						if (notesY + 100 > 800) {
							doc.addPage()
							notesY = 50
						}

						doc
							.roundedRect(40, notesY, 515, 85, 12)
							.fillAndStroke(previewColors.noteBg, previewColors.noteBorder)
						doc
							.fillColor(previewColors.noteText)
							.fontSize(12)
							.font('SpaceGrotesk-Bold')
							.text('NOTES', 65, notesY + 18)
						doc
							.fillColor(previewColors.inkSoft)
							.fontSize(14)
							.font('SpaceGrotesk')
							.text(data.notes, 65, notesY + 35, { width: 470 })
					}
					doc.end()

					stream.on('finish', () => {
						const blob = stream.toBlob('application/pdf')
						const url = URL.createObjectURL(blob)
						const link = document.createElement('a')
						link.href = url
						link.download = `invoice-${data.invoiceNumber || 'draft'}.pdf`
						link.click()
						URL.revokeObjectURL(url)
					})
				}
			} catch (error) {
				console.error('PDF Error:', error)
				alert('Failed to generate PDF.')
			}
		}

		useImperativeHandle(ref, () => ({
			downloadPDF: handleDownloadPDF
		}))

		return (
			<div className='bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-black/40 overflow-hidden border border-slate-200/70 dark:border-slate-800/80 relative'>
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
						<div className='p-2 bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 rounded-xl shadow-md shadow-slate-900/25'>
							<FileText className='w-5 h-5 text-white' />
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
									fontSize: '18px',
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.sender.name || 'Your Business'}
							</p>

							<p
								style={{
									fontSize: '14px',
									color: previewColors.muted,
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.sender.email}
							</p>

							<p
								style={{
									fontSize: '14px',
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
										fontSize: '14px',
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
									fontSize: '16px',
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.recipient.name || 'Client Name'}
							</p>

							<p
								style={{
									fontSize: '14px',
									color: previewColors.muted,
									margin: '0 0 2px 0',
									wordBreak: 'break-word'
								}}
							>
								{data.recipient.email}
							</p>

							<p
								style={{
									fontSize: '14px',
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
										fontSize: '14px',
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
											padding: '8px 0 8px 12px',
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
											padding: '8px 12px 8px 0',
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
												padding: '10px 8px 10px 12px',
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
												padding: '10px 12px 10px 0',
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
					<div style={{ marginBottom: '20px' }}>
						{/* Subtotal and Tax row */}
						<div
							style={{
								display: 'flex',
								gap: '32px',
								marginBottom: '12px',
								fontSize: '13px'
							}}
						>
							<div
								style={{
									display: 'flex',
									gap: '8px',
									alignItems: 'baseline'
								}}
							>
								<span style={{ color: previewColors.muted }}>Subtotal</span>
								<span style={{ fontWeight: '600', color: previewColors.ink }}>
									{formatCurrency(subtotal)}
								</span>
							</div>

							{(data.tax || 0) > 0 && (
								<div
									style={{
										display: 'flex',
										gap: '8px',
										alignItems: 'baseline'
									}}
								>
									<span style={{ color: previewColors.muted }}>
										Tax ({data.tax}%)
									</span>

									<span style={{ fontWeight: '600', color: previewColors.ink }}>
										{formatCurrency(taxAmount)}
									</span>
								</div>
							)}
						</div>

						{/* Total Pill - Wide */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '8px 16px',
								borderRadius: '12px',
								color: '#ffffff',
								background: `linear-gradient(90deg, ${previewColors.ink} 0%, #1e3550 55%, #b08968 100%)`,
								boxShadow: '0 4px 12px rgba(11, 27, 43, 0.15)'
							}}
						>
							<span style={{ fontWeight: '600', fontSize: '15px' }}>Total</span>
							<span style={{ fontWeight: 'bold', fontSize: '15px' }}>
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
								borderRadius: '10px'
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
									margin: 0,
									color: previewColors.inkSoft,
									fontSize: '12px',
									wordBreak: 'break-word'
								}}
							>
								{data.notes}
							</p>
						</div>
					)}
				</div>
			</div>
		)
	}
)

InvoicePreview.displayName = 'InvoicePreview'

export default InvoicePreview
