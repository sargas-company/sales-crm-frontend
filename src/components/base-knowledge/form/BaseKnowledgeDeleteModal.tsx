import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteBaseKnowledgeMutation } from '../../../store/baseKnowledge/baseKnowledgeApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const BaseKnowledgeDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteBaseKnowledge, { isLoading }] = useDeleteBaseKnowledgeMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteBaseKnowledge(id).unwrap()
			showToast('Entry deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete entry. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete entry?'
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

export default BaseKnowledgeDeleteModal
