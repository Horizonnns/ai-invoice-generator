'use client'

import { Loader2, Mic } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface VoiceInputProps {
	onTranscript: (text: string) => void
	disabled?: boolean
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled }) => {
	const [isListening, setIsListening] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [audioLevel, setAudioLevel] = useState(0)

	const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])
	const audioContextRef = useRef<AudioContext | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const animationFrameRef = useRef<number | null>(null)
	const streamRef = useRef<MediaStream | null>(null)

	const stopListening = useCallback(() => {
		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state !== 'inactive'
		) {
			mediaRecorderRef.current.stop()
		}

		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => track.stop())
			streamRef.current = null
		}

		if (audioContextRef.current) {
			audioContextRef.current.close()
			audioContextRef.current = null
		}

		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current)
			animationFrameRef.current = null
		}

		setIsListening(false)
		setAudioLevel(0)
	}, [])

	const visualize = useCallback(() => {
		if (!analyserRef.current) return
		const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
		analyserRef.current.getByteFrequencyData(dataArray)
		const average = dataArray.reduce((a, b) => a + b) / dataArray.length
		setAudioLevel(average / 128)
		animationFrameRef.current = requestAnimationFrame(visualize)
	}, [])

	const startListening = useCallback(async () => {
		if (disabled || isProcessing) return
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream

			// Set up MediaRecorder
			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: 'audio/webm'
			})
			mediaRecorderRef.current = mediaRecorder
			audioChunksRef.current = []

			mediaRecorder.ondataavailable = event => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data)
				}
			}

			mediaRecorder.onstop = async () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: 'audio/webm'
				})
				setIsProcessing(true)

				try {
					const response = await fetch(`${apiBaseUrl}/api/transcribe`, {
						method: 'POST',
						body: audioBlob,
						headers: { 'Content-Type': 'audio/webm' }
					})

					if (!response.ok) throw new Error('Transcription failed')

					const data = await response.json()
					if (data.text) {
						onTranscript(data.text)
					}
				} catch (error) {
					console.error('Transcription error:', error)
				} finally {
					setIsProcessing(false)
				}
			}

			// Set up Visualizer
			const audioContext = new AudioContext()
			const analyser = audioContext.createAnalyser()
			const microphone = audioContext.createMediaStreamSource(stream)
			analyser.fftSize = 64
			microphone.connect(analyser)
			audioContextRef.current = audioContext
			analyserRef.current = analyser

			visualize()
			mediaRecorder.start()
			setIsListening(true)
		} catch (error) {
			console.error('Error accessing microphone:', error)
		}
	}, [disabled, isProcessing, visualize, apiBaseUrl, onTranscript])

	useEffect(() => {
		return () => stopListening()
	}, [stopListening])

	return (
		<div className='flex items-center gap-3'>
			<button
				type='button'
				onClick={() => (isListening ? stopListening() : startListening())}
				disabled={disabled || isProcessing}
				className={`
					flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold
					${
						isListening
							? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
							: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
					}
					disabled:opacity-50
				`}
			>
				{isProcessing ? (
					<div className='flex items-center gap-2'>
						<Loader2 className='w-3.5 h-3.5 animate-spin' />
						<span>Processing...</span>
					</div>
				) : isListening ? (
					<div className='flex items-center gap-1.5'>
						<div className='flex items-center gap-0.5 h-3 w-4'>
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className='w-full bg-current rounded-full transition-all duration-100'
									style={{
										height: `${20 + audioLevel * 80 * (0.6 + i * 0.2)}%`
									}}
								/>
							))}
						</div>
						<span>Stop Recording</span>
					</div>
				) : (
					<>
						<Mic className='w-3.5 h-3.5 text-slate-400' />
						<span>Voice input</span>
					</>
				)}
			</button>

			{isListening && (
				<button
					onClick={stopListening}
					className='text-[10px] h-7 px-2 font-bold text-slate-400 hover:text-rose-500 transition-colors bg-slate-100 dark:bg-white/5 rounded-md'
				>
					Done
				</button>
			)}
		</div>
	)
}

export default VoiceInput
