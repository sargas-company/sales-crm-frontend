import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'

import InvoiceAdd from './add/InvoiceAdd'
import InvoiceEdit from './edit/InvoiceEdit.page'
import InvoiceList from './list/InvoiceList.page'
import InvoicePreview from './preview/InvoicePreview'
const Invoices = () => {
	return (
		<Routes>
			<Route path='/list/' element={<InvoiceList />} />
			<Route path='/add/' element={<InvoiceAdd />} />
			<Route path='/edit/:id' element={<InvoiceEdit />} />
			<Route path='/preview/:id' element={<InvoicePreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}
export default Invoices
