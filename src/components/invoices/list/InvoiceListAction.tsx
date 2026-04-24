import { Link } from 'react-router-dom'
import { DeleteOutline, EditOutlined, VisibilityOutlined } from '@mui/icons-material'
import Box from '../../box/Box'
import { IconButton } from '../../../ui'

interface Props {
	invoiceId: string
	onDelete: (id: string) => void
}

const InvoiceListAction = ({ invoiceId, onDelete }: Props) => (
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
