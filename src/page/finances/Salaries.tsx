import { AttachMoneyOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const FinancesSalaries = () => (
	<ComingSoon
		headerTitle='Salaries'
		headerSubtitle='Salary schedule, bonuses and payroll history'
		icon={<AttachMoneyOutlined />}
		title='Salaries module is on the way'
		description="Manage salary schedules, bonuses and payroll history for the whole team — with automatic reminders and a full payment log per employee."
	/>
)

export default FinancesSalaries
