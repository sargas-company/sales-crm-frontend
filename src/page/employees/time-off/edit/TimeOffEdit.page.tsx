import { useParams } from 'react-router-dom'
import TimeOffForm from '../../../../components/time-off/form/TimeOffForm'

const TimeOffEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <TimeOffForm id={id!} />
}

export default TimeOffEdit
