import { Route, Routes } from 'react-router-dom'
import RolesListPage from '../../components/roles/RolesListPage'
import RoleEditorPage from '../../components/roles/RoleEditorPage'

const RolesRouter = () => (
	<Routes>
		<Route index element={<RolesListPage />} />
		<Route path=':id' element={<RoleEditorPage />} />
	</Routes>
)

export default RolesRouter
