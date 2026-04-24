import { useParams } from 'react-router-dom'
import InvoicePreviewDetails from '../../../components/invoices/preview/InvoicePreviewDetails'

const InvoicePreview = () => {
	const { id } = useParams<{ id: string }>()

	return <InvoicePreviewDetails id={id!} />
}

export default InvoicePreview
