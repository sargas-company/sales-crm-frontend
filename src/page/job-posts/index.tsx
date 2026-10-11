import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import JobPostList from './list/JobPostList.page'
import JobPostPreview from './preview/JobPostPreview.page'
import JobPostStatesIndex from '../../dev/JobPostStatesIndex.page'

const JobPosts = () => {
	return (
		<Routes>
			<Route path='/list/' element={<JobPostList />} />
			<Route path='/preview/:id' element={<JobPostPreview />} />
			{import.meta.env.DEV ? (
				<Route path='/dev-states' element={<JobPostStatesIndex />} />
			) : null}
			<Route path='*' element={<PageNotFound />} />
		</Routes>
	)
}

export default JobPosts
