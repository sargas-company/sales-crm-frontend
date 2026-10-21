import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeletePositionMutation } from '../../../store/positions/positionsApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const PositionDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deletePosition, { isLoading }] = useDeletePositionMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deletePosition(id).unwrap()
			showToast('Position deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete position', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete position?'
			description={
				<>
					Are you sure you want to delete <strong>&quot;{title}&quot;</strong>? Employees
					that currently reference this position by name will keep the label but it will
					stop appearing in the pick list.
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

export default PositionDeleteModal
