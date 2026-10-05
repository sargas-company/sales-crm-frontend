import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import ProjectList from './list/ProjectList.page'
import ProjectAdd from './add/ProjectAdd'
import ProjectEdit from './edit/ProjectEdit.page'
import ProjectView from './view/ProjectView.page'
import ReportList from './reports/list/ReportList.page'
import ReportAdd from './reports/add/ReportAdd'
import ReportEdit from './reports/edit/ReportEdit.page'
import ReportView from './reports/view/ReportView.page'

const Projects = () => (
	<Routes>
		<Route path='/list' element={<ProjectList />} />
		<Route path='/list/' element={<ProjectList />} />
		<Route
			path='/add'
			element={
				<ProtectedRoute permission='projects:create'>
					<ProjectAdd />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/edit/:id'
			element={
				<ProtectedRoute permission='projects:update'>
					<ProjectEdit />
				</ProtectedRoute>
			}
		/>
		{/* Reports live under /projects/reports/*. Declared before the
		    project detail route so `/projects/reports` and its children
		    match here, not the `:id` project view. */}
		<Route path='/reports' element={<ReportList />} />
		<Route
			path='/reports/add'
			element={
				<ProtectedRoute permission='project_reports:create'>
					<ReportAdd />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/reports/edit/:id'
			element={
				<ProtectedRoute permission='project_reports:update'>
					<ReportEdit />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/reports/:id'
			element={
				<ProtectedRoute permission='project_reports:view'>
					<ReportView />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/:id'
			element={
				<ProtectedRoute permission='projects:view'>
					<ProjectView />
				</ProtectedRoute>
			}
		/>
		<Route path='*' element={<PageNotFound />} />
	</Routes>
)

export default Projects
