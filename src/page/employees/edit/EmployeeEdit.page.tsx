import { useParams } from 'react-router-dom'
import EmployeeForm from '../../../components/employees/form/EmployeeForm'

const EmployeeEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <EmployeeForm id={id!} />
}

export default EmployeeEdit
