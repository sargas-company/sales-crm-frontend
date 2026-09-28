import { HistoryOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const AllActivity = () => (
	<ComingSoon
		headerTitle='All activity'
		headerSubtitle='Chronological history of application activity'
		icon={<HistoryOutlined />}
		title='All activity is on the way'
		description="Every logged event across the app, ordered from newest to oldest, ready to filter and drill into."
	/>
)

export default AllActivity
