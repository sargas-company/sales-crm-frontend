import { AssessmentOutlined } from '@mui/icons-material'
import ComingSoon from '../../components/coming-soon/ComingSoon'

const ProjectsReports = () => (
	<ComingSoon
		headerTitle='Project Reports'
		headerSubtitle='Progress, budget and time tracking per project'
		icon={<AssessmentOutlined />}
		title='Project reports are on the way'
		description="Progress against milestones, budget burn, time tracking and team performance — rolled up per project so you always know where things stand."
	/>
)

export default ProjectsReports
