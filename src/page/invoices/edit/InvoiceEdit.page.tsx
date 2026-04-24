import { useParams } from 'react-router-dom'
import InvoiceEditForm from '../../../components/invoices/edit/InvoiceEditForm'

const InvoiceEdit = () => {
	const { id } = useParams<{ id: string }>()

	return <InvoiceEditForm id={id!} />
}

export default InvoiceEdit
