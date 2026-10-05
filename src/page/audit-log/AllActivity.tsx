import { HistoryOutlined } from '@mui/icons-material'
import AuditActivityView from './_shared/AuditActivityView'

const AllActivity = () => (
	<AuditActivityView
		crumbs={[
			{ label: 'Governance' },
			{ label: 'Audit Log' },
			{ label: 'All activity', current: true },
		]}
		icon={<HistoryOutlined />}
		title='All activity'
		subtitle='Every important action across the platform — newest first.'
		category='all'
		showSummary
	/>
)

export default AllActivity
