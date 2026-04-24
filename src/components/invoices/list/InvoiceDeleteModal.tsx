import { DeleteOutline } from '@mui/icons-material'
import { Button, Divider, Text } from '../../../ui'
import { useToast } from '../../../context/toast/ToastContext'
import { useDeleteInvoiceMutation } from '../../../store/invoices/invoicesApi'
import Box from '../../box/Box'
import Modal from '../../modal/Modal'
import ModalContentLayout from '../../users/layout/ModalContentLayout'

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
		<Modal handleOutClick={onClose}>
			<ModalContentLayout maxWidth='440px'>
				<Box display='flex' flexDirection='column' align='center' space={2} padding={8}>
					<Box
						style={{
							width: 56,
							height: 56,
							borderRadius: '50%',
							background: 'rgba(255,76,76,0.12)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<DeleteOutline style={{ fontSize: 28, color: '#ff4c4c' }} />
					</Box>

					<Box display='flex' flexDirection='column' align='center' space={1}>
						<Text heading='h5' align='center'>
							Delete invoice?
						</Text>
						<Text varient='body2' secondary align='center'>
							Are you sure you want to delete <strong>"{title}"</strong>? This action cannot
							be undone.
						</Text>
					</Box>

					<Divider styles={{ width: '100%', margin: '0.5rem 0' }} />

					<Box display='flex' justify='center' space={2} style={{ width: '100%' }}>
						<Button varient='outlined' color='info' onClick={onClose} type='button'>
							Cancel
						</Button>
						<Button color='error' onClick={handleDelete} disabled={isLoading}>
							{isLoading ? 'Deleting…' : 'Delete'}
						</Button>
					</Box>
				</Box>
			</ModalContentLayout>
		</Modal>
	)
}

export default InvoiceDeleteModal
