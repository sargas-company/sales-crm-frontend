import type { ClientCallStatus } from '../../../store/clientCalls/types/definition'
import { Chip } from '../../../ui'

const statusColor: Record<ClientCallStatus, string> = {
	scheduled: 'info',
	completed: 'success',
	cancelled: 'error',
}

const statusLabel: Record<ClientCallStatus, string> = {
	scheduled: 'Scheduled',
	completed: 'Completed',
	cancelled: 'Cancelled',
}

const ClientCallStatusChip = ({ status }: { status: ClientCallStatus }) => (
	<Chip
		label={statusLabel[status]}
		skin='light'
		size='small'
		color={statusColor[status]}
		styles={{ whiteSpace: 'nowrap', color: '#000000' }}
	/>
)

export default ClientCallStatusChip
