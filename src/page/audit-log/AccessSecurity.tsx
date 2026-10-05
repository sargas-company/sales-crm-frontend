import { ShieldOutlined } from '@mui/icons-material'
import AuditActivityView from './_shared/AuditActivityView'

const AccessSecurity = () => (
	<AuditActivityView
		crumbs={[
			{ label: 'Governance' },
			{ label: 'Audit Log' },
			{ label: 'Access & security', current: true },
		]}
		icon={<ShieldOutlined />}
		title='Access & security'
		subtitle='Login attempts, role changes, access denials — everything that touches who can do what.'
		category='access'
	/>
)

export default AccessSecurity
