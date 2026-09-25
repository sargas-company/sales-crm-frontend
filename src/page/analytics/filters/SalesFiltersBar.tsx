import { useState } from 'react'
import { CalendarTodayOutlined, TuneOutlined } from '@mui/icons-material'
import { useSalesFilters } from './useSalesFilters'
import MoreFiltersPanel from './MoreFiltersPanel'
import {
	FiltersBarWrap,
	MoreFiltersButton,
	MoreFiltersReveal,
	SegmentedControl,
} from './filters.styled'
import type { SalesDateRangeKey } from '../../../store/sales-analytics/types/filters'

const RANGE_OPTIONS: { key: SalesDateRangeKey; label: string }[] = [
	{ key: 'today', label: 'Today' },
	{ key: '7d', label: '7 days' },
	{ key: '30d', label: '30 days' },
]

const SalesFiltersBar = () => {
	const { filters, setDateRange, activeCount } = useSalesFilters()
	const [openMore, setOpenMore] = useState(false)

	return (
		<div>
			<FiltersBarWrap role='region' aria-label='Sales analytics filters'>
				<div className='filter-group'>
					<CalendarTodayOutlined className='filter-icon' />
					<SegmentedControl role='group' aria-label='Date range'>
						{RANGE_OPTIONS.map((opt) => {
							const active = filters.dateRange === opt.key
							return (
								<button
									key={opt.key}
									type='button'
									className={active ? 'active' : ''}
									aria-pressed={active}
									onClick={() => setDateRange(opt.key)}
								>
									{opt.label}
								</button>
							)
						})}
					</SegmentedControl>
				</div>

				<div className='filter-spacer' />

				<MoreFiltersButton
					type='button'
					aria-expanded={openMore}
					aria-controls='sales-more-filters'
					$active={activeCount > 0 || openMore}
					onClick={() => setOpenMore((v) => !v)}
				>
					<TuneOutlined style={{ fontSize: 16 }} />
					Filters
					{activeCount > 0 && <span className='count-pill'>{activeCount}</span>}
				</MoreFiltersButton>
			</FiltersBarWrap>

			{openMore && (
				<MoreFiltersReveal id='sales-more-filters'>
					<MoreFiltersPanel />
				</MoreFiltersReveal>
			)}
		</div>
	)
}

export default SalesFiltersBar
