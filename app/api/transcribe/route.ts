import { openai } from '@/lib/openai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	try {
		const arrayBuffer = await req.arrayBuffer()
		if (!arrayBuffer || arrayBuffer.byteLength === 0) {
			return NextResponse.json(
				{ error: 'No audio data provided' },
				{ status: 400 }
			)
		}

		const audioFile = new File([arrayBuffer], 'audio.webm', {
			type: 'audio/webm'
		})

		const transcription = await openai.audio.transcriptions.create({
			file: audioFile,
			model: 'whisper-1'
		})

		return NextResponse.json({ text: transcription.text })
	} catch (error) {
		console.error('Transcription error:', error)
		return NextResponse.json(
			{ error: 'Failed to transcribe audio' },
			{ status: 500 }
		)
	}
}
