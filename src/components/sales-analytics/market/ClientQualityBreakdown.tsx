import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import { SortableTable } from './sortableTable.styled'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetClientQualityBreakdownQuery } from '../../../store/sales-analytics/salesAnalyticsApi'

const ClientQualityBreakdown = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetClientQualityBreakdownQuery(filters)

	if (isLoading || !data)
		return (
			<SectionCard title='Client quality'>
				<SkeletonBlock height={280} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Client quality'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (data.rows.every((r) => r.total === 0))
		return (
			<SectionCard title='Client quality'>
				<EmptyState title='No client signal in this period' />
			</SectionCard>
		)

	return (
		<SectionCard title='Client quality' hint='Tier rules are transparent — see legend below'>
			<div style={{ overflowX: 'auto' }}>
				<SortableTable>
					<thead>
						<tr>
							<th>Tier</th>
							<th className='numeric'>Posts</th>
							<th className='numeric'>Qualified</th>
							<th className='numeric'>Qual %</th>
							<th className='numeric'>Avg score</th>
							<th className='numeric'>Avg budget</th>
							<th>Top countries</th>
							<th>Top directions</th>
						</tr>
					</thead>
					<tbody>
						{data.rows.map((r) => (
							<tr key={r.tier}>
								<td className='name' style={{ textTransform: 'capitalize' }}>
									{r.label}
								</td>
								<td className='numeric'>{r.total}</td>
								<td className='numeric'>{r.qualified}</td>
								<td className='numeric'>{r.total ? `${r.qualifiedRate}%` : '—'}</td>
								<td className='numeric'>{r.total ? r.averageScore : '—'}</td>
								<td className='numeric'>
									{r.averageBudget != null ? `$${r.averageBudget.toLocaleString()}` : '—'}
								</td>
								<td>
									{r.topCountries.length
										? r.topCountries.map((c) => `${c.country} (${c.count})`).join(', ')
										: '—'}
								</td>
								<td style={{ color: '#7c3aed' }}>{r.topDirections.join(', ') || '—'}</td>
							</tr>
						))}
					</tbody>
				</SortableTable>
			</div>

			<details
				style={{
					marginTop: 12,
					background: '#f8fafc',
					border: '1px solid #eef1f6',
					borderRadius: 10,
					padding: '10px 12px',
				}}
			>
				<summary
					style={{
						fontSize: 12,
						fontWeight: 700,
						color: '#475569',
						cursor: 'pointer',
					}}
				>
					How tiers are decided
				</summary>
				<ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 12.5, color: '#1f2937' }}>
					{data.tierRules.map((t) => (
						<li key={t.tier}>
							<strong style={{ textTransform: 'capitalize' }}>{t.label}:</strong> {t.rule}
						</li>
					))}
				</ul>
			</details>
		</SectionCard>
	)
}

export default ClientQualityBreakdown
