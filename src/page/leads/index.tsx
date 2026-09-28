import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import LeadAdd from './add/LeadAdd'
import LeadEdit from './edit/LeadEdit.page'
import LeadList from './list/LeadList.page'
import LeadPreview from './preview/LeadPreview'
const Leads = () => {
	return (
		<Routes>
			<Route path='/list/' element={<LeadList />} />
			<Route
				path='/add/'
				element={
					<ProtectedRoute permission='leads:create'>
						<LeadAdd />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/edit/:id'
				element={
					<ProtectedRoute permission='leads:update'>
						<LeadEdit />
					</ProtectedRoute>
				}
			/>
			<Route path='/preview/:id' element={<LeadPreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}
export default Leads
