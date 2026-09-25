import { ShowChartOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const Finance = () => (
	<ComingSoon
		headerTitle='Finance'
		headerSubtitle='Cash flow, invoices and revenue insights'
		icon={<ShowChartOutlined />}
		title='Finance dashboard is on the way'
		description="Revenue trends, invoicing pipeline and cash flow — all in one place. We're polishing the numbers so you can trust every widget you see."
	/>
)

export default Finance
