import type { CounterpartyType } from '../../../store/counterparties/counterpartiesApi'
import { Chip } from '../../../ui'

const counterpartyTypeColor: Record<CounterpartyType, string> = {
	client: '#2563EB',
	contractor: '#84CC16',
}

const counterpartyTypeLabel: Record<CounterpartyType, string> = {
	client: 'Client',
	contractor: 'Contractor',
}

const CounterpartyTypeChip = ({ type }: { type: CounterpartyType }) => (
	<Chip
		label={counterpartyTypeLabel[type]}
		skin='light'
		size='small'
		color={counterpartyTypeColor[type]}
		styles={{ whiteSpace: 'nowrap', color: '#000000' }}
	/>
)

export default CounterpartyTypeChip
