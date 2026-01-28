'use client'

import { Mic } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

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
		if (recognitionRef.current) recognitionRef.current.stop()
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
		if (transcriptRef.current) {
			onTranscript(transcriptRef.current)
			transcriptRef.current = ''
		}
		setIsListening(false)
		setAudioLevel(0)
	}, [onTranscript])

	const visualize = useCallback(() => {
		if (!analyserRef.current) return
		const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
		analyserRef.current.getByteFrequencyData(dataArray)
		const average = dataArray.reduce((a, b) => a + b) / dataArray.length
		setAudioLevel(average / 128)
		animationFrameRef.current = requestAnimationFrame(visualize)
	}, [])

	const startListening = useCallback(async () => {
		if (!recognitionRef.current || disabled) return
		try {
			recognitionRef.current.start()
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream
			const audioContext = new AudioContext()
			const analyser = audioContext.createAnalyser()
			const microphone = audioContext.createMediaStreamSource(stream)
			analyser.fftSize = 64
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
		const API = window.SpeechRecognition || window.webkitSpeechRecognition
		if (API) {
			const recognition = new API()
			recognition.continuous = true
			recognition.interimResults = true
			recognition.lang = 'en-US'
			recognition.onresult = event => {
				const last = event.results[event.results.length - 1]
				if (last.isFinal) {
					transcriptRef.current +=
						(transcriptRef.current ? ' ' : '') + last[0].transcript
					onTranscript(transcriptRef.current)
				}
			}
			recognition.onerror = () => stopListening()
			recognitionRef.current = recognition
		}
		return () => stopListening()
	}, [onTranscript, stopListening])

	return (
		<div className='flex items-center gap-3'>
			<button
				type='button'
				onClick={() => (isListening ? stopListening() : startListening())}
				disabled={disabled}
				className={`
					flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold
					${
						isListening
							? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
							: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
					}
				`}
			>
				{isListening ? (
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
						<span>Listening...</span>
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
