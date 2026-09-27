import ConfirmationDialog from '../../ui/overlay/ConfirmationDialog'
import type { Role } from '../../store/roles/types'

interface Props {
	role: Role
	isBusy: boolean
	onCancel: () => void
	onConfirm: () => void
}

const RoleDeleteDialog = ({ role, isBusy, onCancel, onConfirm }: Props) => (
	<ConfirmationDialog
		open
		tone='danger'
		title={`Delete role "${role.label}"?`}
		message='The role cannot be restored. Reassign every user off this role before deleting.'
		confirmLabel={isBusy ? 'Deleting…' : 'Delete role'}
		cancelLabel='Cancel'
		onCancel={onCancel}
		onConfirm={onConfirm}
	/>
)

export default RoleDeleteDialog
