import { RocketLaunchOutlined } from '@mui/icons-material'
import Modal from '../modal/Modal'
import ModalContentLayout from '../users/layout/ModalContentLayout'
import Box from '../box/Box'
import { Text, Button, Divider } from '../../ui'
import { useConvertJobPostToProposalMutation } from '../../store/job-posts/jobPostsApi'
import { useToast } from '../../context/toast/ToastContext'

interface Props {
	id: string
	onClose: () => void
	onSuccess: () => void
}

const JobPostToProposalModal = ({ id, onClose, onSuccess }: Props) => {
	const [convert, { isLoading }] = useConvertJobPostToProposalMutation()
	const { showToast } = useToast()

	const handleConfirm = async () => {
		try {
			await convert(id).unwrap()
			showToast('Proposal created successfully', 'success')
			onSuccess()
			onClose()
		} catch (err: any) {
			const status = err?.status
			if (status === 409) {
				showToast('A proposal for this job post already exists', 'error')
			} else {
				showToast('Failed to create proposal. Please try again.', 'error')
			}
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
							background: 'rgba(33,150,243,0.12)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<RocketLaunchOutlined style={{ fontSize: 28, color: '#2196f3' }} />
					</Box>

					<Box display='flex' flexDirection='column' align='center' space={1}>
						<Text heading='h5' align='center'>
							Start Proposal
						</Text>
						<Text varient='body2' secondary align='center'>
							Are you sure you want to perform this action?
						</Text>
					</Box>

					<Divider styles={{ width: '100%', margin: '0.5rem 0' }} />

					<Box display='flex' justify='center' space={2} style={{ width: '100%' }}>
						<Button varient='outlined' color='info' onClick={onClose} type='button'>
							Cancel
						</Button>
						<Button onClick={handleConfirm} disabled={isLoading}>
							{isLoading ? 'Creating…' : 'Confirm'}
						</Button>
					</Box>
				</Box>
			</ModalContentLayout>
		</Modal>
	)
}

export default JobPostToProposalModal
