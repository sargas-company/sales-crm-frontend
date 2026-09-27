import { Navigate } from 'react-router-dom'
import AuthBanner from '../../components/auth/AuthBanner'
import Login, { LoginFormData } from '../../components/auth/Login'
import AuthLayout from '../../components/layout/auth-form/AuthLayout'
import useAuth from '../../hooks/useAuth'
import useNavigation from '../../hooks/useNavigation'
import { useLoginMutation, useLazyGetMeQuery } from '../../store/auth/authApi'
import { useAppDispatch } from '../../hooks'
import { setCredentials, setMe } from '../../store/auth/authSlice'
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
			dispatch(setCredentials(tokens))
			// Hydrate role + permissions from backend before entering
			// the app so `<ProtectedRoute permission=…>` and sidebar
			// filtering (T-05, T-06) have a source of truth ready.
			try {
				const me = await getMe().unwrap()
				dispatch(setMe({ role: me.role, permissions: me.permissions }))
			} catch {}
			navigate('/dashboards/sales')
		} catch {}
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
