import { useLogoutUserMutation } from '../store/auth/authApi'
import { logout } from '../store/auth/authSlice'
import { useAppDispatch } from '.'
import useNavigation from './useNavigation'

const useLogout = () => {
	const dispatch = useAppDispatch()
	const [logoutUser] = useLogoutUserMutation()
	const { navigate } = useNavigation()

	return async () => {
		try {
			await logoutUser().unwrap()
		} catch {
			// Even if the server request fails, clear local state
		} finally {
			// Signal any live reveal-drawer / plaintext-holding
			// component to scrub its state before the auth slice
			// resets. Fired BEFORE navigate so listeners run while
			// their component is still mounted.
			window.dispatchEvent(new CustomEvent('auth:logout'))
			dispatch(logout())
			navigate('/auth/login/')
		}
	}
}

export default useLogout
