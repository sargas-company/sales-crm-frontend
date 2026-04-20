import { useParams } from 'react-router-dom'
import PlatformForm from '../../../components/platforms/form/PlatformForm'

const PlatformEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <PlatformForm id={id!} />
}

export default PlatformEdit
