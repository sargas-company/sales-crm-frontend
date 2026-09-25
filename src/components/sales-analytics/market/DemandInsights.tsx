import { useState } from 'react'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import TrendPill from '../_shared/TrendPill'
import { emitPostDetail } from '../posts/JobPostDrawerBus'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetDemandInsightsQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import type { DemandInsightRow } from '../../../store/sales-analytics/types/aggregates'

const KIND_LABEL: Record<DemandInsightRow['kind'], string> = {
	goal: 'Goals',
	painPoint: 'Pain points',
	deliverable: 'Deliverables',
	requirement: 'Requirements',
	concern: 'Concerns',
	integration: 'Integrations',
}

const KIND_ORDER: DemandInsightRow['kind'][] = [
	'painPoint',
	'goal',
	'requirement',
	'integration',
	'deliverable',
	'concern',
]

const DemandInsights = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetDemandInsightsQuery(filters)
	const [activeKind, setActiveKind] = useState<DemandInsightRow['kind']>('painPoint')

	if (isLoading || !data)
		return (
			<SectionCard title='Demand insights'>
				<SkeletonBlock height={260} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Demand insights'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (data.rows.length === 0)
		return (
			<SectionCard title='Demand insights'>
				<EmptyState
					title='No recurring signals yet'
					description='Insights emerge once several posts share the same tag.'
				/>
			</SectionCard>
		)

	const shown = data.rows.filter((r) => r.kind === activeKind).slice(0, 12)

	return (
		<SectionCard title='Demand insights' hint='What clients keep asking for'>
			<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
				{KIND_ORDER.map((k) => (
					<button
						key={k}
						type='button'
						onClick={() => setActiveKind(k)}
						style={{
							background: k === activeKind ? 'rgba(3, 105, 161, 0.08)' : '#f8fafc',
							color: k === activeKind ? 'rgba(3, 105, 161, 1)' : '#64748b',
							border: `1px solid ${k === activeKind ? 'rgba(3, 105, 161, 0.16)' : '#eef1f6'}`,
							borderRadius: 999,
							fontSize: 12,
							fontWeight: 700,
							padding: '5px 12px',
							cursor: 'pointer',
						}}
						aria-pressed={k === activeKind}
					>
						{KIND_LABEL[k]}
					</button>
				))}
			</div>

			{shown.length === 0 ? (
				<EmptyState title='No signals for this category yet' />
			) : (
				<ul
					style={{
						listStyle: 'none',
						margin: 0,
						padding: 0,
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
					}}
				>
					{shown.map((r) => (
						<li
							key={`${r.kind}-${r.label}`}
							style={{
								padding: '10px 12px',
								background: '#f8fafc',
								border: '1px solid #eef1f6',
								borderRadius: 6,
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'baseline',
									gap: 10,
								}}
							>
								<div>
									<div style={{ fontWeight: 700, color: '#0f172a' }}>{r.label}</div>
									<div style={{ fontSize: 12, color: '#64748b' }}>
										{r.count} posts · {r.share}% of qualified
									</div>
								</div>
								<TrendPill value={r.trendPct} />
							</div>
							{(r.relatedDirections.length > 0 || r.relatedTechnologies.length > 0) && (
								<div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
									{r.relatedDirections.length > 0 && (
										<span style={{ color: '#7c3aed', marginRight: 8 }}>
											{r.relatedDirections.join(', ')}
										</span>
									)}
									{r.relatedTechnologies.length > 0 && (
										<span style={{ color: 'rgba(3, 105, 161, 1)' }}>
											{r.relatedTechnologies.join(', ')}
										</span>
									)}
								</div>
							)}
							<div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
								{r.representativePostIds.slice(0, 5).map((id) => (
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
										title='Open example'
									>
										{id}
									</button>
								))}
							</div>
						</li>
					))}
				</ul>
			)}
		</SectionCard>
	)
}

export default DemandInsights
