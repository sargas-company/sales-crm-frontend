import type { ClientCallClientType } from '../../../store/clientCalls/types/definition'
import { Chip } from '../../../ui'

const sourceColor: Record<ClientCallClientType, string> = {
	lead: 'warning',
	client_request: 'success',
}

const sourceLabel: Record<ClientCallClientType, string> = {
	lead: 'Lead',
	client_request: 'Client Request',
}

const ClientCallSourceChip = ({ clientType }: { clientType: ClientCallClientType }) => (
	<Chip
		label={sourceLabel[clientType]}
		skin='light'
		size='small'
		color={sourceColor[clientType]}
		styles={{ whiteSpace: 'nowrap', color: '#000000' }}
	/>
)

export default ClientCallSourceChip
