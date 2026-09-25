import { useGetSalesOverviewQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import {
	KpiCell,
	KpiHeader,
	KpiPanel,
	KpiStrip,
} from '../../../page/analytics/kpi.styled'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import type { SalesDateRangeKey } from '../../../store/sales-analytics/types/filters'

const PERIOD_LABEL: Record<SalesDateRangeKey, string> = {
	today: 'Today',
	'7d': 'Last 7 days',
	'30d': 'Last 30 days',
	custom: 'Custom period',
}

const KpiSummary = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetSalesOverviewQuery(filters)

	if (isLoading || !data) {
		return <SkeletonBlock height={168} radius={18} />
	}
	if (isError) {
		return (
			<ErrorState
				title='KPI summary unavailable'
				description='Could not load period KPIs.'
				onRetry={() => refetch()}
			/>
		)
	}

	const received = data.received.current
	const qualified = data.qualified.current
	const hot = data.hot.current
	const qualifiedRate = data.qualifiedRate.current
	const avgScore = data.averageScore.current

	const qRate = received > 0 ? Math.round((qualified / received) * 100) : 0
	const hRate = received > 0 ? Math.round((hot / received) * 100) : 0

	return (
		<KpiPanel>
			<KpiHeader>
				<span className='kpi-kicker'>At a glance</span>
				<span className='kpi-period'>
					<span className='kpi-period-dot' aria-hidden='true' />
					{PERIOD_LABEL[filters.dateRange]}
				</span>
			</KpiHeader>

			<KpiStrip>
				<KpiCell>
					<div className='kpi-label'>Received</div>
					<div className='kpi-value'>{received.toLocaleString()}</div>
					<div className='kpi-caption'>posts in period</div>
				</KpiCell>

				<KpiCell>
					<div className='kpi-label'>Qualified 50+</div>
					<div className='kpi-value'>{qualified.toLocaleString()}</div>
					<div className='kpi-caption'>{qRate}% of received</div>
				</KpiCell>

				<KpiCell>
					<div className='kpi-label'>Hot 75+</div>
					<div className='kpi-value'>{hot.toLocaleString()}</div>
					<div className='kpi-caption'>{hRate}% of received</div>
				</KpiCell>

				<KpiCell>
					<div className='kpi-label'>Qualified rate</div>
					<div className='kpi-value'>
						{qualifiedRate}
						<span className='kpi-suffix'>%</span>
					</div>
					<div className='kpi-caption'>quality of intake</div>
				</KpiCell>

				<KpiCell>
					<div className='kpi-label'>Average score</div>
					<div className='kpi-value'>{avgScore}</div>
					<div className='kpi-caption'>mean across period</div>
				</KpiCell>
			</KpiStrip>
		</KpiPanel>
	)
}

export default KpiSummary
