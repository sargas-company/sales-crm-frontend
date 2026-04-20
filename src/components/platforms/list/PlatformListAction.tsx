import Box from '../../box/Box'
import { IconButton } from '../../../ui'
import { DeleteOutline, EditOutlined } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const PlatformListAction = ({
	platformId,
	onDelete,
}: {
	platformId: string
	onDelete: (id: string) => void
}) => {
	const navigate = useNavigate()
	return (
		<Box display='flex'>
			<IconButton
				varient='text'
				size={30}
				fontSize={21}
				contentOpacity={5}
				onClick={() => onDelete(platformId)}
			>
				<DeleteOutline />
			</IconButton>
			<IconButton
				varient='text'
				size={30}
				fontSize={21}
				contentOpacity={5}
				onClick={() => navigate(`/platforms/edit/${platformId}`)}
			>
				<EditOutlined />
			</IconButton>
		</Box>
	)
}

export default PlatformListAction
