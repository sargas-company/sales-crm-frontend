import { LockOpenOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const SensitiveAccess = () => (
	<ComingSoon
		headerTitle='Sensitive access'
		headerSubtitle='Credentials, financial and protected-data access'
		icon={<LockOpenOutlined />}
		title='Sensitive access log is on the way'
		description="Every reveal, download or read of credentials, finance and other restricted data — with the actor, target and reason."
	/>
)

export default SensitiveAccess
