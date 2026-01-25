'use client'

import { Mic, MicOff } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface VoiceInputProps {
	onTranscript: (text: string) => void
	disabled?: boolean
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled }) => {
	const [isListening, setIsListening] = useState(false)
	const [audioLevel, setAudioLevel] = useState(0)
	const recognitionRef = useRef<SpeechRecognition | null>(null)
	const audioContextRef = useRef<AudioContext | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const animationFrameRef = useRef<number | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const transcriptRef = useRef<string>('')

	const stopListening = useCallback(() => {
		if (recognitionRef.current) {
			recognitionRef.current.stop()
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

		// Send final transcript before clearing
		if (transcriptRef.current) {
			onTranscript(transcriptRef.current)
			transcriptRef.current = ''
		}

		setIsListening(false)
		setAudioLevel(0)
	}, [onTranscript])

	// Visualization function
	const visualize = useCallback(() => {
		if (!analyserRef.current) return

		const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
		analyserRef.current.getByteFrequencyData(dataArray)

		// Calculate average audio level
		const average = dataArray.reduce((a, b) => a + b) / dataArray.length
		const normalizedLevel = Math.min(average / 128, 1) // Normalize to 0-1

		setAudioLevel(normalizedLevel)

		animationFrameRef.current = requestAnimationFrame(visualize)
	}, [])

	const startListening = useCallback(async () => {
		if (!recognitionRef.current || disabled) return

		try {
			// Start speech recognition
			recognitionRef.current.start()

			// Start audio visualization
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream

			const audioContext = new AudioContext()
			const analyser = audioContext.createAnalyser()
			const microphone = audioContext.createMediaStreamSource(stream)

			analyser.fftSize = 256
			microphone.connect(analyser)

			audioContextRef.current = audioContext
			analyserRef.current = analyser

			visualize()
			setIsListening(true)
		} catch (error) {
			console.error('Error accessing microphone:', error)
		}
	}, [disabled, visualize])

	useEffect(() => {
		// Check if browser supports Speech Recognition
		const SpeechRecognitionAPI =
			window.SpeechRecognition || window.webkitSpeechRecognition

		if (SpeechRecognitionAPI) {
			const recognition = new SpeechRecognitionAPI()
			recognition.continuous = true
			recognition.interimResults = true
			// Using English for better recognition of technical terms and mixed language input
			recognition.lang = 'en-US'

			recognition.onresult = event => {
				// Get only the latest result
				const lastResult = event.results[event.results.length - 1]
				const transcript = lastResult[0].transcript

				// Only process final results to avoid premature text updates
				if (lastResult.isFinal) {
					// Add space before new word if there's existing text
					const separator = transcriptRef.current ? ' ' : ''
					transcriptRef.current += separator + transcript
					onTranscript(transcriptRef.current)
				}
			}

			recognition.onerror = event => {
				console.error('Speech recognition error:', event.error)
				stopListening()
			}

			recognition.onend = () => {
				// Don't restart automatically
			}

			recognitionRef.current = recognition
		}

		return () => {
			stopListening()
		}
	}, [onTranscript, stopListening])

	const toggleListening = () => {
		if (isListening) {
			stopListening()
		} else {
			startListening()
		}
	}

	// Generate visualization bars with stable random values
	const bars = useMemo(() => {
		return Array.from({ length: 5 }, (_, i) => {
			const randomFactor = 0.5 + i * 0.1 // Stable factor based on index
			const height = Math.max(20, audioLevel * 100 * randomFactor)
			const delay = i * 50
			return { height, delay }
		})
	}, [audioLevel])

	return (
		<div className='flex items-center gap-2'>
			{/* Voice visualization */}
			{isListening && (
				<div className='flex items-center gap-0.5 h-6'>
					{bars.map((bar, index) => (
						<div
							key={index}
							className='w-1 bg-linear-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-100'
							style={{
								height: `${bar.height}%`,
								transitionDelay: `${bar.delay}ms`
							}}
						/>
					))}
				</div>
			)}

			{/* Microphone button */}
			<button
				type='button'
				onClick={toggleListening}
				disabled={disabled}
				className={`
					relative p-2 rounded-lg transition-all duration-300
					${
						isListening
							? 'bg-linear-to-br from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/50 scale-110'
							: 'bg-linear-to-br from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105'
					}
					disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
				`}
				title={isListening ? 'Остановить запись' : 'Начать запись голосом'}
			>
				{isListening ? (
					<>
						<MicOff className='w-4 h-4' />
						{/* Pulsing animation */}
						<span className='absolute inset-0 rounded-lg bg-red-500 animate-ping opacity-75' />
					</>
				) : (
					<Mic className='w-4 h-4' />
				)}
			</button>
		</div>
	)
}

export default VoiceInput
