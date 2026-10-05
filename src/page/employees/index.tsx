import { Routes, Route } from 'react-router-dom'
import PageNotFound from '../404/PageNotFound'
import ProtectedRoute from '../../routes/ProtectedRoute'
import EmployeeList from './list/EmployeeList.page'
import EmployeeAdd from './add/EmployeeAdd'
import EmployeeEdit from './edit/EmployeeEdit.page'
import EmployeeView from './view/EmployeeView.page'
import TimeOffList from './time-off/list/TimeOffList.page'
import TimeOffAdd from './time-off/add/TimeOffAdd'
import TimeOffEdit from './time-off/edit/TimeOffEdit.page'
import TimeOffView from './time-off/view/TimeOffView.page'

// Time Off is backed by real endpoints — list / view / add / edit
// under /employees/time-off/*. The real Credentials vault lives at
// top-level /credentials (its own module); there is no sub-page here.
const Employees = () => (
	<Routes>
		<Route path='/list' element={<EmployeeList />} />
		<Route path='/list/' element={<EmployeeList />} />
		<Route
			path='/add'
			element={
				<ProtectedRoute permission='employees:create'>
					<EmployeeAdd />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/edit/:id'
			element={
				<ProtectedRoute permission='employees:update'>
					<EmployeeEdit />
				</ProtectedRoute>
			}
		/>
		{/* Time Off sub-routes — declared before the /:id catch-all so
		    the string "time-off" is not treated as an employee UUID. */}
		<Route
			path='/time-off'
			element={
				<ProtectedRoute permission='time_off:view'>
					<TimeOffList />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/time-off/add'
			element={
				<ProtectedRoute permission='time_off:create'>
					<TimeOffAdd />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/time-off/edit/:id'
			element={
				<ProtectedRoute permission='time_off:update'>
					<TimeOffEdit />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/time-off/:id'
			element={
				<ProtectedRoute permission='time_off:view'>
					<TimeOffView />
				</ProtectedRoute>
			}
		/>
		<Route
			path='/:id'
			element={
				<ProtectedRoute permission='employees:view'>
					<EmployeeView />
				</ProtectedRoute>
			}
		/>
		<Route path='*' element={<PageNotFound />} />
	</Routes>
)

export default Employees
