import { useParams } from 'react-router-dom'
import PositionForm from '../../../components/positions/form/PositionForm'

const PositionEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <PositionForm id={id!} />
}

export default PositionEdit
