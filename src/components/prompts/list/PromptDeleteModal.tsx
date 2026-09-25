import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeletePromptMutation } from '../../../store/prompts/promptsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const PromptDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deletePrompt, { isLoading }] = useDeletePromptMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deletePrompt(id).unwrap()
			showToast('Prompt deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete prompt?'
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

export default PromptDeleteModal
