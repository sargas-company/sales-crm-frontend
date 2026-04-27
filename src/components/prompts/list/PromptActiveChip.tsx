import { Chip } from '../../../ui'

const PromptActiveChip = ({ isActive }: { isActive: boolean }) => (
	<Chip
		label={isActive ? 'Active' : 'Inactive'}
		skin='light'
		size='small'
		color={isActive ? 'success' : 'secondary'}
		styles={{ whiteSpace: 'nowrap', color: '#000000' }}
	/>
)

export default PromptActiveChip
