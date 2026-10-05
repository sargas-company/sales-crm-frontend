import { useParams } from 'react-router-dom'
import PaymentSourceForm from '../../components/payment-sources/form/PaymentSourceForm'

const PaymentSourceEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <PaymentSourceForm id={id} />
}

export default PaymentSourceEdit
