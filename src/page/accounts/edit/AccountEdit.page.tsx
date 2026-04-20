import { useParams } from 'react-router-dom'
import AccountForm from '../../../components/accounts/form/AccountForm'

const AccountEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <AccountForm id={id!} />
}

export default AccountEdit
