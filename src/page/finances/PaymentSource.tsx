import { AccountBalanceWalletOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const FinancesPaymentSource = () => (
	<ComingSoon
		headerTitle='Payment Source'
		headerSubtitle='Bank accounts, wallets and cards used across the business'
		icon={<AccountBalanceWalletOutlined />}
		title='Payment sources are on the way'
		description="Register every bank account, crypto wallet and card you use to send and receive funds — with balances, currencies and per-source transaction history."
	/>
)

export default FinancesPaymentSource
