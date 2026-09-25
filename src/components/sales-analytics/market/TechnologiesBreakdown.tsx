import { useMemo, useState } from 'react'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import TrendPill from '../_shared/TrendPill'
import { SortableTable } from './sortableTable.styled'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetTechnologiesBreakdownQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import type { TechnologyRow } from '../../../store/sales-analytics/types/aggregates'

type SortKey =
	| keyof Pick<
			TechnologyRow,
			| 'mentions'
			| 'total'
			| 'qualified'
			| 'hot'
			| 'qualifiedRate'
			| 'averageScore'
			| 'averageBudget'
	  >
	| 'name'

const cols: { key: SortKey; label: string; numeric?: boolean }[] = [
	{ key: 'name', label: 'Technology' },
	{ key: 'mentions', label: 'Mentions', numeric: true },
	{ key: 'total', label: 'Unique posts', numeric: true },
	{ key: 'qualified', label: 'Qualified', numeric: true },
	{ key: 'hot', label: 'Hot', numeric: true },
	{ key: 'qualifiedRate', label: 'Qual %', numeric: true },
	{ key: 'averageScore', label: 'Avg score', numeric: true },
	{ key: 'averageBudget', label: 'Avg budget', numeric: true },
]

const TechnologiesBreakdown = () => {
	const { filters, setFilter } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetTechnologiesBreakdownQuery(filters)
	const [sortKey, setSortKey] = useState<SortKey>('mentions')
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
			<SectionCard title='Technologies'>
				<SkeletonBlock height={280} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Technologies'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (sorted.every((r) => r.total === 0))
		return (
			<SectionCard title='Technologies'>
				<EmptyState title='No technologies matched by canonical taxonomy' />
			</SectionCard>
		)

	const toggle = (k: SortKey) => {
		if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
		else {
			setSortKey(k)
			setSortDir(k === 'name' ? 'asc' : 'desc')
		}
	}

	return (
		<SectionCard title='Technologies' hint='Concrete tools, frameworks, databases, providers'>
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
										onClick={() => setFilter({ technology: [r.name] })}
										style={{
											background: 'transparent',
											border: 'none',
											padding: 0,
											cursor: 'pointer',
											color: 'rgba(3, 105, 161, 1)',
											fontWeight: 600,
										}}
										title={`Filter by ${r.name}`}
									>
										{r.name}
									</button>
								</td>
								<td className='numeric'>{r.mentions}</td>
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

export default TechnologiesBreakdown
