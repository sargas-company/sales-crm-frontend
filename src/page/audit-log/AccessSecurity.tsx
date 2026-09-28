import { ShieldOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const AccessSecurity = () => (
	<ComingSoon
		headerTitle='Access & security'
		headerSubtitle='Authentication, roles and permission changes'
		icon={<ShieldOutlined />}
		title='Access & security log is on the way'
		description="Sign-ins, role assignments, permission grants and revocations — every access-side change in one place."
	/>
)

export default AccessSecurity
