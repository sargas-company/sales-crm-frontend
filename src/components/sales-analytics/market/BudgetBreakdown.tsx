import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import { SortableTable } from './sortableTable.styled'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetBudgetBreakdownQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import type { BudgetBucketRow } from '../../../store/sales-analytics/types/aggregates'

const Table = ({
	rows,
	kind,
	unknown,
}: {
	rows: BudgetBucketRow[]
	kind: string
	unknown: number
}) => (
	<>
		<div
			style={{
				fontSize: 11,
				fontWeight: 700,
				color: '#64748b',
				textTransform: 'uppercase',
				letterSpacing: 0.4,
				marginBottom: 6,
			}}
		>
			{kind}
		</div>
		<div style={{ overflowX: 'auto' }}>
			<SortableTable>
				<thead>
					<tr>
						<th>Bucket</th>
						<th className='numeric'>Posts</th>
						<th className='numeric'>Qualified</th>
						<th className='numeric'>Qual %</th>
						<th className='numeric'>Avg score</th>
						<th>Top directions</th>
						<th>Top technologies</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr key={r.key}>
							<td className='name'>{r.label}</td>
							<td className='numeric'>{r.total}</td>
							<td className='numeric'>{r.qualified}</td>
							<td className='numeric'>{r.total ? `${r.qualifiedRate}%` : '—'}</td>
							<td className='numeric'>{r.total ? r.averageScore : '—'}</td>
							<td style={{ color: '#7c3aed' }}>{r.topDirections.join(', ') || '—'}</td>
							<td style={{ color: 'rgba(3, 105, 161, 1)' }}>
								{r.topTechnologies.join(', ') || '—'}
							</td>
						</tr>
					))}
					{unknown > 0 && (
						<tr>
							<td className='name'>Unknown budget</td>
							<td className='numeric'>{unknown}</td>
							<td className='numeric'>—</td>
							<td className='numeric'>—</td>
							<td className='numeric'>—</td>
							<td colSpan={2} style={{ color: '#94a3b8' }}>
								Missing budget field – excluded from averages
							</td>
						</tr>
					)}
				</tbody>
			</SortableTable>
		</div>
	</>
)

const BudgetBreakdown = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetBudgetBreakdownQuery(filters)

	if (isLoading || !data)
		return (
			<SectionCard title='Budgets & contract types'>
				<SkeletonBlock height={280} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Budgets & contract types'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	const empty =
		data.fixed.every((r) => r.total === 0) &&
		data.hourly.every((r) => r.total === 0) &&
		data.unknownFixed === 0 &&
		data.unknownHourly === 0
	if (empty)
		return (
			<SectionCard title='Budgets & contract types'>
				<EmptyState title='No budget signal in this period' />
			</SectionCard>
		)

	const { contractTypeSplit: s } = data
	return (
		<SectionCard
			title='Budgets & contract types'
			hint={`Fixed ${s.fixed} · Hourly ${s.hourly} · Unknown ${s.unknown}`}
		>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
					gap: 20,
				}}
			>
				<div>
					<Table rows={data.fixed} kind='Fixed price' unknown={data.unknownFixed} />
				</div>
				<div>
					<Table rows={data.hourly} kind='Hourly rate' unknown={data.unknownHourly} />
				</div>
			</div>
			<div style={{ marginTop: 8, fontSize: 11.5, color: '#94a3b8' }}>
				Fixed totals and hourly rates are shown separately – they are never averaged together.
			</div>
		</SectionCard>
	)
}

export default BudgetBreakdown
