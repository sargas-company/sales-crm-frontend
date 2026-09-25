import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeletePlatformMutation } from '../../../store/platforms/platformsApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const PlatformDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deletePlatform, { isLoading }] = useDeletePlatformMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deletePlatform(id).unwrap()
			showToast('Platform deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete platform. Make sure no accounts are linked to it.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete platform?'
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

export default PlatformDeleteModal
