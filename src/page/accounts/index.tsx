import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import AccountAdd from './add/AccountAdd'
import AccountEdit from './edit/AccountEdit.page'
import AccountList from './list/AccountList.page'

const Accounts = () => {
	return (
		<Routes>
			<Route path='/list/' element={<AccountList />} />
			<Route path='/add/' element={<AccountAdd />} />
			<Route path='/edit/:id' element={<AccountEdit />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default Accounts
