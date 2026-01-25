// Web Speech API types definitions

interface SpeechRecognitionErrorEvent extends Event {
	error: string
	message: string
}

interface SpeechRecognitionAlternative {
	transcript: string
	confidence: number
}

interface SpeechRecognitionResult {
	length: number
	item(index: number): SpeechRecognitionAlternative
	[index: number]: SpeechRecognitionAlternative
	isFinal: boolean
}

interface SpeechRecognitionResultList {
	length: number
	item(index: number): SpeechRecognitionResult
	[index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList
	resultIndex: number
}

interface SpeechRecognition extends EventTarget {
	continuous: boolean
	interimResults: boolean
	lang: string
	start(): void
	stop(): void
	abort(): void
	onerror:
		| ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
		| null
	onresult:
		| ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
		| null
	onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionConstructor {
	new (): SpeechRecognition
}

declare var SpeechRecognition: SpeechRecognitionConstructor
declare var webkitSpeechRecognition: SpeechRecognitionConstructor

// Extend Window interface
interface Window {
	SpeechRecognition: SpeechRecognitionConstructor
	webkitSpeechRecognition: SpeechRecognitionConstructor
}
