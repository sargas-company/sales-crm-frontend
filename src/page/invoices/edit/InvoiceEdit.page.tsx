import { useParams } from 'react-router-dom'
import LeadForm from '../../../components/leads/form/LeadForm'

const LeadEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <LeadForm id={id!} />
}

export default LeadEdit
