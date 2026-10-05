import { useLayoutEffect, useRef, useState } from 'react'
import { CalendarTodayOutlined, TuneOutlined } from '@mui/icons-material'
import { useSalesFilters } from './useSalesFilters'
import {
	FiltersBarWrap,
	MoreFiltersButton,
	TapeIndicator,
	TapePill,
	TapePills,
} from './filters.styled'
import type { SalesDateRangeKey } from '../../../store/sales-analytics/types/filters'

const RANGE_OPTIONS: { value: SalesDateRangeKey; label: string }[] = [
	{ value: 'today', label: 'Today' },
	{ value: '7d', label: '7 days' },
	{ value: '30d', label: '30 days' },
]

const SalesFiltersBar = () => {
	const { filters, setDateRange, activeCount } = useSalesFilters()
	const activeLabel =
		RANGE_OPTIONS.find((o) => o.value === filters.dateRange)?.label ?? '—'

	// Sliding indicator — same pattern as AnimatedSegmented, measures
	// the active button on layout and transforms the orange tape pill
	// to its position with a spring ease.
	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{ left: number; width: number; opacity: number }>({
		left: 0,
		width: 0,
		opacity: 0,
	})
	useLayoutEffect(() => {
		if (!pillsRef.current) return
		const el = pillsRef.current.querySelector<HTMLButtonElement>(
			'[data-active="true"]',
		)
		if (el) {
			setInd({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
		}
	}, [filters.dateRange])

	return (
		<FiltersBarWrap
			role='region'
			aria-label='Sales analytics filters'
		>
			<div className='filter-lead'>
				<span className='lead-icon'>
					<CalendarTodayOutlined />
				</span>
				<div className='lead-text'>
					<span className='top'>Range</span>
					<span className='bot'>{activeLabel}</span>
				</div>
			</div>

			<TapePills ref={pillsRef} role='tablist' aria-label='Date range'>
				<TapeIndicator
					style={{
						transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
						width: `${ind.width}px`,
						opacity: ind.opacity,
					}}
				/>
				{RANGE_OPTIONS.map((opt) => (
					<TapePill
						key={opt.value}
						type='button'
						role='tab'
						data-active={filters.dateRange === opt.value || undefined}
						aria-selected={filters.dateRange === opt.value}
						$active={filters.dateRange === opt.value}
						onClick={() => setDateRange(opt.value)}
					>
						{opt.label}
					</TapePill>
				))}
			</TapePills>

			<div className='filter-spacer' />

			<div className='upwork-hint' aria-hidden='true'>
				<span className='row'>
					<span className='w'>hunting</span>
					<span className='amber-wrap'>
						<span className='a'>upwork</span>
						<svg
							className='squiggle'
							viewBox='0 0 120 12'
							width='120'
							height='12'
							preserveAspectRatio='none'
						>
							<path
								d='M2 8 Q 12 2, 22 8 T 42 8 T 62 8 T 82 8 T 102 8 T 118 8'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.2'
								strokeLinecap='round'
							/>
						</svg>
					</span>
					<span className='w'>signals</span>
				</span>
				<span className='stars'>
					<svg className='s' width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
						<path d='M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.9l-6.2 4.4 2.4-7.4L2 9.4h7.6z' />
					</svg>
				</span>
			</div>

			<div className='filter-spacer' />

			<MoreFiltersButton
				type='button'
				$active={activeCount > 0}
				aria-label='Filters (coming soon)'
			>
				<TuneOutlined className='tune-icon' style={{ fontSize: 16 }} />
				Filters
				{activeCount > 0 && <span className='count-pill'>{activeCount}</span>}
			</MoreFiltersButton>
		</FiltersBarWrap>
	)
}

export default SalesFiltersBar
