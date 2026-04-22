import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import CounterpartyAdd from './add/CounterpartyAdd'
import CounterpartyEdit from './edit/CounterpartyEdit.page'
import CounterpartyList from './list/CounterpartyList.page'

const Counterparties = () => {
	return (
		<Routes>
			<Route path='/list/' element={<CounterpartyList />} />
			<Route path='/add/' element={<CounterpartyAdd />} />
			<Route path='/edit/:id' element={<CounterpartyEdit />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default Counterparties
