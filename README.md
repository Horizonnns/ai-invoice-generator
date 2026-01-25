# AI Invoice Generator

A modern, AI-powered invoice generator built with React (Vite) and Node.js
(Express). Features a clean Stripe-inspired interface with real-time preview and
PDF export capabilities.

![AI Invoice Generator](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4+-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

- **🎨 Modern UI** - Clean, Stripe-inspired interface with Inter font, soft
  shadows, and rounded corners
- **🤖 AI Magic Fill** - Paste unstructured text and let AI (GPT-4o-mini)
  extract invoice data automatically
- **👀 Live Preview** - Real-time invoice preview as you type
- **📄 PDF Export** - Generate high-quality PDF invoices with one click
- **📱 Responsive** - Works beautifully on desktop and mobile
- **💰 Auto-calculations** - Automatic subtotal, tax, and total calculations
- **📺 Ad-Ready** - Placeholder positions for Google AdSense banners

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (for Magic Fill feature)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-invoice-generator
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd server
   npm install
   ```

4. **Configure environment variables**

   ```bash
   # In the server directory
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

5. **Start the development servers**

   Terminal 1 - Backend:

   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 - Frontend:

   ```bash
   npm run dev
   ```

6. **Open your browser** Navigate to `http://localhost:5173`

## 📁 Project Structure

```
ai-invoice-generator/
├── src/
│   ├── components/
│   │   ├── AdBanner.tsx       # AdSense placeholder
│   │   ├── InvoiceForm.tsx    # Main form component
│   │   ├── InvoiceItems.tsx   # Line items editor
│   │   ├── InvoicePreview.tsx # Live preview + PDF
│   │   └── MagicFill.tsx      # AI text parser modal
│   ├── types/
│   │   └── invoice.ts         # TypeScript interfaces
│   ├── utils/
│   │   └── helpers.ts         # Utility functions
│   ├── App.tsx                # Main app component
│   ├── index.css              # Global styles + Tailwind
│   └── main.tsx               # Entry point
├── server/
│   ├── index.js               # Express server + OpenAI
│   └── .env.example           # Environment template
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
└── package.json               # Frontend dependencies
```

## 🎯 API Endpoints

### POST /api/parse-invoice

Parse unstructured text into invoice data using GPT-4o-mini.

**Request:**

```json
{
	"text": "I did 5 hours of design work at $50/hour for John Doe from Acme Corp..."
}
```

**Response:**

```json
{
	"sender": {
		"name": "Your Business",
		"email": "you@example.com"
	},
	"recipient": {
		"name": "John Doe",
		"email": "john@acme.com"
	},
	"items": [
		{
			"description": "Design work",
			"quantity": 5,
			"rate": 50
		}
	]
}
```

## 🛠️ Technologies

- **Frontend:**
  - React 18+ with TypeScript
  - Vite for fast development
  - Tailwind CSS 4 for styling
  - Lucide React for icons
  - jsPDF + html2canvas for PDF generation

- **Backend:**
  - Node.js with Express
  - OpenAI SDK (GPT-4o-mini)
  - CORS for cross-origin requests

## 🔧 Configuration

### Tailwind CSS

The app uses Tailwind CSS 4 with the Vite plugin. Custom styles are defined in
`src/index.css`.

### Vite Proxy

API requests to `/api/*` are proxied to the backend server (default:
`http://localhost:3001`).

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
