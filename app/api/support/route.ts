import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
	try {
		const { email, message } = await req.json()

		if (!email || !message) {
			return NextResponse.json(
				{ error: 'Email and message are required' },
				{ status: 400 }
			)
		}

		console.log('Env Check:', {
			user: !!process.env.GMAIL_USER,
			pass: !!process.env.GMAIL_APP_PASSWORD
		})

		// Configure Gmail SMTP transporter
		// NOTE: You need to use an "App Password" from Google, not your regular password
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_APP_PASSWORD
			}
		})

		// Email options
		const mailOptions = {
			from: process.env.GMAIL_USER, // Check if this needs to be authorized sender
			to: process.env.GMAIL_USER, // Send TO yourself (as admin)
			replyTo: email, // So you can hit "Reply" to answer the user
			subject: `[Support] New Message from ${email}`,
			text: `You received a new support request:\n\nFrom: ${email}\n\nMessage:\n${message}`,
			html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>INVOICE -> New Support Request</h2>
          <p><strong>From:</strong> ${email}</p>
          <hr />
          <p style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
          <hr />
          <p style="font-size: 12px; color: #777;">Sent from AI Invoice Generator</p>
        </div>
      `
		}

		await transporter.sendMail(mailOptions)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Failed to send email:', error)
		return NextResponse.json(
			{ error: 'Failed to send message' },
			{ status: 500 }
		)
	}
}
