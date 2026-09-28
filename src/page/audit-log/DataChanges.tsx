import { ChangeHistoryOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const DataChanges = () => (
	<ComingSoon
		headerTitle='Data changes'
		headerSubtitle='Create, update and delete operations'
		icon={<ChangeHistoryOutlined />}
		title='Data changes log is on the way'
		description="Track every business-record mutation with before / after context, filtered by module and actor."
	/>
)

export default DataChanges
