import { ChangeHistoryOutlined } from '@mui/icons-material'
import AuditActivityView from './_shared/AuditActivityView'

const DataChanges = () => (
	<AuditActivityView
		crumbs={[
			{ label: 'Governance' },
			{ label: 'Audit Log' },
			{ label: 'Data changes', current: true },
		]}
		icon={<ChangeHistoryOutlined />}
		title='Data changes'
		subtitle='Operational edits across settings, employees, projects and the rest of the data layer.'
		category='data'
	/>
)

export default DataChanges
