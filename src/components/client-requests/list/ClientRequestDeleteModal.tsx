import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteClientRequestMutation } from '../../../store/clientRequests/clientRequestsApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const ClientRequestDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteClientRequest, { isLoading }] = useDeleteClientRequestMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteClientRequest(id).unwrap()
			showToast('Client request deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete client request. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete client request?'
			description={
				<>
					Are you sure you want to delete <strong>&quot;{title}&quot;</strong>? This action
					cannot be undone.
				</>
			}
			confirmLabel='Delete'
			confirmLoadingLabel='Deleting…'
			confirmColor='error'
			onClose={onClose}
			onConfirm={handleDelete}
			isLoading={isLoading}
		/>
	)
}

export default ClientRequestDeleteModal
