import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteAccountMutation } from '../../../store/accounts/accountsApi'
import { useToast } from '../../../context/toast/ToastContext'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const AccountDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteAccount, { isLoading }] = useDeleteAccountMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteAccount(id).unwrap()
			showToast('Account deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete account. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete account?'
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

export default AccountDeleteModal
