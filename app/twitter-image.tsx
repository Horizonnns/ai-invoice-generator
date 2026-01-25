import { ImageResponse } from 'next/og'

export const size = {
	width: 1200,
	height: 630
}

export const contentType = 'image/png'

export default function TwitterImage() {
	return new ImageResponse(
		(
			<div
				style={{
					background: 'linear-gradient(135deg, #0f172a, #1e293b)',
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 64,
					fontWeight: 700,
					color: '#f8fafc',
					padding: '0 80px',
					textAlign: 'center'
				}}
			>
				AI Invoice Generator
			</div>
		),
		size
	)
}
