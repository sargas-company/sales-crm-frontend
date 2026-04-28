import { Link } from 'react-router-dom'
import { Tooltip } from '@mui/material'
import { TaskAltOutlined, CancelOutlined, VisibilityOutlined, EditCalendarOutlined } from '@mui/icons-material'
import Box from '../../box/Box'
import { IconButton } from '../../../ui'
import { useUpdateClientCallMutation } from '../../../store/clientCalls/clientCallsApi'
import type { ClientCallStatus } from '../../../store/clientCalls/types/definition'

interface Props {
	clientCallId: string
	status: ClientCallStatus
	onDelete: (id: string) => void
}

const ClientCallListAction = ({ clientCallId, status, onDelete }: Props) => {
	const [updateClientCall, { isLoading }] = useUpdateClientCallMutation()

	const handleComplete = () => {
		updateClientCall({ id: clientCallId, body: { status: 'completed' } })
	}

	return (
		<Box display='flex'>
			<Tooltip title='Mark as completed' placement='top'>
				<span>
					<IconButton
						varient='text'
						size={30}
						fontSize={21}
						contentOpacity={5}
						onClick={handleComplete}
						disabled={status === 'completed' || isLoading}
					>
						<TaskAltOutlined />
					</IconButton>
				</span>
			</Tooltip>

			<Tooltip title='Delete' placement='top'>
				<span>
					<IconButton
						varient='text'
						size={30}
						fontSize={21}
						contentOpacity={5}
						onClick={() => onDelete(clientCallId)}
					>
						<CancelOutlined />
					</IconButton>
				</span>
			</Tooltip>

			<Tooltip title='Preview' placement='top'>
				<span>
					<Link to={`/client-calls/preview/${clientCallId}`}>
						<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
							<VisibilityOutlined />
						</IconButton>
					</Link>
				</span>
			</Tooltip>

			<Tooltip title={status !== 'scheduled' ? 'Cannot reschedule' : 'Reschedule'} placement='top'>
				<span>
					{status === 'scheduled' ? (
						<Link to={`/client-calls/edit/${clientCallId}`}>
							<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
								<EditCalendarOutlined />
							</IconButton>
						</Link>
					) : (
						<IconButton varient='text' size={30} fontSize={21} contentOpacity={5} disabled>
							<EditCalendarOutlined />
						</IconButton>
					)}
				</span>
			</Tooltip>
		</Box>
	)
}

export default ClientCallListAction
