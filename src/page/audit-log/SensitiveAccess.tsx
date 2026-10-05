import { LockOpenOutlined } from '@mui/icons-material'
import AuditActivityView from './_shared/AuditActivityView'

const SensitiveAccess = () => (
	<AuditActivityView
		crumbs={[
			{ label: 'Governance' },
			{ label: 'Audit Log' },
			{ label: 'Sensitive access', current: true },
		]}
		icon={<LockOpenOutlined />}
		title='Sensitive access'
		subtitle='Vault unlocks, secret reveals, attachments and MFA step-ups — stored forever.'
		category='sensitive'
	/>
)

export default SensitiveAccess
