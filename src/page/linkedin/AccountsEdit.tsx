import { useParams } from 'react-router-dom'
import AccountForm from '../../components/linkedin/AccountForm'

const LinkedInAccountsEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <AccountForm id={id} />
}

export default LinkedInAccountsEdit
