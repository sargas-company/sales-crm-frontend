import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteCounterpartyMutation } from '../../../store/counterparties/counterpartiesApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const CounterpartyDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteCounterparty, { isLoading }] = useDeleteCounterpartyMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteCounterparty(id).unwrap()
			showToast('Counterparty deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete counterparty. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete counterparty?'
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

export default CounterpartyDeleteModal
