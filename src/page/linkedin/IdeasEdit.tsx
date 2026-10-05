import { useParams } from 'react-router-dom'
import IdeaForm from '../../components/linkedin/IdeaForm'

const LinkedInIdeasEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <IdeaForm id={id} />
}

export default LinkedInIdeasEdit
