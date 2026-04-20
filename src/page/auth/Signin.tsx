import { Navigate } from 'react-router-dom'
import AuthBanner from '../../components/auth/AuthBanner'
import Login, { LoginFormData } from '../../components/auth/Login'
import ColorBox from '../../components/box/ColorBox'
import AuthLayout from '../../components/layout/auth-form/AuthLayout'
import useAuth from '../../hooks/useAuth'
import useNavigation from '../../hooks/useNavigation'
import { useLoginMutation } from '../../store/auth/authApi'
import { useAppDispatch } from '../../hooks'
import { setCredentials } from '../../store/auth/authSlice'
import PageLoading from '../../components/loading/PageLoading'

const Signin = () => {
	const { isAuthenticated } = useAuth()
	const { navigate } = useNavigation()
	const dispatch = useAppDispatch()
	const [login, { isLoading, error }] = useLoginMutation()

	// Still initializing (checking stored refresh token)
	if (isAuthenticated === null) return <PageLoading />
	// Already logged in → go to dashboard
	if (isAuthenticated) return <Navigate to='/dashboards/analytics/' replace />

	const handleSubmit = async (inputs: LoginFormData) => {
		try {
			const tokens = await login({ email: inputs.email, password: inputs.password }).unwrap()
			dispatch(setCredentials(tokens))
			navigate('/dashboards/analytics/')
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
				<ColorBox backgroundTheme='foreground'>
					<Login onSubmit={handleSubmit} isLoading={isLoading} serverError={serverError} />
				</ColorBox>
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
