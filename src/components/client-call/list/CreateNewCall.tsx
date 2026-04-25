import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../ui'

const CreateNewCall = () => {
	const navigate = useNavigate()
	return <Button onClick={() => navigate('/client-calls/add/')}>Create client call</Button>
}
export default memo(CreateNewCall)
