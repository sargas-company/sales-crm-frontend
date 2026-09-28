import { DeleteOutline } from '@mui/icons-material'
import ConfirmModal from '../_shared/ConfirmModal'
import type { Role } from '../../store/roles/types'

interface Props {
	role: Role
	isBusy: boolean
	onCancel: () => void
	onConfirm: () => void
}

const RoleDeleteDialog = ({ role, isBusy, onCancel, onConfirm }: Props) => (
	<ConfirmModal
		icon={<DeleteOutline />}
		iconTone='danger'
		title={`Delete role "${role.label}"?`}
		description={
			<>
				The role <strong>&quot;{role.label}&quot;</strong> cannot be restored. Reassign every
				user off this role before deleting.
			</>
		}
		confirmLabel='Yes, delete role'
		confirmLoadingLabel='Deleting…'
		confirmColor='error'
		cancelLabel='Cancel'
		onClose={onCancel}
		onConfirm={onConfirm}
		isLoading={isBusy}
	/>
)

export default RoleDeleteDialog
