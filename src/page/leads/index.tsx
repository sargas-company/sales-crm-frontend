import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import LeadAdd from './add/LeadAdd'
import LeadEdit from './edit/LeadEdit.page'
import LeadList from './list/LeadList.page'
import LeadView from './view/LeadView.page'

/** Legacy URL keeper: /leads/preview/:id → /leads/view/:id. */
const PreviewRedirect = () => {
	const { id } = useParams<{ id: string }>()
	return <Navigate to={`/leads/view/${id}`} replace />
}

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
			<Route path='/view/:id' element={<LeadView />} />
			<Route path='/preview/:id' element={<PreviewRedirect />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}
export default Leads
