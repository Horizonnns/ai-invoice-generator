'use client'

import type { InvoiceData } from '@/types/invoice'
import {
	calculateSubtotal,
	calculateTax,
	calculateTotal,
	formatCurrency,
	formatDate
} from '@/utils/helpers'
import { FileText, Upload } from 'lucide-react'
import { forwardRef, useImperativeHandle, useRef } from 'react'

interface InvoicePreviewProps {
	data: InvoiceData
	onLogoChange?: (logo: string | undefined) => void
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
	({ data, onLogoChange }, ref) => {
		const invoiceRef = useRef<HTMLDivElement>(null)
		const fileInputRef = useRef<HTMLInputElement>(null)

		const handleLogoClick = () => {
			fileInputRef.current?.click()
		}

		const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (!file) return

			if (file.size > 2 * 1024 * 1024) {
				alert('Image size should be less than 2MB')
				return
			}

			const reader = new FileReader()
			reader.onloadend = () => {
				const base64String = reader.result as string
				onLogoChange?.(base64String)
			}
			reader.readAsDataURL(file)
			event.target.value = ''
		}

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

					if (data.logo) {
						doc.save()
						doc.roundedRect(40, 40, headerSize, headerSize, 14).clip()
						doc.image(data.logo, 40, 40, {
							width: headerSize,
							height: headerSize,
							fit: [headerSize, headerSize],
							align: 'center',
							valign: 'center'
						})
						doc.restore()
					} else {
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
					}

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
					className='p-6 bg-white'
					style={{
						color: previewColors.inkSoft,
						fontFamily:
							'Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif'
					}}
				>
					{/* Header */}
					<div className='flex items-center gap-2.5 mb-5'>
						<div
							onClick={handleLogoClick}
							className='cursor-pointer group relative'
							title='Click to upload logo'
						>
							<input
								type='file'
								ref={fileInputRef}
								onChange={handleFileChange}
								accept='image/*'
								className='hidden'
							/>
							{data.logo ? (
								<div className='relative overflow-hidden rounded-xl'>
									<img
										src={data.logo}
										alt='Logo'
										className='w-10 h-10 object-contain bg-white dark:bg-slate-800 shadow-md shadow-slate-900/10'
									/>
									<div className='absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
										<Upload className='w-4 h-4 text-white' />
									</div>
								</div>
							) : (
								<div className='relative'>
									<div className='p-2 bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 rounded-xl shadow-md shadow-slate-900/25 transition-all'>
										<FileText className='w-5 h-5 text-white' />
									</div>
									<div className='absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
										<Upload className='w-4 h-4 text-white' />
									</div>
								</div>
							)}
						</div>

						<div>
							<h1 className='text-[20px] font-bold text-ink m-0'>INVOICE</h1>

							<p className='text-[12px] text-[#6b7280] m-0'>
								{data.invoiceNumber}
							</p>
						</div>
					</div>

					{/* Parties */}
					<div className='grid grid-cols-2 gap-4 mb-5'>
						<div>
							<p className='text-[10px] font-semibold text-[#6b7280] uppercase tracking-[0.05em] mb-1'>
								From
							</p>

							<p className='font-semibold text-ink text-[18px] mb-0.5 wrap-break-word'>
								{data.sender.name || 'Your Business'}
							</p>

							<p className='text-[14px] text-[#6b7280] mb-0.5 wrap-break-word'>
								{data.sender.email}
							</p>

							<p className='text-[14px] text-[#6b7280] mb-0.5 wrap-break-word'>
								{data.sender.address}
							</p>

							{data.sender.phone && (
								<p className='text-[14px] text-[#6b7280] m-0'>
									{data.sender.phone}
								</p>
							)}
						</div>

						<div>
							<p className='text-[10px] font-semibold text-[#6b7280] uppercase tracking-[0.05em] mb-1'>
								Bill To
							</p>

							<p className='font-semibold text-ink text-[16px] mb-0.5 wrap-break-word'>
								{data.recipient.name || 'Client Name'}
							</p>

							<p className='text-[14px] text-[#6b7280] mb-0.5 wrap-break-word'>
								{data.recipient.email}
							</p>

							<p className='text-[14px] text-[#6b7280] mb-0.5 wrap-break-word'>
								{data.recipient.address}
							</p>

							{data.recipient.phone && (
								<p className='text-[14px] text-[#6b7280] m-0'>
									{data.recipient.phone}
								</p>
							)}
						</div>
					</div>

					{/* Dates */}
					<div className='flex gap-8 mb-5 px-4 py-3 rounded-[10px] border bg-paper border-[#e9d7c2]'>
						<div>
							<p className='text-[10px] font-semibold text-[#6b7280] uppercase m-0 mb-0.5'>
								Issue Date
							</p>

							<p className='font-medium text-ink text-[14px] m-0'>
								{data.issueDate ? formatDate(data.issueDate) : '-'}
							</p>
						</div>

						<div>
							<p className='text-[10px] font-semibold text-[#6b7280] uppercase m-0 mb-0.5'>
								Due Date
							</p>

							<p className='font-medium text-ink text-[14px] m-0'>
								{data.dueDate ? formatDate(data.dueDate) : '-'}
							</p>
						</div>
					</div>

					{/* Items Table */}
					<div
						className={`mb-5 ${
							data.items.length > 4
								? 'custom-scrollbar pr-1 max-h-[230px] overflow-y-auto'
								: ''
						}`}
					>
						<table className='w-full text-[12px] border-collapse'>
							<thead>
								<tr className='border-b-2 border-[#e5e7eb]'>
									<th className='sticky top-0 bg-white z-10 text-left py-2 pl-3 text-[10px] font-semibold text-[#6b7280] uppercase'>
										Description
									</th>

									<th className='sticky top-0 bg-white z-10 text-center py-2 w-[60px] text-[10px] font-semibold text-[#6b7280] uppercase'>
										Qty
									</th>

									<th className='sticky top-0 bg-white z-10 text-right py-2 w-[80px] text-[10px] font-semibold text-[#6b7280] uppercase'>
										Rate
									</th>

									<th className='sticky top-0 bg-white z-10 text-right py-2 pr-3 w-[90px] text-[10px] font-semibold text-[#6b7280] uppercase'>
										Amount
									</th>
								</tr>
							</thead>

							<tbody>
								{data.items.map((item, index) => (
									<tr
										key={item.id}
										className={index % 2 === 0 ? 'bg-[#f9fafb]' : 'bg-white'}
									>
										<td className='py-2.5 pl-3 pr-2 text-ink wrap-break-word'>
											{item.description || '-'}
										</td>

										<td className='py-2.5 text-center text-[#6b7280]'>
											{item.quantity ?? 0}
										</td>

										<td className='py-2.5 text-right text-[#6b7280]'>
											{formatCurrency(item.rate ?? 0)}
										</td>

										<td className='py-2.5 pr-3 text-right font-medium text-ink'>
											{formatCurrency(item.amount)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Totals */}
					<div className='mb-5'>
						{/* Subtotal and Tax row */}
						<div className='flex gap-8 mb-3 text-[13px]'>
							<div className='flex gap-2 items-baseline'>
								<span className='text-[#6b7280]'>Subtotal</span>
								<span className='font-semibold text-ink'>
									{formatCurrency(subtotal)}
								</span>
							</div>

							{(data.tax || 0) > 0 && (
								<div className='flex gap-2 items-baseline'>
									<span className='text-[#6b7280]'>Tax ({data.tax}%)</span>

									<span className='font-semibold text-ink'>
										{formatCurrency(taxAmount)}
									</span>
								</div>
							)}
						</div>

						{/* Total Pill - Wide */}
						<div className='flex items-center justify-between px-4 py-2 rounded-xl text-white shadow-[0_4px_12px_rgba(11,27,43,0.15)] bg-[linear-gradient(90deg,#0b1b2b_0%,#1e3550_55%,#b08968_100%)]'>
							<span className='font-semibold text-[15px]'>Total</span>
							<span className='font-bold text-[15px]'>
								{formatCurrency(total)}
							</span>
						</div>
					</div>

					{/* Notes */}
					{data.notes && (
						<div className='px-4 py-3 bg-[#fff3e2] border border-[#f2d4b0] rounded-[10px]'>
							<p className='text-[10px] font-semibold text-brass uppercase m-0 mb-1'>
								Notes
							</p>

							<p className='m-0 text-ink-soft text-[12px] wrap-break-word'>
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
