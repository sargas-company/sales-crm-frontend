import { useParams } from 'react-router-dom'
import PayrollForm from '../../components/payroll/form/PayrollForm'

const SalariesEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <PayrollForm id={id} />
}

export default SalariesEdit
