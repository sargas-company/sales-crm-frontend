import { PaidOutlined } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useToast } from '../../../context/toast/ToastContext'
import { useUpdateInvoiceMutation } from '../../../store/invoices/invoicesApi'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const InvoiceMarkPaidModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [updateInvoice, { isLoading }] = useUpdateInvoiceMutation()
	const { showToast } = useToast()

	const handleMarkPaid = async () => {
		try {
			await updateInvoice({ id, body: { status: 'paid' } }).unwrap()
			showToast('Invoice marked as paid', 'success')
			onSuccess()
			onClose()
		} catch {
			showToast('Failed to update invoice. Please try again.', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<PaidOutlined />}
			iconTone='primary'
			title='Mark as paid?'
			description={
				<>
					Are you sure you want to mark <strong>&quot;{title}&quot;</strong> as paid?
				</>
			}
			confirmLabel='Yes, mark as paid'
			confirmLoadingLabel='Updating…'
			confirmColor='primary'
			cancelLabel='No'
			onClose={onClose}
			onConfirm={handleMarkPaid}
			isLoading={isLoading}
		/>
	)
}

export default InvoiceMarkPaidModal
