declare module 'pdfkit/js/pdfkit.standalone.js' {
	const PDFDocument: typeof import('pdfkit')
	export default PDFDocument
}

declare module 'blob-stream' {
	import { Writable } from 'stream'
	interface IBlobStream extends Writable {
		toBlob(type?: string): Blob
		toBlobURL(type?: string): string
	}
	function blobStream(): IBlobStream
	export default blobStream
}
