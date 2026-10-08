import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import ClientList from './list/ClientList.page'
import ClientAdd from './add/ClientAdd'
import ClientEdit from './edit/ClientEdit.page'
import ClientView from './view/ClientView.page'

const Clients = () => (
	<Routes>
		<Route path='/list/' element={<ClientList />} />
		<Route
			path='/add/'
			element={
				<ProtectedRoute permission='clients:create'>
					<ClientAdd />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/edit/:id'
			element={
				<ProtectedRoute permission='clients:update'>
					<ClientEdit />
				</ProtectedRoute>
			}
		/>
		<Route path='/:id' element={<ClientView />} />
		<Route path='*' element={<PageNotFound />} />
	</Routes>
)

export default Clients
