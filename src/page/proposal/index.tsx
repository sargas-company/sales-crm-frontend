import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProposalPreview from './preview/ProposalPreview'
const Proposal = () => {
	return (
		<Routes>
			<Route path='/preview/:id' element={<ProposalPreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}
export default Proposal
