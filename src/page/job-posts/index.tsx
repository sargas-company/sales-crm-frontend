import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import JobPostList from './list/JobPostList.page'
import JobPostPreview from './preview/JobPostPreview.page'
import JobPostAdd from './add/JobPostAdd'

const JobPosts = () => {
	return (
		<Routes>
			<Route path='/list/' element={<JobPostList />} />
			<Route path='/add/' element={<JobPostAdd />} />
			<Route path='/preview/:id' element={<JobPostPreview />} />
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default JobPosts
