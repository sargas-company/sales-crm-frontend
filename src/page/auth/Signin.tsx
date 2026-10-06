import { Navigate } from 'react-router-dom'
import AuthBanner from '../../components/auth/AuthBanner'
import Login, { LoginFormData } from '../../components/auth/Login'
import AuthLayout from '../../components/layout/auth-form/AuthLayout'
import useAuth from '../../hooks/useAuth'
import useNavigation from '../../hooks/useNavigation'
import { useLoginMutation, useLazyGetMeQuery } from '../../store/auth/authApi'
import { useAppDispatch } from '../../hooks'
import { setCredentials, setInitialized, setLoggingIn, setMe } from '../../store/auth/authSlice'
import PageLoading from '../../components/loading/PageLoading'

const Signin = () => {
	const { isAuthenticated } = useAuth()
	const { navigate } = useNavigation()
	const dispatch = useAppDispatch()
	const [login, { isLoading, error }] = useLoginMutation()
	const [getMe] = useLazyGetMeQuery()

	// Still initializing (checking stored refresh token)
	if (isAuthenticated === null) return <PageLoading />
	// Already logged in → go to dashboard
	if (isAuthenticated) return <Navigate to='/dashboards/sales' replace />

	const handleSubmit = async (inputs: LoginFormData) => {
		try {
			const tokens = await login({ email: inputs.email, password: inputs.password }).unwrap()
			// Hold the hydration gate shut while we fetch /auth/me, so
			// `useAuth` returns `isAuthenticated === null` and
			// `<ProtectedRoute>` shows `<PageLoading />` instead of
			// flashing `/access-denied` between tokens arriving and
			// permissions arriving.
			dispatch(setLoggingIn())
			dispatch(setCredentials(tokens))
			try {
				const me = await getMe().unwrap()
				dispatch(setMe({ role: me.role, permissions: me.permissions }))
			} catch {}
			// Reopen the gate — permissions are either in Redux now or
			// legitimately empty (the backend answered). Only now may
			// the authenticated UI render.
			dispatch(setInitialized())
			navigate('/dashboards/sales')
		} catch {
			// Login itself failed — gate was never closed, but calling
			// setInitialized is a safe no-op if it is already true.
			dispatch(setInitialized())
		}
	}

	const serverError = error
		? typeof error === 'object' && error !== null && 'data' in error
			? ((error as { data: any }).data?.message ?? 'Invalid email or password')
			: 'Login failed. Please try again.'
		: undefined

	return (
		<AuthLayout
			RightContent={
				<Login onSubmit={handleSubmit} isLoading={isLoading} serverError={serverError} />
			}
			LeftContent={
				<AuthBanner
					bgDark='https://i.ibb.co/n8YcMNb/login-dark.png'
					bgLight='https://i.ibb.co/n8YcMNb/login-light.png'
				/>
			}
		/>
	)
}
export default Signin
