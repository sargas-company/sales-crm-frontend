import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../ui'

const CreateNewJobPost = () => {
	const navigate = useNavigate()
	return <Button onClick={() => navigate('/job-posts/add/')}>Create job post</Button>
}
export default memo(CreateNewJobPost)
