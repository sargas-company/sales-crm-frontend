import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import LeadAdd from './add/LeadAdd'
import LeadEdit from './edit/LeadEdit.page'
import LeadList from './list/LeadList.page'
import LeadPreview from './preview/LeadPreview'
const Leads = () => {
	return (
		<Routes>
			<Route path='/list/' element={<LeadList />} />
			<Route path='/add/' element={<LeadAdd />} />
			<Route path='/edit/:id' element={<LeadEdit />} />
			<Route path='/preview/:id' element={<LeadPreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}
export default Leads
