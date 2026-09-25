import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteClientCallMutation } from '../../../store/clientCalls/clientCallsApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const ClientCallDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteClientCall, { isLoading }] = useDeleteClientCallMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteClientCall(id).unwrap()
			showToast('Client call deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete client call. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete client call?'
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

export default ClientCallDeleteModal
