import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import TrendPill from '../_shared/TrendPill'
import { emitPostDetail } from '../posts/JobPostDrawerBus'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetTechnologyCombinationsQuery } from '../../../store/sales-analytics/salesAnalyticsApi'

const TechnologyCombinations = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetTechnologyCombinationsQuery(filters)

	if (isLoading || !data)
		return (
			<SectionCard title='Technology combinations'>
				<SkeletonBlock height={200} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Technology combinations'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (data.length === 0)
		return (
			<SectionCard title='Technology combinations'>
				<EmptyState title='No meaningful combinations in this period' />
			</SectionCard>
		)

	return (
		<SectionCard
			title='Technology combinations'
			hint='Frequently co-occurring technology/direction pairs'
		>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
					gap: 12,
				}}
			>
				{data.map((c) => (
					<div
						key={c.pair.join('+')}
						style={{
							padding: 12,
							background: '#f8fafc',
							border: '1px solid #eef1f6',
							borderRadius: 6,
							display: 'flex',
							flexDirection: 'column',
							gap: 6,
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'baseline',
							}}
						>
							<div style={{ fontWeight: 700, color: '#0f172a' }}>
								{c.pair[0]} <span style={{ color: '#94a3b8' }}>+</span> {c.pair[1]}
							</div>
							<TrendPill value={c.trendPct} />
						</div>
						<div style={{ fontSize: 12.5, color: '#64748b' }}>
							{c.total} posts · {c.qualified} qualified · avg score {c.averageScore}
						</div>
						{c.representativePostIds.length > 0 && (
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
								{c.representativePostIds.map((id) => (
									<button
										key={id}
										type='button'
										onClick={() => emitPostDetail(id)}
										style={{
											background: '#ffffff',
											border: '1px solid #e2e8f0',
											borderRadius: 999,
											padding: '2px 8px',
											fontSize: 11,
											color: 'rgba(3, 105, 161, 1)',
											cursor: 'pointer',
										}}
										title='Open representative post'
									>
										{id}
									</button>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</SectionCard>
	)
}

export default TechnologyCombinations
