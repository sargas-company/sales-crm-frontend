import { Route, Routes } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import CredentialsLayout from './CredentialsLayout'
import CredentialsLandingPage from './CredentialsLanding.page'
import CredentialsProfilePage from './CredentialsProfile.page'
import CredentialsProfileForm from './CredentialsProfileForm.page'
import CredentialsAccountForm from './CredentialsAccountForm.page'
import VaultSessionRequired from './VaultSessionRequired'

/* Everything under `/credentials/*` sits behind `VaultSessionRequired`.
 * It renders a full-screen Locked / Setup card (not a 403 — the user
 * HAS permission, just hasn't unlocked) and keeps the current URL, so
 * after the unlock drawer finishes the user lands exactly where they
 * were going. See work/tasks/credentials-vault-hard-gate.md. */
const Credentials = () => (
	<VaultSessionRequired>
		<Routes>
			{/* List-type pages share the ListPageShell chrome via CredentialsLayout */}
			<Route element={<CredentialsLayout />}>
				<Route path='/' element={<CredentialsLandingPage />} />
				<Route path='/profiles/:id' element={<CredentialsProfilePage />} />
			</Route>

			{/* Forms use the project-standard Shell + Surface + FormHeader pattern */}
			<Route
				path='/profiles/new'
				element={
					<ProtectedRoute permission='credentials:create'>
						<CredentialsProfileForm mode='create' />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/profiles/:id/edit'
				element={
					<ProtectedRoute permission='credentials:update'>
						<CredentialsProfileForm mode='edit' />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/profiles/:id/accounts/new'
				element={
					<ProtectedRoute permission='credentials:create'>
						<CredentialsAccountForm mode='create' />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/accounts/:id/edit'
				element={
					<ProtectedRoute permission='credentials:update'>
						<CredentialsAccountForm mode='edit' />
					</ProtectedRoute>
				}
			/>

			<Route path='*' element={<PageNotFound />} />
		</Routes>
	</VaultSessionRequired>
)

export default Credentials
