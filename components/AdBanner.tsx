import React from 'react'

interface AdBannerProps {
	position: 'top' | 'sidebar'
}

const AdBanner: React.FC<AdBannerProps> = ({ position }) => {
	const dimensions = position === 'top' ? 'h-24 w-full' : 'h-64 w-full'

	return (
		<div
			className={`adsense-placeholder ${dimensions}`}
			data-ad-slot={position}
		>
			<div className='flex flex-col items-center gap-1'>
				<svg
					className='w-6 h-6 opacity-50'
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={1.5}
						d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
					/>
				</svg>
			</div>
		</div>
	)
}

export default AdBanner
