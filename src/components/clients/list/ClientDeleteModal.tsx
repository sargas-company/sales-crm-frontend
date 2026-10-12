import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteClientMutation } from '../../../store/clients/clientsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const ClientDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteClient, { isLoading }] = useDeleteClientMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteClient(id).unwrap()
			showToast('Client deleted', 'success')
			onSuccess()
			onClose()
		} catch (err) {
			// Backend refuses deletion when Projects still reference the
			// client — surface its message instead of a generic string.
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete client?'
			description={
				<>
					Are you sure you want to delete <strong>&quot;{title}&quot;</strong>?
					The server will refuse the delete if any Projects still reference
					this client. This action cannot be undone.
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

export default ClientDeleteModal
