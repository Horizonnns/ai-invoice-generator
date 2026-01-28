import cors from 'cors'
import crypto from 'crypto'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs/promises'
import OpenAI from 'openai'
import path from 'path'

dotenv.config()

const app = express()
const PORT = process.env.PORT
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 7)
const dataFile = path.join(process.cwd(), 'data.json')

// Middleware
app.use(
	cors({
		origin: CLIENT_ORIGIN,
		credentials: true
	})
)
app.use(express.json())

const emptyData = {
	users: {},
	sessions: {},
	invoices: []
}

const loadData = async () => {
	try {
		const raw = await fs.readFile(dataFile, 'utf-8')
		return JSON.parse(raw)
	} catch (error) {
		if (error.code === 'ENOENT') {
			return { ...emptyData }
		}
		throw error
	}
}

const saveData = async data => {
	await fs.writeFile(dataFile, JSON.stringify(data, null, 2))
}

const parseCookies = cookieHeader => {
	if (!cookieHeader) return {}
	return cookieHeader.split(';').reduce((acc, part) => {
		const [key, ...rest] = part.trim().split('=')
		acc[key] = decodeURIComponent(rest.join('='))
		return acc
	}, {})
}

const setSessionCookie = (res, token, maxAgeSeconds) => {
	const parts = [
		`session=${encodeURIComponent(token)}`,
		`Max-Age=${maxAgeSeconds}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax'
	]
	if (process.env.NODE_ENV === 'production') {
		parts.push('Secure')
	}
	res.setHeader('Set-Cookie', parts.join('; '))
}

const clearSessionCookie = res => {
	res.setHeader(
		'Set-Cookie',
		'session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax'
	)
}

const getSessionUser = async req => {
	const cookies = parseCookies(req.headers.cookie)
	const token = cookies.session
	if (!token) return null

	const data = await loadData()
	const session = data.sessions[token]
	if (!session) return null

	if (session.expiresAt < Date.now()) {
		delete data.sessions[token]
		await saveData(data)
		return null
	}

	return data.users[session.userId] ?? null
}

const requireAuth = async (req, res, next) => {
	const user = await getSessionUser(req)
	if (!user) {
		return res.status(401).json({ error: 'Unauthorized' })
	}
	req.user = user
	next()
}

// Initialize OpenAI
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

// Auth: Google sign-in
app.post('/api/auth/google', async (req, res) => {
	try {
		const { credential } = req.body
		if (!credential || typeof credential !== 'string') {
			return res.status(400).json({ error: 'Missing credential' })
		}
		if (!GOOGLE_CLIENT_ID) {
			return res.status(500).json({ error: 'Google client not configured' })
		}

		const tokenInfoRes = await fetch(
			`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
				credential
			)}`
		)
		if (!tokenInfoRes.ok) {
			return res.status(401).json({ error: 'Invalid Google token' })
		}
		const tokenInfo = await tokenInfoRes.json()
		if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
			return res.status(401).json({ error: 'Invalid token audience' })
		}
		if (tokenInfo.email_verified !== 'true') {
			return res.status(401).json({ error: 'Email not verified' })
		}

		const userId = tokenInfo.sub
		const data = await loadData()
		if (!data.users[userId]) {
			data.users[userId] = {
				id: userId,
				email: tokenInfo.email,
				name: tokenInfo.name,
				picture: tokenInfo.picture,
				createdAt: Date.now()
			}
		}

		const sessionToken = crypto.randomUUID()
		const ttlMs = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
		data.sessions[sessionToken] = {
			userId,
			createdAt: Date.now(),
			expiresAt: Date.now() + ttlMs
		}
		await saveData(data)

		setSessionCookie(res, sessionToken, Math.floor(ttlMs / 1000))
		res.json({ user: data.users[userId] })
	} catch (error) {
		console.error('Auth error:', error)
		res.status(500).json({ error: 'Authentication failed' })
	}
})

app.get('/api/auth/me', async (req, res) => {
	try {
		const user = await getSessionUser(req)
		res.json({ user })
	} catch (error) {
		console.error('Auth check error:', error)
		res.status(500).json({ error: 'Failed to load session' })
	}
})

app.post('/api/auth/logout', async (req, res) => {
	try {
		const cookies = parseCookies(req.headers.cookie)
		const token = cookies.session
		if (token) {
			const data = await loadData()
			delete data.sessions[token]
			await saveData(data)
		}
		clearSessionCookie(res)
		res.json({ ok: true })
	} catch (error) {
		console.error('Logout error:', error)
		res.status(500).json({ error: 'Failed to logout' })
	}
})

// Drafts & history
app.get('/api/invoices', requireAuth, async (req, res) => {
	try {
		const data = await loadData()
		const userInvoices = data.invoices
			.filter(invoice => invoice.userId === req.user.id)
			.sort((a, b) => b.updatedAt - a.updatedAt)
		res.json({ invoices: userInvoices })
	} catch (error) {
		console.error('List invoices error:', error)
		res.status(500).json({ error: 'Failed to list invoices' })
	}
})

app.post('/api/invoices', requireAuth, async (req, res) => {
	try {
		const { status, data: invoiceData } = req.body
		if (!invoiceData) {
			return res.status(400).json({ error: 'Missing invoice data' })
		}
		const payloadStatus = status === 'final' ? 'final' : 'draft'
		const record = {
			id: crypto.randomUUID(),
			userId: req.user.id,
			status: payloadStatus,
			data: invoiceData,
			createdAt: Date.now(),
			updatedAt: Date.now()
		}
		const store = await loadData()
		store.invoices.push(record)
		await saveData(store)
		res.status(201).json({ invoice: record })
	} catch (error) {
		console.error('Create invoice error:', error)
		res.status(500).json({ error: 'Failed to save invoice' })
	}
})

app.put('/api/invoices/:id', requireAuth, async (req, res) => {
	try {
		const { id } = req.params
		const { status, data: invoiceData } = req.body
		const store = await loadData()
		const index = store.invoices.findIndex(
			invoice => invoice.id === id && invoice.userId === req.user.id
		)
		if (index === -1) {
			return res.status(404).json({ error: 'Invoice not found' })
		}
		store.invoices[index] = {
			...store.invoices[index],
			status:
				status === 'final' || status === 'draft'
					? status
					: store.invoices[index].status,
			data: invoiceData ?? store.invoices[index].data,
			updatedAt: Date.now()
		}
		await saveData(store)
		res.json({ invoice: store.invoices[index] })
	} catch (error) {
		console.error('Update invoice error:', error)
		res.status(500).json({ error: 'Failed to update invoice' })
	}
})

app.delete('/api/invoices/:id', requireAuth, async (req, res) => {
	try {
		const { id } = req.params
		const store = await loadData()
		const nextInvoices = store.invoices.filter(
			invoice => !(invoice.id === id && invoice.userId === req.user.id)
		)
		if (nextInvoices.length === store.invoices.length) {
			return res.status(404).json({ error: 'Invoice not found' })
		}
		store.invoices = nextInvoices
		await saveData(store)
		res.json({ ok: true })
	} catch (error) {
		console.error('Delete invoice error:', error)
		res.status(500).json({ error: 'Failed to delete invoice' })
	}
})

// Parse invoice endpoint
app.post('/api/parse-invoice', async (req, res) => {
	try {
		const { text } = req.body

		if (!text || typeof text !== 'string') {
			return res.status(400).json({
				error: 'Please provide text to parse'
			})
		}

		if (!process.env.OPENAI_API_KEY) {
			return res.status(500).json({
				error: 'OpenAI API key not configured'
			})
		}

		const systemPrompt = `You are an AI assistant that extracts invoice information from unstructured text. 
Extract the following information and return it as JSON:

{
  "sender": {
    "name": "Business/person name of the invoice sender",
    "email": "Email address of sender",
    "address": "Physical address of sender",
    "phone": "Phone number of sender (optional)"
  },
  "recipient": {
    "name": "Client/customer name",
    "email": "Email address of recipient",
    "address": "Physical address of recipient",
    "phone": "Phone number of recipient (optional)"
  },
  "items": [
    {
      "description": "Description of service or product",
      "quantity": number,
      "rate": number (price per unit in dollars)
    }
  ],
  "issueDate": "YYYY-MM-DD format (date when invoice was issued or work was done)",
  "dueDate": "YYYY-MM-DD format (payment due date, if mentioned)",
  "notes": "Any additional notes or payment instructions"
}

Rules:
- Only include fields that you can extract from the text
- For items, calculate reasonable quantities and rates from the text
- If hours and hourly rate are mentioned, use those values
- For dates: extract any mentioned dates and convert to YYYY-MM-DD format
  * If only day is mentioned (e.g., "19 числа"), use current month and year
  * Current date context: ${new Date().toISOString().split('T')[0]}
  * If no dates mentioned, omit issueDate and dueDate
- Return valid JSON only, no markdown formatting
- If you cannot extract certain fields, omit them from the response`

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: text }
			],
			temperature: 0.3,
			response_format: { type: 'json_object' }
		})

		const responseText = completion.choices[0]?.message?.content

		if (!responseText) {
			return res.status(500).json({
				error: 'Failed to get response from AI'
			})
		}

		const parsedData = JSON.parse(responseText)
		res.json(parsedData)
	} catch (error) {
		console.error('Error parsing invoice:', error)
		res.status(500).json({
			error: 'Failed to parse invoice data'
		})
	}
})

// Audio Transcription endpoint
// We use express.raw to handle the binary audio data sent from the client
app.post(
	'/api/transcribe',
	express.raw({ type: 'audio/*', limit: '10mb' }),
	async (req, res) => {
		try {
			if (!req.body || req.body.length === 0) {
				return res.status(400).json({ error: 'No audio data provided' })
			}

			if (!process.env.OPENAI_API_KEY) {
				return res.status(500).json({ error: 'OpenAI API key not configured' })
			}

			// Convert Buffer to File object for OpenAI SDK
			// Node 20+ supports the File and Blob globals
			const audioFile = new File([req.body], 'audio.webm', {
				type: 'audio/webm'
			})

			const transcription = await openai.audio.transcriptions.create({
				file: audioFile,
				model: 'whisper-1'
			})

			res.json({ text: transcription.text })
		} catch (error) {
			console.error('Transcription error:', error)
			res.status(500).json({ error: 'Failed to transcribe audio' })
		}
	}
)

// Health check
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok' })
})

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`)
})
