import { GroupsOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const EmployeesList = () => (
	<ComingSoon
		headerTitle='Employees'
		headerSubtitle='Team members, roles and quick access to profiles'
		icon={<GroupsOutlined />}
		title='Employee directory is on the way'
		description="A single place to browse the whole team — names, roles, contacts and quick actions. We're wiring it up to your workspace right now."
	/>
)

export default EmployeesList
