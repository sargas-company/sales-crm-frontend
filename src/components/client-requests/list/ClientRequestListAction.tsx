import { Link } from 'react-router-dom'
import { DeleteOutline, VisibilityOutlined, EditOutlined } from '@mui/icons-material'
import Box from '../../box/Box'
import { IconButton } from '../../../ui'

const ClientRequestListAction = ({
	id,
	onDelete,
}: {
	id: string
	onDelete: (id: string) => void
}) => (
	<Box display='flex'>
		<IconButton
			varient='text'
			size={30}
			fontSize={21}
			contentOpacity={5}
			onClick={() => onDelete(id)}
		>
			<DeleteOutline />
		</IconButton>
		<Link to={`/client-requests/preview/${id}`}>
			<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
				<VisibilityOutlined />
			</IconButton>
		</Link>
		<Link to={`/client-requests/edit/${id}`}>
			<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
				<EditOutlined />
			</IconButton>
		</Link>
	</Box>
)

export default ClientRequestListAction
