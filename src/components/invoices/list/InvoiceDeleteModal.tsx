import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useToast } from '../../../context/toast/ToastContext'
import { useDeleteInvoiceMutation } from '../../../store/invoices/invoicesApi'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const InvoiceDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteInvoice, { isLoading }] = useDeleteInvoiceMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteInvoice(id).unwrap()
			showToast('Invoice deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to delete invoice. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete invoice?'
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

export default InvoiceDeleteModal
