import { FolderOpenOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const ProjectsList = () => (
	<ComingSoon
		headerTitle='Projects'
		headerSubtitle='Every project with statuses, deadlines and owners'
		icon={<FolderOpenOutlined />}
		title='Projects list is on the way'
		description="Track every project you're running with clear statuses, deadlines, budgets and the people responsible — all in one board."
	/>
)

export default ProjectsList
