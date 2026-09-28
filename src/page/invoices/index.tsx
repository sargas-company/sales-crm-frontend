import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'

import InvoiceAdd from './add/InvoiceAdd'
import InvoiceEdit from './edit/InvoiceEdit.page'
import InvoiceList from './list/InvoiceList.page'
import InvoicePreview from './preview/InvoicePreview'
const Invoices = () => {
	return (
		<Routes>
			<Route path='/list/' element={<InvoiceList />} />
			<Route
				path='/add/'
				element={
					<ProtectedRoute permission='invoices:create'>
						<InvoiceAdd />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/edit/:id'
				element={
					<ProtectedRoute permission='invoices:update'>
						<InvoiceEdit />
					</ProtectedRoute>
				}
			/>
			<Route path='/preview/:id' element={<InvoicePreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}
export default Invoices
