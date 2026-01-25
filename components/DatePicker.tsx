'use client'

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface DatePickerProps {
	value: string
	onChange: (value: string) => void
	label: string
	placeholder?: string
}

const DatePicker: React.FC<DatePickerProps> = ({
	value,
	onChange,
	label,
	placeholder = 'Select date'
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const containerRef = useRef<HTMLDivElement>(null)

	// Helper to create a date object from YYYY-MM-DD string treating it as local date
	const parseLocalDate = (dateString: string) => {
		if (!dateString) return null
		const [year, month, day] = dateString.split('-').map(Number)
		return new Date(year, month - 1, day)
	}

	// Helper to format date as YYYY-MM-DD using local time
	const formatToLocalDate = (date: Date) => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	// Parse the value to Date or use current date
	const selectedDate = value ? parseLocalDate(value) : null

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Format date for display
	const formatDate = (date: Date | null) => {
		if (!date) return ''
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}
		return date.toLocaleDateString('en-US', options)
	}

	// Get days in month
	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear()
		const month = date.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const daysInMonth = lastDay.getDate()
		const startingDayOfWeek = firstDay.getDay()

		const days: (number | null)[] = []

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < startingDayOfWeek; i++) {
			days.push(null)
		}

		// Add all days of the month
		for (let i = 1; i <= daysInMonth; i++) {
			days.push(i)
		}

		return days
	}

	const handleDateSelect = (day: number) => {
		const year = currentMonth.getFullYear()
		const month = currentMonth.getMonth()
		const date = new Date(year, month, day)
		const formattedDate = formatToLocalDate(date)
		onChange(formattedDate)
		setIsOpen(false)
	}

	const handlePrevMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
		)
	}

	const handleNextMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
		)
	}

	const handleToday = () => {
		const today = new Date()
		const formattedDate = formatToLocalDate(today)
		onChange(formattedDate)
		setIsOpen(false)
	}

	const isToday = (day: number) => {
		const today = new Date()
		return (
			day === today.getDate() &&
			currentMonth.getMonth() === today.getMonth() &&
			currentMonth.getFullYear() === today.getFullYear()
		)
	}

	const isSelected = (day: number) => {
		if (!selectedDate) return false
		return (
			day === selectedDate.getDate() &&
			currentMonth.getMonth() === selectedDate.getMonth() &&
			currentMonth.getFullYear() === selectedDate.getFullYear()
		)
	}

	const days = getDaysInMonth(currentMonth)
	const monthYear = currentMonth.toLocaleDateString('en-US', {
		month: 'long',
		year: 'numeric'
	})

	return (
		<div
			ref={containerRef}
			className='relative'
		>
			<label className='block text-xs font-medium text-gray-600 mb-1'>
				<Calendar className='w-3 h-3 inline mr-1' />
				{label}
			</label>

			{/* Input Field */}
			<button
				type='button'
				onClick={() => setIsOpen(!isOpen)}
				className='w-full input-field cursor-pointer transition-all duration-200 
					hover:border-indigo-300 hover:shadow-sm
					focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
					text-left flex items-center justify-between'
			>
				<span className={value ? 'text-gray-800' : 'text-gray-400'}>
					{value ? formatDate(selectedDate) : placeholder}
				</span>
				<Calendar
					className={`w-4 h-4 transition-colors ${
						isOpen ? 'text-indigo-500' : 'text-gray-400'
					}`}
				/>
			</button>

			{/* Calendar Dropdown */}
			{isOpen && (
				<div className='absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 w-80 animate-fade-in'>
					{/* Header */}
					<div className='flex items-center justify-between mb-4'>
						<button
							type='button'
							onClick={handlePrevMonth}
							className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
						>
							<ChevronLeft className='w-5 h-5 text-gray-600' />
						</button>
						<h3 className='font-semibold text-gray-800'>{monthYear}</h3>
						<button
							type='button'
							onClick={handleNextMonth}
							className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
						>
							<ChevronRight className='w-5 h-5 text-gray-600' />
						</button>
					</div>

					{/* Weekday Headers */}
					<div className='grid grid-cols-7 gap-1 mb-2'>
						{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
							<div
								key={day}
								className='text-center text-xs font-medium text-gray-500 py-2'
							>
								{day}
							</div>
						))}
					</div>

					{/* Calendar Days */}
					<div className='grid grid-cols-7 gap-1'>
						{days.map((day, index) => (
							<div
								key={index}
								className='aspect-square'
							>
								{day ? (
									<button
										type='button'
										onClick={() => handleDateSelect(day)}
										className={`
											w-full h-full rounded-lg text-sm font-medium transition-all duration-200
											${
												isSelected(day)
													? 'bg-linear-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md scale-105'
													: isToday(day)
														? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200'
														: 'text-gray-700 hover:bg-gray-100'
											}
										`}
									>
										{day}
									</button>
								) : (
									<div />
								)}
							</div>
						))}
					</div>

					{/* Footer */}
					<div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200'>
						<button
							type='button'
							onClick={handleToday}
							className='text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors'
						>
							Today
						</button>
						<button
							type='button'
							onClick={() => setIsOpen(false)}
							className='text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors'
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export default DatePicker
