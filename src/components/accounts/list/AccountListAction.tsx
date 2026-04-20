import Box from '../../box/Box'
import { IconButton } from '../../../ui'
import { DeleteOutline, EditOutlined } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const AccountListAction = ({
	accountId,
	onDelete,
}: {
	accountId: string
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
				onClick={() => onDelete(accountId)}
			>
				<DeleteOutline />
			</IconButton>
			<IconButton
				varient='text'
				size={30}
				fontSize={21}
				contentOpacity={5}
				onClick={() => navigate(`/accounts/edit/${accountId}`)}
			>
				<EditOutlined />
			</IconButton>
		</Box>
	)
}

export default AccountListAction
