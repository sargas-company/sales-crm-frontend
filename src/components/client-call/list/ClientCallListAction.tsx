import { Link } from 'react-router-dom'
import Box from '../../box/Box'
import { IconButton } from '../../../ui'
import { CancelOutlined, VisibilityOutlined, EditCalendarOutlined } from '@mui/icons-material'

interface Props {
	clientCallId: string
	onDelete: (id: string) => void
}

const ClientCallListAction = ({ clientCallId, onDelete }: Props) => (
	<Box display='flex'>
		<IconButton
			varient='text'
			size={30}
			fontSize={21}
			contentOpacity={5}
			onClick={() => onDelete(clientCallId)}
		>
			<CancelOutlined />
		</IconButton>

		<Link to={`/client-calls/preview/${clientCallId}`}>
			<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
				<VisibilityOutlined />
			</IconButton>
		</Link>

		<Link to={`/client-calls/reschedule/${clientCallId}`}>
			<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
				<EditCalendarOutlined />
			</IconButton>
		</Link>
	</Box>
)

export default ClientCallListAction