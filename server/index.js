import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import OpenAI from 'openai'

dotenv.config()

const app = express()
const PORT = process.env.PORT

// Middleware
app.use(cors())
app.use(express.json())

// Initialize OpenAI
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
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

// Health check
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok' })
})

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`)
})
