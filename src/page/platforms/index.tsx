import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import PlatformAdd from './add/PlatformAdd'
import PlatformEdit from './edit/PlatformEdit.page'
import PlatformList from './list/PlatformList.page'
import PlatformView from './view/PlatformView.page'

const Platforms = () => {
	return (
		<Routes>
			<Route path='/list/' element={<PlatformList />} />
			<Route path='/add/' element={<PlatformAdd />} />
			<Route path='/edit/:id' element={<PlatformEdit />} />
			<Route path='/:id' element={<PlatformView />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default Platforms
