import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import PlatformAdd from './add/PlatformAdd'
import PlatformEdit from './edit/PlatformEdit.page'
import PlatformList from './list/PlatformList.page'
import PlatformView from './view/PlatformView.page'

const Platforms = () => {
	return (
		<Routes>
			<Route path='/list/' element={<PlatformList />} />
			<Route
				path='/add/'
				element={
					<ProtectedRoute permission='platforms:create'>
						<PlatformAdd />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/edit/:id'
				element={
					<ProtectedRoute permission='platforms:update'>
						<PlatformEdit />
					</ProtectedRoute>
				}
			/>
			<Route path='/:id' element={<PlatformView />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default Platforms
