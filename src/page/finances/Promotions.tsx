import { LocalOfferOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const FinancesPromotions = () => (
	<ComingSoon
		headerTitle='Promotions'
		headerSubtitle='Discounts, referral rewards and promo campaigns'
		icon={<LocalOfferOutlined />}
		title='Promotions module is on the way'
		description="Run discount codes, referral rewards and promo campaigns straight from the CRM — with performance tracking so you can see which offers actually drive revenue."
	/>
)

export default FinancesPromotions
