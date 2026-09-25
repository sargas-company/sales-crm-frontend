import { useGetEmergingOverviewQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import { EmergingGrid, StatusPill } from '../../../page/analytics/emerging.styled'
import { emitEmergingDetail } from './EmergingDetailBus'
import type { EmergingSignalRow } from '../../../store/sales-analytics/types/aggregates'

const Column = ({
	title,
	empty,
	items,
}: {
	title: string
	empty: string
	items: EmergingSignalRow[]
}) => (
	<div className='card'>
		<div className='card-title'>{title}</div>
		{items.length === 0 ? (
			<div className='card-empty'>{empty}</div>
		) : (
			items.map((r) => (
				<div className='item' key={r.id}>
					<button className='item-name' type='button' onClick={() => emitEmergingDetail(r.id)}>
						{r.name}
					</button>
					<span className='item-meta'>
						{r.postCount} posts · fit {r.sargasFit}
					</span>
				</div>
			))
		)}
	</div>
)

const EmergingSummary = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetEmergingOverviewQuery(filters)

	if (isLoading || !data)
		return (
			<SectionCard title='Emerging signals overview'>
				<SkeletonBlock height={220} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Emerging signals overview'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)

	return (
		<SectionCard
			title='Emerging signals overview'
			hint={`${data.total} tracked · not global market trends – dataset-relative`}
		>
			<EmergingGrid>
				<Column
					title='Top emerging (by Sargas fit)'
					empty='No candidates surfaced'
					items={data.topEmerging}
				/>
				<Column
					title='Growing technologies'
					empty='Nothing growing yet'
					items={data.growingTechnologies}
				/>
				<Column
					title='Growing directions'
					empty='Nothing growing yet'
					items={data.growingDirections}
				/>
				<Column
					title='New to our dataset'
					empty='No new entries recently'
					items={data.newToDataset}
				/>
				<Column
					title='Growing in our data'
					empty='No growth signal yet'
					items={data.growingInData}
				/>
			</EmergingGrid>
			{data.topEmerging[0] && (
				<div style={{ marginTop: 10 }}>
					<StatusPill $status={data.topEmerging[0].status}>
						status: {data.topEmerging[0].status}
					</StatusPill>
				</div>
			)}
		</SectionCard>
	)
}

export default EmergingSummary
