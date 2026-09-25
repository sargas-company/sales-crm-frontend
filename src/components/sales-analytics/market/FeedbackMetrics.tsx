import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetFeedbackMetricsQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import styled from 'styled-components'

const Metrics = styled('div')`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 10px;

	.m-tile {
		background: #f8fafc;
		border: 1px solid #eef1f6;
		border-radius: 10px;
		padding: 10px 12px;
	}
	.m-label {
		font-size: 10.5px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.m-value {
		font-size: 20px;
		font-weight: 700;
		color: #0f172a;
		margin-top: 2px;
	}
`

const FeedbackMetrics = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetFeedbackMetricsQuery(filters)

	if (isLoading || !data)
		return (
			<SectionCard title='User relevance feedback'>
				<SkeletonBlock height={120} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='User relevance feedback'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)

	return (
		<SectionCard
			title='User relevance feedback'
			hint='Not model accuracy — subjective user ratings'
		>
			<Metrics>
				<div className='m-tile'>
					<div className='m-label'>Feedback coverage</div>
					<div className='m-value'>{data.feedbackCoverage}%</div>
				</div>
				<div className='m-tile'>
					<div className='m-label'>Useful alert rate</div>
					<div className='m-value'>{data.usefulAlertRate}%</div>
				</div>
				<div className='m-tile'>
					<div className='m-label'>High-score false positives</div>
					<div className='m-value'>{data.highScoreFalsePositives}</div>
				</div>
				<div className='m-tile'>
					<div className='m-label'>Relevant below threshold</div>
					<div className='m-value'>{data.relevantBelowThreshold}</div>
				</div>
			</Metrics>
		</SectionCard>
	)
}

export default FeedbackMetrics
