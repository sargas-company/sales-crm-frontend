import { CancelOutlined } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
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
		<ConfirmModal
			icon={<CancelOutlined />}
			iconTone='danger'
			title='Cancel call?'
			description={
				<>
					Are you sure you want to cancel <strong>&quot;{title}&quot;</strong>? This action
					cannot be undone.
				</>
			}
			confirmLabel='Yes, cancel'
			confirmLoadingLabel='Cancelling…'
			confirmColor='error'
			cancelLabel='Keep call'
			onClose={onClose}
			onConfirm={handleCancel}
			isLoading={isLoading}
		/>
	)
}

export default ClientCallCancelModal
