import { Navigate, Route, Routes } from 'react-router-dom'
import NotificationsListPage from './NotificationsListPage'
import NotificationDetailPage from './NotificationDetailPage'

const NotificationsRouter = () => (
	<Routes>
		<Route index element={<Navigate to='list' replace />} />
		<Route path='list' element={<NotificationsListPage />} />
		<Route path=':id' element={<NotificationDetailPage />} />
	</Routes>
)

export default NotificationsRouter
