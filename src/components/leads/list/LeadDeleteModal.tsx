import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteLeadMutation } from '../../../store/leads/leadsApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const LeadDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteLead, { isLoading }] = useDeleteLeadMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteLead(id).unwrap()
			showToast('Lead deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete lead. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete lead?'
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

export default LeadDeleteModal
