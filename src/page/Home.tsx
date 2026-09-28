import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppBar from '../components/appbar/AppBar'
import { Flex } from '../components/layout'
import AppLayout from '../components/layout/AppLayout'
import PageLoading from '../components/loading/PageLoading'
import Nav from '../components/nav/Nav'
import ProtectedRoute from '../routes/ProtectedRoute'
import LandingRedirect from '../routes/LandingRedirect'

const PageNotFound = lazy(() => import('./404/PageNotFound'))
const AccessDenied = lazy(() => import('./AccessDenied'))
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
const AuditLogAllActivity = lazy(() => import('./audit-log/AllActivity'))
const AuditLogAccessSecurity = lazy(() => import('./audit-log/AccessSecurity'))
const AuditLogDataChanges = lazy(() => import('./audit-log/DataChanges'))
const AuditLogSensitiveAccess = lazy(() => import('./audit-log/SensitiveAccess'))

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
							<Route index element={<LandingRedirect />} />
							<Route path='/dashboards' element={<LandingRedirect />} />
							<Route path='/dashboards/analytics/' element={<LandingRedirect />} />
							<Route path='/access-denied' element={<AccessDenied />} />
							<Route
								path='/dashboards/sales'
								element={
									<ProtectedRoute permission='sales_analytics:view'>
										<Analytics />
									</ProtectedRoute>
								}
							/>
							<Route path='/dashboards/finance' element={<Finance />} />
							<Route
								path='/proposal/*'
								element={
									<ProtectedRoute permission='proposals:view'>
										<Proposal />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/leads/*'
								element={
									<ProtectedRoute permission='leads:view'>
										<Leads />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/platforms/*'
								element={
									<ProtectedRoute permission='platforms:view'>
										<Platforms />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/accounts/*'
								element={
									<ProtectedRoute permission='accounts:view'>
										<Accounts />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/counterparties/*'
								element={
									<ProtectedRoute permission='counterparties:view'>
										<Counterparties />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/client-requests/*'
								element={
									<ProtectedRoute permission='client_requests:view'>
										<ClientRequests />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/invoices/*'
								element={
									<ProtectedRoute permission='invoices:view'>
										<Invoices />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/job-posts/*'
								element={
									<ProtectedRoute permission='job_posts:view'>
										<JobPosts />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/prompts/*'
								element={
									<ProtectedRoute permission='prompts:view'>
										<Prompts />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/client-calls/*'
								element={
									<ProtectedRoute permission='client_calls:view'>
										<ClientCalls />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/settings'
								element={
									<ProtectedRoute permission='settings:view'>
										<Settings />
									</ProtectedRoute>
								}
							/>
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
							<Route
								path='/audit-log/all-activity'
								element={
									<ProtectedRoute permission='audit_logs:view'>
										<AuditLogAllActivity />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/audit-log/access-security'
								element={
									<ProtectedRoute permission='audit_logs:view'>
										<AuditLogAccessSecurity />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/audit-log/data-changes'
								element={
									<ProtectedRoute permission='audit_logs:view'>
										<AuditLogDataChanges />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/audit-log/sensitive-access'
								element={
									<ProtectedRoute permission='audit_logs:view'>
										<AuditLogSensitiveAccess />
									</ProtectedRoute>
								}
							/>
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
