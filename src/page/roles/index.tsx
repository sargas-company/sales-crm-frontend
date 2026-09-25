import { Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import useTheme from '../../theme/useTheme'
import { RolesProvider } from '../../store/roles/rolesMockStore'
import { ToastProvider } from '../../components/roles/Toast'
import RolesListPage from '../../components/roles/RolesListPage'
import RoleEditorPage from '../../components/roles/RoleEditorPage'

const RolesRouter = () => {
	const {
		theme: { mode, primaryColor },
	} = useTheme()
	return (
		<ThemeProvider theme={{ mode, primaryColor }}>
			<RolesProvider>
				<ToastProvider>
					<Routes>
						<Route index element={<RolesListPage />} />
						<Route path=':id' element={<RoleEditorPage />} />
					</Routes>
				</ToastProvider>
			</RolesProvider>
		</ThemeProvider>
	)
}

export default RolesRouter
