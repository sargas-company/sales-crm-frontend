import { useMemo } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'

import GlobalStyle from '../global.styled'
import { buildTheme } from '../theme/tokens'
import useTheme from '../theme/useTheme'
import { ToastProvider } from '../context/toast/ToastContext'

import { PortalShell } from './PortalShell'
import { PortalLoginPage } from './PortalLoginPage'
import { InviteLandingPage } from './InviteLandingPage'
import { DiscordCallbackPage } from './DiscordCallbackPage'
import { PortalRequireAuth } from './PortalRequireAuth'

import FileManagerPage from '../page/file-manager/FileManager.page'

/* Root of the File Manager Portal — a dedicated React tree served
 * on files.sargas.io (local: files.localhost). Reuses the main CRM's
 * theme, auth init and toast, but mounts its own route set and a
 * stripped-down shell (no sidebar, no admin links). The main
 * FileManager page is rendered 1-to-1 inside PortalShell; access
 * scoping is enforced server-side. */
export const PortalApp = () => {
	const {
		theme: {
			mode,
			primaryColor: { color },
			skin,
		},
	} = useTheme()
	const tokenTheme = useMemo(() => buildTheme(mode.name, color), [mode.name, color])
	return (
		<StyledThemeProvider theme={tokenTheme}>
			<ToastProvider>
				<GlobalStyle
					textColor={mode.textColor}
					backgroundColor={mode.background}
					foregroundColor={mode.foreground}
					mode={mode.name}
					skinColor={color}
					skin={skin}
				/>
				<Routes>
					{/* Public routes */}
					<Route path='/portal/login' element={<PortalLoginPage />} />
					<Route path='/invite/:token' element={<InviteLandingPage />} />
					<Route path='/auth/callback' element={<DiscordCallbackPage />} />
					{/* Protected portal routes */}
					<Route
						path='/'
						element={
							<PortalRequireAuth>
								<PortalShell>
									<FileManagerPage />
								</PortalShell>
							</PortalRequireAuth>
						}
					/>
					<Route
						path='/file-manager'
						element={
							<PortalRequireAuth>
								<PortalShell>
									<FileManagerPage />
								</PortalShell>
							</PortalRequireAuth>
						}
					/>
					<Route
						path='/file-manager/folder/:folderId'
						element={
							<PortalRequireAuth>
								<PortalShell>
									<FileManagerPage />
								</PortalShell>
							</PortalRequireAuth>
						}
					/>
					{/* Everything else → root (which will redirect to login
					 *  if unauthenticated). Prevents workers from poking at
					 *  admin paths like /clients and getting a confusing
					 *  blank route. */}
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</ToastProvider>
		</StyledThemeProvider>
	)
}
