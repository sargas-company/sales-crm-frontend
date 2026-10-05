import { useSearchParams } from 'react-router-dom'
import PayrollForm from '../../components/payroll/form/PayrollForm'

const SalariesAdd = () => {
	const [params] = useSearchParams()
	const year = Number(params.get('year')) || undefined
	const month = Number(params.get('month')) || undefined
	return <PayrollForm defaultYear={year} defaultMonth={month} />
}

export default SalariesAdd
