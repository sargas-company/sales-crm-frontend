import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import PromptList from './list/PromptList.page'
import PromptAdd from './add/PromptAdd'
import PromptPreview from './preview/PromptPreview'

const Prompts = () => {
	return (
		<Routes>
			<Route path='/list' element={<PromptList />} />
			<Route path='/list/' element={<PromptList />} />
			<Route path='/add' element={<PromptAdd />} />
			<Route path='/preview/:id' element={<PromptPreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default Prompts
