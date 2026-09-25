import { useMemo, useState } from 'react'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import TrendPill from '../_shared/TrendPill'
import { SortableTable } from './sortableTable.styled'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetDirectionsBreakdownQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import type { DirectionRow } from '../../../store/sales-analytics/types/aggregates'

type SortKey =
	| keyof Pick<
			DirectionRow,
			'total' | 'qualified' | 'hot' | 'qualifiedRate' | 'averageScore' | 'averageBudget'
	  >
	| 'name'

const cols: { key: SortKey; label: string; numeric?: boolean }[] = [
	{ key: 'name', label: 'Direction' },
	{ key: 'total', label: 'Posts', numeric: true },
	{ key: 'qualified', label: 'Qualified', numeric: true },
	{ key: 'hot', label: 'Hot', numeric: true },
	{ key: 'qualifiedRate', label: 'Qual %', numeric: true },
	{ key: 'averageScore', label: 'Avg score', numeric: true },
	{ key: 'averageBudget', label: 'Avg budget', numeric: true },
]

const DirectionsBreakdown = () => {
	const { filters, setFilter } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetDirectionsBreakdownQuery(filters)
	const [sortKey, setSortKey] = useState<SortKey>('total')
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

	const sorted = useMemo(() => {
		if (!data) return []
		const copy = data.slice()
		copy.sort((a, b) => {
			const av = a[sortKey] ?? 0
			const bv = b[sortKey] ?? 0
			if (sortKey === 'name')
				return sortDir === 'asc'
					? String(av).localeCompare(String(bv))
					: String(bv).localeCompare(String(av))
			return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av)
		})
		return copy
	}, [data, sortKey, sortDir])

	if (isLoading || !data)
		return (
			<SectionCard title='Directions'>
				<SkeletonBlock height={280} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Directions'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (sorted.every((r) => r.total === 0))
		return (
			<SectionCard title='Directions'>
				<EmptyState title='No posts by direction' description='Try widening filters.' />
			</SectionCard>
		)

	const toggle = (k: SortKey) => {
		if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
		else {
			setSortKey(k)
			setSortDir(k === 'name' ? 'asc' : 'desc')
		}
	}

	const applyFilter = (name: string) => setFilter({ direction: [name] })

	return (
		<SectionCard
			title='Directions'
			hint='Business/service categories, distinct from technologies'
		>
			<div style={{ overflowX: 'auto' }}>
				<SortableTable>
					<thead>
						<tr>
							{cols.map((c) => (
								<th
									key={c.key}
									className={`sortable ${c.numeric ? 'numeric' : ''}`}
									onClick={() => toggle(c.key)}
									role='button'
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') toggle(c.key)
									}}
								>
									{c.label}
									<span className={`arrow ${sortKey === c.key ? 'active' : ''}`}>
										{sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
									</span>
								</th>
							))}
							<th className='numeric'>Trend</th>
						</tr>
					</thead>
					<tbody>
						{sorted.map((r) => (
							<tr key={r.slug}>
								<td>
									<button
										type='button'
										onClick={() => applyFilter(r.name)}
										style={{
											background: 'transparent',
											border: 'none',
											padding: 0,
											cursor: 'pointer',
											color: '#7c3aed',
											fontWeight: 600,
										}}
										title={`Filter by ${r.name}`}
									>
										{r.name}
									</button>
								</td>
								<td className='numeric'>{r.total}</td>
								<td className='numeric'>{r.qualified}</td>
								<td className='numeric'>{r.hot}</td>
								<td className='numeric'>{r.qualifiedRate}%</td>
								<td className='numeric'>{r.averageScore}</td>
								<td className='numeric'>
									{r.averageBudget != null ? `$${r.averageBudget.toLocaleString()}` : '—'}
								</td>
								<td className='numeric'>
									<TrendPill value={r.trendPct} />
								</td>
							</tr>
						))}
					</tbody>
				</SortableTable>
			</div>
		</SectionCard>
	)
}

export default DirectionsBreakdown
