import { useParams } from 'react-router-dom'
import ClientForm from '../../../components/clients/form/ClientForm'
import { useGetClientByIdQuery } from '../../../store/clients/clientsApi'
import { FormLoading, FormNotFound } from '../../../components/_shared/FormShell'

const ClientEdit = () => {
	const { id } = useParams<{ id: string }>()
	const { data, isLoading, isError } = useGetClientByIdQuery(id!, {
		skip: !id,
	})
	if (!id) return <FormNotFound label='Missing client id' />
	if (isLoading) return <FormLoading label='Loading client…' />
	if (isError || !data) return <FormNotFound label='Client not found' />
	return <ClientForm mode='edit' id={id} initial={data} />
}

export default ClientEdit
