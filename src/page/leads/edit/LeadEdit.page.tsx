import { useParams } from 'react-router-dom'
import LeadForm from '../../../components/leads/form/LeadForm'
import { useGetLeadByIdQuery } from '../../../store/leads/leadsApi'
import { FormLoading, FormNotFound } from '../../../components/_shared/FormShell'

const LeadEdit = () => {
	const { id } = useParams<{ id: string }>()
	const { data, isLoading, isError } = useGetLeadByIdQuery(id!, { skip: !id })
	if (!id) return <FormNotFound label='Missing lead id' />
	if (isLoading) return <FormLoading label='Loading lead…' />
	if (isError || !data) return <FormNotFound label='Lead not found' />
	return <LeadForm mode='edit' id={id} initial={data} />
}

export default LeadEdit
