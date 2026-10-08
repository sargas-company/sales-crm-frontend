import { ApiLeadStatus } from '../../../store/leads/types/definition'
import { Chip } from '../../../ui'

const statusColor: Record<ApiLeadStatus, string> = {
	NEW: 'info',
	CONTACTED: '#9155FD',
	IN_CONVERSATION: 'warning',
	ON_HOLD: '#607D8B',
	WON: 'success',
	LOST: '#9E9E9E',
}

const statusLabel: Record<ApiLeadStatus, string> = {
	NEW: 'New',
	CONTACTED: 'Contacted',
	IN_CONVERSATION: 'In Conversation',
	ON_HOLD: 'On Hold',
	WON: 'Won',
	LOST: 'Lost',
}

const LeadListItemStatus = ({ itemStatus }: { itemStatus: ApiLeadStatus }) => (
	<Chip
		label={statusLabel[itemStatus]}
		skin='light'
		size='small'
		color={statusColor[itemStatus]}
		styles={{ whiteSpace: 'nowrap', color: '#000000' }}
	/>
)

export default LeadListItemStatus
