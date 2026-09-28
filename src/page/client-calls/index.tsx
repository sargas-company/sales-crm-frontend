import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import ClientCallAdd from './add/ClientCallAdd'
import ClientCallEdit from './edit/ClientCallEdit.page'
import ClientCallList from './list/ClientCallList.page'
import ClientCallPreview from './preview/ClientCallPreview'
const ClientCall = () => {
	return (
		<Routes>
			<Route path='/list/' element={<ClientCallList />} />
			<Route
				path='/add/'
				element={
					<ProtectedRoute permission='client_calls:create'>
						<ClientCallAdd />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/edit/:id'
				element={
					<ProtectedRoute permission='client_calls:update'>
						<ClientCallEdit />
					</ProtectedRoute>
				}
			/>
			<Route path='/preview/:id' element={<ClientCallPreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}
export default ClientCall
