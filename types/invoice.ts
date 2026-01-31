export interface InvoiceItem {
	id: string
	description: string
	quantity: number | undefined
	rate: number | undefined
	amount: number
}

export interface PartyInfo {
	name: string
	email: string
	address: string
	phone?: string
}

export interface InvoiceData {
	invoiceNumber: string
	issueDate: string
	dueDate: string
	sender: PartyInfo
	recipient: PartyInfo
	items: InvoiceItem[]
	notes?: string
	tax?: number
	logo?: string
}

export interface ParsedInvoiceResponse {
	sender?: Partial<PartyInfo>
	recipient?: Partial<PartyInfo>
	items?: Array<{
		description: string
		quantity: number
		rate: number
	}>
	issueDate?: string
	dueDate?: string
	notes?: string
}

export interface InvoiceRecord {
	id: string
	status: 'draft' | 'final'
	data: InvoiceData
	createdAt: number
	updatedAt: number
}

export interface AuthUser {
	id: string
	email: string
	name?: string
	picture?: string
}
