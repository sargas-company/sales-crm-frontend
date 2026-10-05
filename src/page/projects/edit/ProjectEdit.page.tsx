import { useParams } from 'react-router-dom'
import ProjectForm from '../../../components/projects/form/ProjectForm'

const ProjectEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <ProjectForm id={id!} />
}

export default ProjectEdit
