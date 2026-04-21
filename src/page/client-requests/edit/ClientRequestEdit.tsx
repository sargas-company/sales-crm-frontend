import { useParams } from 'react-router-dom'
import ClientRequestForm from '../../../components/client-requests/form/ClientRequestForm'

const ClientRequestEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <ClientRequestForm id={id!} />
}

export default ClientRequestEdit
