import { AccountBalanceOutlined } from '@mui/icons-material'
import AuditActivityView from './_shared/AuditActivityView'

const FinancialActivity = () => (
	<AuditActivityView
		crumbs={[
			{ label: 'Governance' },
			{ label: 'Audit Log' },
			{ label: 'Financial activity', current: true },
		]}
		icon={<AccountBalanceOutlined />}
		title='Financial activity'
		subtitle='Invoices, payroll, salary reviews, payment sources — every money-touching change.'
		category='financial'
	/>
)

export default FinancialActivity
