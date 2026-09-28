import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppBar from '../components/appbar/AppBar'
import { Flex } from '../components/layout'
import AppLayout from '../components/layout/AppLayout'
import PageLoading from '../components/loading/PageLoading'
import Nav from '../components/nav/Nav'
import ProtectedRoute from '../routes/ProtectedRoute'

const PageNotFound = lazy(() => import('./404/PageNotFound'))
const Analytics = lazy(() => import('./analytics'))
const Finance = lazy(() => import('./analytics/Finance'))
const Proposal = lazy(() => import('./proposal'))
const Leads = lazy(() => import('./leads'))
const Platforms = lazy(() => import('./platforms'))
const Accounts = lazy(() => import('./accounts'))
const Counterparties = lazy(() => import('./counterparties'))
const ClientRequests = lazy(() => import('./client-requests'))
const Invoices = lazy(() => import('./invoices'))
const JobPosts = lazy(() => import('./job-posts'))
const Prompts = lazy(() => import('./prompts'))
const ClientCalls = lazy(() => import('./client-calls'))
const Settings = lazy(() => import('./settings'))
const Roles = lazy(() => import('./roles'))
const EmployeesList = lazy(() => import('./employees/List'))
const EmployeesTimeOff = lazy(() => import('./employees/TimeOff'))
const EmployeesCredentials = lazy(() => import('./employees/Credentials'))
const ProjectsList = lazy(() => import('./projects/List'))
const ProjectsReports = lazy(() => import('./projects/Reports'))
const FinancesPayments = lazy(() => import('./finances/Payments'))
const FinancesSalaries = lazy(() => import('./finances/Salaries'))
const FinancesPaymentSource = lazy(() => import('./finances/PaymentSource'))
const FinancesPromotions = lazy(() => import('./finances/Promotions'))
const LinkedInIdeas = lazy(() => import('./linkedin/Ideas'))
const LinkedInPosts = lazy(() => import('./linkedin/Posts'))

const Home = () => {
	return (
		<AppLayout>
			<Nav />
			<Flex direction='column' styles={{ minHeight: '100vh', minWidth: 0 }}>
				<AppBar />
				<main
					style={{
						padding: `1.2rem`,
						width: '100%',
						flex: 1,
						marginTop: '1rem',
						minWidth: 0,
						overflowX: 'hidden',
					}}
				>
					<Suspense fallback={<PageLoading />}>
						<Routes>
							<Route index element={<Navigate to='/dashboards/sales' replace />} />
							<Route
								path='/dashboards'
								element={<Navigate to='/dashboards/sales' replace />}
							/>
							<Route path='/dashboards/sales' element={<Analytics />} />
							<Route path='/dashboards/finance' element={<Finance />} />
							<Route
								path='/dashboards/analytics/'
								element={<Navigate to='/dashboards/sales' replace />}
							/>
							<Route path='/proposal/*' element={<Proposal />} />
							<Route path='/leads/*' element={<Leads />} />
							<Route path='/platforms/*' element={<Platforms />} />
							<Route path='/accounts/*' element={<Accounts />} />
							<Route path='/counterparties/*' element={<Counterparties />} />
							<Route path='/client-requests/*' element={<ClientRequests />} />
							<Route path='/invoices/*' element={<Invoices />} />
							<Route path='/job-posts/*' element={<JobPosts />} />
							<Route
								path='/prompts/*'
								element={
									<ProtectedRoute permission='prompts:view'>
										<Prompts />
									</ProtectedRoute>
								}
							/>
							<Route path='/client-calls/*' element={<ClientCalls />} />
							<Route path='/settings' element={<Settings />} />
							<Route
								path='/roles/*'
								element={
									<ProtectedRoute permission='roles:view'>
										<Roles />
									</ProtectedRoute>
								}
							/>
							<Route path='/employees/list' element={<EmployeesList />} />
							<Route path='/employees/time-off' element={<EmployeesTimeOff />} />
							<Route path='/employees/credentials' element={<EmployeesCredentials />} />
							<Route path='/projects/list' element={<ProjectsList />} />
							<Route path='/projects/reports' element={<ProjectsReports />} />
							<Route path='/finances/payments' element={<FinancesPayments />} />
							<Route path='/finances/salaries' element={<FinancesSalaries />} />
							<Route path='/finances/payment-source' element={<FinancesPaymentSource />} />
							<Route path='/finances/promotions' element={<FinancesPromotions />} />
							<Route path='/linkedin/ideas' element={<LinkedInIdeas />} />
							<Route path='/linkedin/posts' element={<LinkedInPosts />} />
							<Route path='/*' element={<PageNotFound />} />
						</Routes>
					</Suspense>
				</main>
				{/*<Footer />*/}
			</Flex>
		</AppLayout>
	)
}
export default Home
