import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../../_shared/ConfirmModal'
import { useDeleteJobPostMutation } from '../../../store/job-posts/jobPostsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

interface Props {
	id: string
	title: string
	onClose: () => void
	onSuccess: () => void
}

const JobPostDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
	const [deleteJobPost, { isLoading }] = useDeleteJobPostMutation()
	const { showToast } = useToast()

	const handleDelete = async () => {
		try {
			await deleteJobPost(id).unwrap()
			showToast('Job post deleted successfully', 'success')
			onSuccess()
			onClose()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<DeleteOutline />}
			iconTone='danger'
			title='Delete job post?'
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

export default JobPostDeleteModal
