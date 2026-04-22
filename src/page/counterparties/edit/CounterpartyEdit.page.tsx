import { useParams } from 'react-router-dom'
import CounterpartyForm from '../../../components/counterparties/form/CounterpartyForm'

const CounterpartyEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <CounterpartyForm id={id!} />
}

export default CounterpartyEdit
