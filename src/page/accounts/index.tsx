import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import AccountAdd from './add/AccountAdd'
import AccountEdit from './edit/AccountEdit.page'
import AccountList from './list/AccountList.page'
import AccountView from './view/AccountView.page'

const Accounts = () => {
	return (
		<Routes>
			<Route path='/list/' element={<AccountList />} />
			<Route
				path='/add/'
				element={
					<ProtectedRoute permission='accounts:create'>
						<AccountAdd />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/edit/:id'
				element={
					<ProtectedRoute permission='accounts:update'>
						<AccountEdit />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/:id'
				element={
					<ProtectedRoute permission='accounts:view'>
						<AccountView />
					</ProtectedRoute>
				}
			/>
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default Accounts
