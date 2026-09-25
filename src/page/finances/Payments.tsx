import { PaymentOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const FinancesPayments = () => (
	<ComingSoon
		headerTitle='Payments'
		headerSubtitle='Incoming and outgoing payments across every counterparty'
		icon={<PaymentOutlined />}
		title='Payments ledger is on the way'
		description="A unified ledger for every payment in and out of the business — filtered by client, platform, currency and status, with reconciliation tools built in."
	/>
)

export default FinancesPayments
