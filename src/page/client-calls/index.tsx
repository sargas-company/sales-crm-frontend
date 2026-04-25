import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ClientCallAdd from './add/ClientCallAdd'
import ClientCallEdit from './edit/ClientCallEdit.page'
import ClientCallList from './list/ClientCallList.page'
import ClientCallPreview from './preview/ClientCallPreview'
const ClientCall = () => {
	return (
		<Routes>
			<Route path='/list/' element={<ClientCallList />} />
			<Route path='/add/' element={<ClientCallAdd />} />
			<Route path='/edit/:id' element={<ClientCallEdit />} />
			<Route path='/preview/:id' element={<ClientCallPreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}
export default ClientCall
