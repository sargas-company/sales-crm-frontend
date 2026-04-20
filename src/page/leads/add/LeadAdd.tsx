import Card from '../../../components/card/Card'
import AddMain from '../../../components/leads/add/AddMain'
import LeadAction from '../../../components/leads/LeadAction'
import LeadOption from '../../../components/leads/LeadOption'
import LeadLayout from '../../../components/leads/layout/LeadLayout'

const LeadAdd = () => {
	return (
		<LeadLayout>
			<AddMain />
			<>
				<Card padding='20px'>
					<LeadAction />
				</Card>
				<LeadOption />
			</>
		</LeadLayout>
	)
}
export default LeadAdd
