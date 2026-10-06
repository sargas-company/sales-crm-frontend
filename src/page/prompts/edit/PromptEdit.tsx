import { useParams } from 'react-router-dom'
import PromptEditForm from '../../../components/prompts/form/PromptEditForm'

const PromptEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <PromptEditForm id={id!} />
}

export default PromptEdit
