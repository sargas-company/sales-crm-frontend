import { VpnKeyOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const EmployeesCredentials = () => (
	<ComingSoon
		headerTitle='Credentials'
		headerSubtitle='Encrypted storage for accounts, passwords and access keys'
		icon={<VpnKeyOutlined />}
		title='Credentials vault is on the way'
		description="A secure, encrypted vault for every account, API key and password your team relies on — with per-employee access and audit trails."
	/>
)

export default EmployeesCredentials
