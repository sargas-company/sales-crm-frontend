import { Chip } from '../../../ui'

const PromptActiveChip = ({ isActive }: { isActive: boolean }) => (
	<Chip
		label={isActive ? 'Active' : 'Inactive'}
		skin='light'
		size='small'
		color={isActive ? 'success' : 'secondary'}
		styles={{
			whiteSpace: 'nowrap',
			fontSize: '12px',
			fontWeight: 600,
			letterSpacing: '0.3px',
		}}
	/>
)

export default PromptActiveChip
