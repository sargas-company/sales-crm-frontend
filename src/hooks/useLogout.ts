import { useLogoutUserMutation } from '../store/auth/authApi'
import useNavigation from './useNavigation'

const useLogout = () => {
  const [logoutUser] = useLogoutUserMutation()
  const { navigate } = useNavigation()

  return async () => {
    try {
      await logoutUser().unwrap()
    } finally {
      // Always redirect — even if the request fails the local state is cleared
      navigate('/auth/login/')
    }
  }
}

export default useLogout
