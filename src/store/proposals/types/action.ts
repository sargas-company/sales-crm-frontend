import concatActionString from '../../../utils/concatActionString'
const concat = concatActionString('proposal')
export const ProposalActionName = {
	fetchProposal: concat('fetchData'),
	searchData: concat('searchData'),
}
