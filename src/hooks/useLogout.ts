import { baseApi } from '../api/baseApi'
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
			// Wipe RTK Query cache so the next user's session doesn't
			// inherit this user's per-user data (e.g. job-post viewedAt).
			dispatch(baseApi.util.resetApiState())
			navigate('/auth/login/')
		}
	}
}

export default useLogout
