import { Chip } from '../../../ui'
import type { InvoiceStatus } from '../../../store/invoices/invoicesApi'

const statusColor: Record<InvoiceStatus, string> = {
	draft: 'warning',
	open: 'info',
	paid: 'success',
}

const statusLabel: Record<InvoiceStatus, string> = {
	draft: 'Draft',
	open: 'Open',
	paid: 'Paid',
}

interface Props {
	itemStatus?: InvoiceStatus
}

const InvoiceListItemStatus = ({ itemStatus = 'draft' }: Props) => (
	<Chip
		label={statusLabel[itemStatus]}
		skin='light'
		size='small'
		color={statusColor[itemStatus]}
		styles={{ color: '#000000' }}
	/>
)

export default InvoiceListItemStatus
