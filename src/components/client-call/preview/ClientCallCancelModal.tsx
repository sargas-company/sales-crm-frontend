import { CancelOutlined } from '@mui/icons-material'
import Modal from '../../modal/Modal'
import ModalContentLayout from '../../users/layout/ModalContentLayout'
import Box from '../../box/Box'
import { Text, Button, Divider } from '../../../ui'
import { useUpdateClientCallMutation } from '../../../store/clientCalls/clientCallsApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const ClientCallCancelModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [updateClientCall, { isLoading }] = useUpdateClientCallMutation()
	const { showToast } = useToast()

	const handleCancel = async () => {
		try {
			await updateClientCall({ id, body: { status: 'cancelled' } }).unwrap()
			showToast('Client call cancelled', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to cancel client call. Please try again.', 'error')
		}
	}

	return (
		<Modal handleOutClick={onClose}>
			<ModalContentLayout maxWidth='440px'>
				<Box display='flex' flexDirection='column' align='center' space={2} padding={8}>
					<Box
						style={{
							width: 56,
							height: 56,
							borderRadius: '50%',
							background: 'rgba(235,87,87,0.12)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<CancelOutlined style={{ fontSize: 28, color: '#eb5757' }} />
					</Box>

					<Box display='flex' flexDirection='column' align='center' space={1}>
						<Text heading='h5' align='center'>
							Cancel call?
						</Text>
						<Text varient='body2' secondary align='center'>
							Are you sure you want to cancel <strong>"{title}"</strong>? This action cannot be
							undone.
						</Text>
					</Box>

					<Divider styles={{ width: '100%', margin: '0.5rem 0' }} />

					<Box display='flex' justify='center' space={2} style={{ width: '100%' }}>
						<Button varient='outlined' color='info' onClick={onClose} type='button'>
							Keep call
						</Button>
						<Button color='error' onClick={handleCancel} disabled={isLoading}>
							{isLoading ? 'Cancelling…' : 'Yes, cancel'}
						</Button>
					</Box>
				</Box>
			</ModalContentLayout>
		</Modal>
	)
}

export default ClientCallCancelModal
