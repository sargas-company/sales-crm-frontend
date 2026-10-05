import { Navigate, Route, Routes } from 'react-router-dom'
import BackupsListPage from './BackupsListPage'
import BackupDetailPage from './BackupDetailPage'

const BackupsRouter = () => (
	<Routes>
		<Route index element={<Navigate to='list' replace />} />
		<Route path='list' element={<BackupsListPage />} />
		<Route path=':id' element={<BackupDetailPage />} />
	</Routes>
)

export default BackupsRouter
