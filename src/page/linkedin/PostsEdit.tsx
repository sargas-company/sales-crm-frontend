import { useParams } from 'react-router-dom'
import PostForm from '../../components/linkedin/PostForm'

const LinkedInPostsEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <PostForm id={id} />
}

export default LinkedInPostsEdit
