/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// Disable image optimization for static export if needed
	images: {
		unoptimized: false
	},
	// Enable experimental features if needed
	experimental: {
		// Add any experimental features here
	}
}

export default nextConfig
