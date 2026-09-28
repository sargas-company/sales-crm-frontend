import { Route, Routes } from 'react-router-dom'
import RolesListPage from '../../components/roles/RolesListPage'
import RoleEditorPage from '../../components/roles/RoleEditorPage'
import RoleAdd from './add/RoleAdd'
import RoleView from './view/RoleView'

const RolesRouter = () => (
	<Routes>
		<Route index element={<RolesListPage />} />
		<Route path='add' element={<RoleAdd />} />
		<Route path=':id' element={<RoleView />} />
		<Route path=':id/edit' element={<RoleEditorPage />} />
	</Routes>
)

export default RolesRouter
