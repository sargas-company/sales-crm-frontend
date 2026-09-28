import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../routes/ProtectedRoute'
import RolesListPage from '../../components/roles/RolesListPage'
import RoleEditorPage from '../../components/roles/RoleEditorPage'
import RoleAdd from './add/RoleAdd'
import RoleView from './view/RoleView'

const RolesRouter = () => (
	<Routes>
		<Route index element={<RolesListPage />} />
		<Route
			path='add'
			element={
				<ProtectedRoute permission='roles:create'>
					<RoleAdd />
				</ProtectedRoute>
			}
		/>
		<Route path=':id' element={<RoleView />} />
		<Route
			path=':id/edit'
			element={
				<ProtectedRoute permission='roles:update'>
					<RoleEditorPage />
				</ProtectedRoute>
			}
		/>
	</Routes>
)

export default RolesRouter
