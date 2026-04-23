import { Link } from 'react-router-dom'
import Box from '../../box/Box'
import { IconButton } from '../../../ui'
import { DeleteOutline, VisibilityOutlined } from '@mui/icons-material'

interface Props {
	promptId: string
	isActive: boolean
	onDelete: (id: string) => void
}

const PromptListAction = ({ promptId, isActive, onDelete }: Props) => (
	<Box display='flex'>
		<Link to={`/prompts/preview/${promptId}`}>
			<IconButton varient='text' size={30} fontSize={21} contentOpacity={5}>
				<VisibilityOutlined />
			</IconButton>
		</Link>
		<IconButton
			varient='text'
			size={30}
			fontSize={21}
			contentOpacity={isActive ? 2 : 5}
			onClick={() => !isActive && onDelete(promptId)}
			disabled={isActive}
		>
			<DeleteOutline />
		</IconButton>
	</Box>
)

export default PromptListAction
