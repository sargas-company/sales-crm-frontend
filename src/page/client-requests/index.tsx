import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import ClientRequestList from './list/ClientRequestList.page'
import ClientRequestPreview from './preview/ClientRequestPreview'
import ClientRequestEdit from './edit/ClientRequestEdit'

const ClientRequests = () => {
	return (
		<Routes>
			<Route path='/list/' element={<ClientRequestList />} />
			<Route path='/preview/:id' element={<ClientRequestPreview />} />
			<Route
				path='/edit/:id'
				element={
					<ProtectedRoute permission='client_requests:update'>
						<ClientRequestEdit />
					</ProtectedRoute>
				}
			/>
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default ClientRequests
