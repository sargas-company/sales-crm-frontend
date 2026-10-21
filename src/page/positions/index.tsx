import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import PositionAdd from './add/PositionAdd'
import PositionEdit from './edit/PositionEdit.page'
import PositionList from './list/PositionList.page'

const Positions = () => {
	return (
		<Routes>
			<Route path='/list/' element={<PositionList />} />
			<Route
				path='/add/'
				element={
					<ProtectedRoute permission='positions:create'>
						<PositionAdd />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/edit/:id'
				element={
					<ProtectedRoute permission='positions:update'>
						<PositionEdit />
					</ProtectedRoute>
				}
			/>
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default Positions
