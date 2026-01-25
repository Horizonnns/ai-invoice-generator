import type { InvoiceItem } from '@/types/invoice'

export const generateId = (): string => {
	return Math.random().toString(36).substring(2, 11)
}

export const generateInvoiceNumber = (): string => {
	const date = new Date()
	const year = date.getFullYear().toString().slice(-2)
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const random = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, '0')
	return `INV-${year}${month}-${random}`
}

export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(amount)
}

export const formatDate = (dateString: string): string => {
	const date = new Date(dateString)
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

export const calculateItemAmount = (
	quantity: number | undefined,
	rate: number | undefined
): number => {
	const q = quantity ?? 0
	const r = rate ?? 0
	return q * r
}

export const calculateSubtotal = (items: InvoiceItem[]): number => {
	return items.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateTax = (subtotal: number, taxRate: number): number => {
	return subtotal * (taxRate / 100)
}

export const calculateTotal = (subtotal: number, tax: number): number => {
	return subtotal + tax
}

export const getTodayDate = (): string => {
	return new Date().toISOString().split('T')[0]
}

export const getDefaultDueDate = (): string => {
	const date = new Date()
	date.setDate(date.getDate() + 30)
	return date.toISOString().split('T')[0]
}

export const createEmptyItem = (): InvoiceItem => ({
	id: generateId(),
	description: '',
	quantity: 1,
	rate: undefined,
	amount: 0
})
