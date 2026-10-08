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
const Proposal = lazy(() => import('./proposal'))
const Leads = lazy(() => import('./leads'))
const Platforms = lazy(() => import('./platforms'))
const Accounts = lazy(() => import('./accounts'))
const Counterparties = lazy(() => import('./counterparties'))
const Clients = lazy(() => import('./clients'))
const ClientRequests = lazy(() => import('./client-requests'))
const Invoices = lazy(() => import('./invoices'))
const JobPosts = lazy(() => import('./job-posts'))
const Prompts = lazy(() => import('./prompts'))
const ClientCalls = lazy(() => import('./client-calls'))
const Settings = lazy(() => import('./settings'))
const Roles = lazy(() => import('./roles'))
const Employees = lazy(() => import('./employees'))
const Credentials = lazy(() => import('./credentials'))
const Projects = lazy(() => import('./projects'))
const ProjectAnalytics = lazy(() => import('./analytics/projects/ProjectAnalytics.page'))
const FinancialPaymentsMonth = lazy(() => import('./finance-weekly/FinancialMonth.page'))
const FinancialPaymentsList = lazy(() => import('./finance-weekly/FinancialList.page'))
const FinancialAnalytics = lazy(() => import('./finance-weekly/FinancialAnalytics.page'))
const TimeOffAnalytics = lazy(() => import('./analytics/time-off/TimeOffAnalytics.page'))
const CompensationAnalytics = lazy(
	() => import('./analytics/compensation/CompensationAnalytics.page')
)
const FinancesSalaries = lazy(() => import('./finances/Salaries'))
const FinancesSalariesRun = lazy(() => import('./finances/SalariesRun'))
const FinancesSalariesAdd = lazy(() => import('./finances/SalariesAdd'))
const FinancesSalariesEdit = lazy(() => import('./finances/SalariesEdit'))
const FinancesPaymentSource = lazy(() => import('./finances/PaymentSource'))
const FinancesPaymentSourceAdd = lazy(() => import('./finances/PaymentSourceAdd'))
const FinancesPaymentSourceEdit = lazy(() => import('./finances/PaymentSourceEdit'))
const FinancesPromotions = lazy(() => import('./finances/Promotions'))
const FinancesPromotionsAdd = lazy(() => import('./finances/PromotionsAdd'))
const FinancesPromotionsEdit = lazy(() => import('./finances/PromotionsEdit'))
const LinkedInIdeas = lazy(() => import('./linkedin/Ideas'))
const LinkedInIdeasAdd = lazy(() => import('./linkedin/IdeasAdd'))
const LinkedInIdeasEdit = lazy(() => import('./linkedin/IdeasEdit'))
const LinkedInIdeasView = lazy(() => import('./linkedin/IdeasView'))
const LinkedInPosts = lazy(() => import('./linkedin/Posts'))
const LinkedInPostsAdd = lazy(() => import('./linkedin/PostsAdd'))
const LinkedInPostsEdit = lazy(() => import('./linkedin/PostsEdit'))
const LinkedInPostsView = lazy(() => import('./linkedin/PostsView'))
const LinkedInAccounts = lazy(() => import('./linkedin/AccountsList'))
const LinkedInAccountsAdd = lazy(() => import('./linkedin/AccountsAdd'))
const LinkedInAccountsEdit = lazy(() => import('./linkedin/AccountsEdit'))
const AuditLogAllActivity = lazy(() => import('./audit-log/AllActivity'))
const AuditLogAccessSecurity = lazy(() => import('./audit-log/AccessSecurity'))
const AuditLogFinancialActivity = lazy(() => import('./audit-log/FinancialActivity'))
const AuditLogDataChanges = lazy(() => import('./audit-log/DataChanges'))
const AuditLogSensitiveAccess = lazy(() => import('./audit-log/SensitiveAccess'))
const AuditLogEventPage = lazy(() => import('./audit-log/_shared/AuditEventPage'))
const PhoneNumbersList = lazy(() => import('./phone-numbers/PhoneNumbersList.page'))
const PhoneAssignments = lazy(() => import('./phone-numbers/PhoneAssignments.page'))
const PhoneMaintenancePage = lazy(() => import('./phone-numbers/PhoneMaintenance.page'))
const PhoneServicesPage = lazy(() => import('./phone-numbers/PhoneServices.page'))
const PhoneServiceForm = lazy(() => import('./phone-numbers/PhoneServiceForm.page'))
const PhoneNumberForm = lazy(() => import('./phone-numbers/PhoneNumberForm.page'))
const Backups = lazy(() => import('./backups'))
const Notifications = lazy(() => import('./notifications'))
const PortfolioList = lazy(() => import('./portfolio/PortfolioList.page'))
const PortfolioView = lazy(() => import('./portfolio/PortfolioView.page'))
const PortfolioForm = lazy(() => import('./portfolio/PortfolioForm.page'))
const Runbook = lazy(() => import('./runbook/Runbook.page'))
const RunbookDetail = lazy(() => import('./runbook/RunbookDetail.page'))
const Help = lazy(() => import('./help/Help.page'))
const HelpDetail = lazy(() => import('./help/HelpDetail.page'))

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
							<Route
								path='/dashboards/finances'
								element={
									<ProtectedRoute permission='finances_weekly:view'>
										<FinancialAnalytics />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/dashboards/time-off'
								element={
									<ProtectedRoute permission='employee_analytics:view'>
										<TimeOffAnalytics />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/dashboards/compensation'
								element={
									<ProtectedRoute permission='compensation_analytics:view'>
										<CompensationAnalytics />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/dashboards/projects'
								element={
									<ProtectedRoute permission='project_analytics:view'>
										<ProjectAnalytics />
									</ProtectedRoute>
								}
							/>
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
								path='/clients/*'
								element={
									<ProtectedRoute permission='clients:view'>
										<Clients />
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
								path='/backups/*'
								element={
									<ProtectedRoute permission='backups:view'>
										<Backups />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/notifications/*'
								element={
									<ProtectedRoute permission='notifications:view'>
										<Notifications />
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
							<Route
								path='/employees/*'
								element={
									<ProtectedRoute permission='employees:view'>
										<Employees />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/credentials/*'
								element={
									<ProtectedRoute permission='credentials:view'>
										<Credentials />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/projects/*'
								element={
									<ProtectedRoute permission='projects:view'>
										<Projects />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/payments'
								element={
									<ProtectedRoute permission='finances_weekly:view'>
										<FinancialPaymentsMonth />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/payments/month/:id'
								element={
									<ProtectedRoute permission='finances_weekly:view'>
										<FinancialPaymentsMonth />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/payments-list'
								element={
									<ProtectedRoute permission='finances_weekly:view'>
										<FinancialPaymentsList />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/payments-list/:id'
								element={
									<ProtectedRoute permission='finances_weekly:view'>
										<FinancialPaymentsList />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/salaries'
								element={
									<ProtectedRoute permission='salaries:view'>
										<FinancesSalaries />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/salaries/run'
								element={
									<ProtectedRoute permission='salaries:view'>
										<FinancesSalariesRun />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/salaries/add'
								element={
									<ProtectedRoute permission='salaries:create'>
										<FinancesSalariesAdd />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/salaries/edit/:id'
								element={
									<ProtectedRoute permission='salaries:update'>
										<FinancesSalariesEdit />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/payment-source'
								element={
									<ProtectedRoute permission='payment_sources:view'>
										<FinancesPaymentSource />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/payment-source/add'
								element={
									<ProtectedRoute permission='payment_sources:create'>
										<FinancesPaymentSourceAdd />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/payment-source/edit/:id'
								element={
									<ProtectedRoute permission='payment_sources:update'>
										<FinancesPaymentSourceEdit />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/promotions'
								element={
									<ProtectedRoute permission='compensation_reviews:view'>
										<FinancesPromotions />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/promotions/add'
								element={
									<ProtectedRoute permission='compensation_reviews:create'>
										<FinancesPromotionsAdd />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/finances/promotions/edit/:id'
								element={
									<ProtectedRoute permission='compensation_reviews:update'>
										<FinancesPromotionsEdit />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/posts'
								element={
									<ProtectedRoute permission='linkedin_posts:view'>
										<LinkedInPosts />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/posts/add'
								element={
									<ProtectedRoute permission='linkedin_posts:create'>
										<LinkedInPostsAdd />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/posts/edit/:id'
								element={
									<ProtectedRoute permission='linkedin_posts:update'>
										<LinkedInPostsEdit />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/posts/:id'
								element={
									<ProtectedRoute permission='linkedin_posts:view'>
										<LinkedInPostsView />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/ideas'
								element={
									<ProtectedRoute permission='linkedin_ideas:view'>
										<LinkedInIdeas />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/ideas/add'
								element={
									<ProtectedRoute permission='linkedin_ideas:create'>
										<LinkedInIdeasAdd />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/ideas/edit/:id'
								element={
									<ProtectedRoute permission='linkedin_ideas:update'>
										<LinkedInIdeasEdit />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/ideas/:id'
								element={
									<ProtectedRoute permission='linkedin_ideas:view'>
										<LinkedInIdeasView />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/accounts'
								element={
									<ProtectedRoute permission='linkedin_accounts:view'>
										<LinkedInAccounts />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/accounts/add'
								element={
									<ProtectedRoute permission='linkedin_accounts:create'>
										<LinkedInAccountsAdd />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/linkedin/accounts/edit/:id'
								element={
									<ProtectedRoute permission='linkedin_accounts:update'>
										<LinkedInAccountsEdit />
									</ProtectedRoute>
								}
							/>
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
								path='/audit-log/financial-activity'
								element={
									<ProtectedRoute permission='audit_logs:view'>
										<AuditLogFinancialActivity />
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
							<Route
								path='/audit-log/event/:eventId'
								element={
									<ProtectedRoute permission='audit_logs:view'>
										<AuditLogEventPage />
									</ProtectedRoute>
								}
							/>
							{/* Phone Numbers */}
							<Route
								path='/phone-numbers'
								element={
									<ProtectedRoute permission='phone_numbers:view'>
										<PhoneNumbersList />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/new'
								element={
									<ProtectedRoute permission='phone_numbers:create'>
										<PhoneNumberForm mode='create' />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/edit/:id'
								element={
									<ProtectedRoute permission='phone_numbers:update'>
										<PhoneNumberForm mode='edit' />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/view/:id'
								element={
									<ProtectedRoute permission='phone_numbers:view'>
										<PhoneNumberForm mode='view' />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/assignments'
								element={
									<ProtectedRoute permission='phone_numbers:view'>
										<PhoneAssignments />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/maintenance'
								element={
									<ProtectedRoute permission='phone_numbers:view'>
										<PhoneMaintenancePage />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/services'
								element={
									<ProtectedRoute permission='phone_numbers:view'>
										<PhoneServicesPage />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/services/new'
								element={
									<ProtectedRoute permission='phone_numbers:update'>
										<PhoneServiceForm mode='create' />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/services/:id'
								element={
									<ProtectedRoute permission='phone_numbers:view'>
										<PhoneServiceForm mode='view' />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/phone-numbers/services/:id/edit'
								element={
									<ProtectedRoute permission='phone_numbers:update'>
										<PhoneServiceForm mode='edit' />
									</ProtectedRoute>
								}
							/>
							{/* Portfolio */}
							<Route
								path='/portfolio'
								element={
									<ProtectedRoute permission='portfolio:view'>
										<PortfolioList />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/portfolio/new'
								element={
									<ProtectedRoute permission='portfolio:create'>
										<PortfolioForm mode='create' />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/portfolio/:slug/edit'
								element={
									<ProtectedRoute permission='portfolio:update'>
										<PortfolioForm mode='edit' />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/portfolio/:slug'
								element={
									<ProtectedRoute permission='portfolio:view'>
										<PortfolioView />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/runbook'
								element={
									<ProtectedRoute>
										<Runbook />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/runbook/:slug'
								element={
									<ProtectedRoute>
										<RunbookDetail />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/help'
								element={
									<ProtectedRoute>
										<Help />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/help/:slug'
								element={
									<ProtectedRoute>
										<HelpDetail />
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
