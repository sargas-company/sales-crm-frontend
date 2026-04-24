import { PaidOutlined } from '@mui/icons-material'
import { Button, Divider, Text } from '../../../ui'
import { useToast } from '../../../context/toast/ToastContext'
import { useUpdateInvoiceMutation } from '../../../store/invoices/invoicesApi'
import Box from '../../box/Box'
import Modal from '../../modal/Modal'
import ModalContentLayout from '../../users/layout/ModalContentLayout'

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
		<Modal handleOutClick={onClose}>
			<ModalContentLayout maxWidth='440px'>
				<Box display='flex' flexDirection='column' align='center' space={2} padding={8}>
					<Box
						style={{
							width: 56,
							height: 56,
							borderRadius: '50%',
							background: 'rgba(52,168,83,0.12)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<PaidOutlined style={{ fontSize: 28, color: 'rgb(52, 168, 83)' }} />
					</Box>

					<Box display='flex' flexDirection='column' align='center' space={1}>
						<Text heading='h5' align='center'>
							Mark as paid?
						</Text>
						<Text varient='body2' secondary align='center'>
							Are you sure you want to mark <strong>"{title}"</strong> as paid?
						</Text>
					</Box>

					<Divider styles={{ width: '100%', margin: '0.5rem 0' }} />

					<Box display='flex' justify='center' space={2} style={{ width: '100%' }}>
						<Button varient='outlined' color='info' onClick={onClose} type='button'>
							No
						</Button>
						<Button color='success' onClick={handleMarkPaid} disabled={isLoading}>
							{isLoading ? 'Updating…' : 'Yes, mark as paid'}
						</Button>
					</Box>
				</Box>
			</ModalContentLayout>
		</Modal>
	)
}

export default InvoiceMarkPaidModal
