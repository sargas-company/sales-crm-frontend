import type { ClientRequestStatus } from '../../../store/clientRequests/types/definition'
import { Chip } from '../../../ui'

const statusColor: Record<ClientRequestStatus, string> = {
	on_review: 'warning',
	conversation_ongoing: 'info',
	archived: '#9E9E9E',
}

const statusLabel: Record<ClientRequestStatus, string> = {
	on_review: 'On Review',
	conversation_ongoing: 'Conversation Ongoing',
	archived: 'Archived',
}

const ClientRequestStatus = ({ status }: { status: ClientRequestStatus }) => (
	<Chip
		label={statusLabel[status]}
		skin='light'
		size='small'
		color={statusColor[status]}
		styles={{ whiteSpace: 'nowrap', color: '#000000' }}
	/>
)

export default ClientRequestStatus
