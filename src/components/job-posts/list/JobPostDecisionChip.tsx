import type { JobPostDecision } from '../../../store/job-posts/types/definition'
import { Chip } from '../../../ui'

const decisionColor: Record<JobPostDecision, string> = {
	approve: 'success',
	maybe: 'warning',
	decline: 'error',
}

const decisionLabel: Record<JobPostDecision, string> = {
	approve: 'Approve',
	maybe: 'Maybe',
	decline: 'Decline',
}

const JobPostDecisionChip = ({ decision }: { decision: JobPostDecision | null }) => {
	if (!decision) return <span>—</span>
	return (
		<Chip
			label={decisionLabel[decision]}
			skin='light'
			size='small'
			color={decisionColor[decision]}
			styles={{ whiteSpace: 'nowrap', color: '#000000' }}
		/>
	)
}

export default JobPostDecisionChip
