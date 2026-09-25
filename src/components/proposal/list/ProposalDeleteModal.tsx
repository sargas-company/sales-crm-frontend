import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteProposalMutation } from '../../../store/proposals/proposalsApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const ProposalDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteProposal, { isLoading }] = useDeleteProposalMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteProposal(id).unwrap()
			showToast('Proposal deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete proposal. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete proposal?'
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

export default ProposalDeleteModal
