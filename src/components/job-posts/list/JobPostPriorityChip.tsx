import type { JobPostPriority } from '../../../store/job-posts/types/definition'
import { Chip } from '../../../ui'

const priorityColor: Record<JobPostPriority, string> = {
	high: 'error',
	medium: 'warning',
	low: 'info',
}

const priorityLabel: Record<JobPostPriority, string> = {
	high: 'High',
	medium: 'Medium',
	low: 'Low',
}

const JobPostPriorityChip = ({ priority }: { priority: JobPostPriority | null }) => {
	if (!priority) return <span>—</span>
	return (
		<Chip
			label={priorityLabel[priority]}
			skin='light'
			size='small'
			color={priorityColor[priority]}
			styles={{ whiteSpace: 'nowrap', color: '#000000' }}
		/>
	)
}

export default JobPostPriorityChip
