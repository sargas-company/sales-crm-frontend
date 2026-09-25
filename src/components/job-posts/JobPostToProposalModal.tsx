import { RocketLaunchOutlined } from '@mui/icons-material'
import ConfirmModal from '../_shared/ConfirmModal'
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
		<ConfirmModal
			icon={<RocketLaunchOutlined />}
			iconTone='info'
			title='Start proposal?'
			description='This will create a new proposal draft based on the selected job post. You can edit and refine it before sending.'
			confirmLabel='Confirm'
			confirmLoadingLabel='Creating…'
			confirmColor='primary'
			onClose={onClose}
			onConfirm={handleConfirm}
			isLoading={isLoading}
		/>
	)
}

export default JobPostToProposalModal
