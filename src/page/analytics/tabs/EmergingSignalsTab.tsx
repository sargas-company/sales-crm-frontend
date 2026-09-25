import EmergingSummary from '../../../components/sales-analytics/emerging/EmergingSummary'
import EmergingSignalsTable from '../../../components/sales-analytics/emerging/EmergingSignalsTable'
import EmergingAlertConfig from '../../../components/sales-analytics/emerging/EmergingAlertConfig'
import ResetMockStateButton from '../../../components/sales-analytics/emerging/ResetMockStateButton'
import { TabPanel } from '../salesAnalytics.styled'

const EmergingSignalsTab = () => (
	<TabPanel>
		<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
			<ResetMockStateButton />
		</div>
		<EmergingSummary />
		<EmergingSignalsTable />
		<EmergingAlertConfig />
	</TabPanel>
)

export default EmergingSignalsTab
