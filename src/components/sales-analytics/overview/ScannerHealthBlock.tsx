import ScannerStatusCard from '../../../page/analytics/ScannerStatusCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import { useGetScannerHealthQuery } from '../../../store/sales-analytics/salesAnalyticsApi'

const ScannerHealthBlock = () => {
	// Scanner health is operational status, NOT analytics — always shows
	// "today" and last-hour figures regardless of the dashboard date filter.
	const { data, isLoading, isError, refetch } = useGetScannerHealthQuery({ period: 'today' })

	if (isLoading || !data) {
		return <SkeletonBlock height={280} radius={18} />
	}

	if (isError) {
		return (
			<ErrorState
				title='Scanner health unavailable'
				description='Could not load scanner status. Try again in a moment.'
				onRetry={() => refetch()}
			/>
		)
	}

	return <ScannerStatusCard data={data} />
}

export default ScannerHealthBlock
