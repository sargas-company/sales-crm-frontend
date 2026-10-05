import { useParams } from 'react-router-dom'
import SalaryReviewForm from '../../components/salary-reviews/form/SalaryReviewForm'

const PromotionsEdit = () => {
	const { id } = useParams<{ id: string }>()
	return <SalaryReviewForm id={id} />
}

export default PromotionsEdit
