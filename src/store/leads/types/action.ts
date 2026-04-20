import concatActionString from '../../../utils/concatActionString'
const concat = concatActionString('lead')
export const LeadActionName = {
	fetchLead: concat('fetchData'),
	searchData: concat('searchData'),
}
