import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import CounterpartyAdd from './add/CounterpartyAdd'
import CounterpartyEdit from './edit/CounterpartyEdit.page'
import CounterpartyList from './list/CounterpartyList.page'
import CounterpartyView from './view/CounterpartyView.page'

const Counterparties = () => {
	return (
		<Routes>
			<Route path='/list/' element={<CounterpartyList />} />
			<Route
				path='/add/'
				element={
					<ProtectedRoute permission='counterparties:create'>
						<CounterpartyAdd />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/edit/:id'
				element={
					<ProtectedRoute permission='counterparties:update'>
						<CounterpartyEdit />
					</ProtectedRoute>
				}
			/>
			<Route path='/:id' element={<CounterpartyView />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default Counterparties
