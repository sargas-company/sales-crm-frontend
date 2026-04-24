import { Link } from 'react-router-dom'
import { DeleteOutline, EditOutlined, PaidOutlined, VisibilityOutlined } from '@mui/icons-material'
import Box from '../../box/Box'
import { IconButton } from '../../../ui'
import type { InvoiceStatus } from '../../../store/invoices/invoicesApi'

interface Props {
	invoiceId: string
	status?: InvoiceStatus
	onDelete: (id: string) => void
	onMarkPaid: (id: string) => void
}

const InvoiceListAction = ({ invoiceId, status, onDelete, onMarkPaid }: Props) => (
	<Box display='flex'>
		<IconButton
			varient='text'
			size={30}
			fontSize={21}
			contentOpacity={5}
			onClick={() => onDelete(invoiceId)}
		>
			<DeleteOutline />
		</IconButton>
		<IconButton
			varient='text'
			size={30}
			fontSize={21}
			contentOpacity={status === 'paid' ? 3 : 5}
			disabled={status === 'paid'}
			onClick={() => onMarkPaid(invoiceId)}
		>
			<PaidOutlined />
		</IconButton>
		<Link to={`/invoices/preview/${invoiceId}`}>
			<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
				<VisibilityOutlined />
			</IconButton>
		</Link>
		<Link to={`/invoices/edit/${invoiceId}`}>
			<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
				<EditOutlined />
			</IconButton>
		</Link>
	</Box>
)

export default InvoiceListAction
