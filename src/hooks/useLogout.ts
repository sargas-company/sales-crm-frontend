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
      dispatch(logout())
      navigate('/auth/login/')
    }
  }
}

export default useLogout
