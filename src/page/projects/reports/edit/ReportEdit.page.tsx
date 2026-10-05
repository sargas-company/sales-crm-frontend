import { useParams } from 'react-router-dom'
import ReportForm from '../../../../components/project-reports/form/ReportForm'

const ReportEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <ReportForm id={id!} />
}

export default ReportEdit
