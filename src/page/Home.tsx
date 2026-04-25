import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppBar from '../components/appbar/AppBar'
import { Flex } from '../components/layout'
import AppLayout from '../components/layout/AppLayout'
import PageLoading from '../components/loading/PageLoading'
import Nav from '../components/nav/Nav'

const PageNotFound = lazy(() => import('./404/PageNotFound'))
const Analytics = lazy(() => import('./analytics'))
const Chat = lazy(() => import('./chat'))
const Proposal = lazy(() => import('./proposal'))
const Leads = lazy(() => import('./leads'))
const BaseKnowledge = lazy(() => import('./base-knowledge'))
const Platforms = lazy(() => import('./platforms'))
const Accounts = lazy(() => import('./accounts'))
const Counterparties = lazy(() => import('./counterparties'))
const ClientRequests = lazy(() => import('./client-requests'))
const Invoices = lazy(() => import('./invoices'))
const JobPosts = lazy(() => import('./job-posts'))
const Prompts = lazy(() => import('./prompts'))
const ClientCalls = lazy(() => import('./client-calls'))
const Settings = lazy(() => import('./settings'))

const Home = () => {
	return (
		<AppLayout>
			<Nav />
			<Flex direction='column' styles={{ minHeight: '100vh' }}>
				<AppBar />
				<main
					style={{
						padding: `1.2rem`,
						width: '100%',
						flex: 1,
						marginTop: '1rem',
					}}
				>
					<Suspense fallback={<PageLoading />}>
						<Routes>
							<Route index element={<Analytics />} />
							<Route path='/dashboards/analytics/' element={<Analytics />} />
							<Route path='/chats' element={<Chat />} />
							<Route path='/proposal/*' element={<Proposal />} />
							<Route path='/leads/*' element={<Leads />} />
							<Route path='/knowledge/*' element={<BaseKnowledge />} />
							<Route path='/platforms/*' element={<Platforms />} />
							<Route path='/accounts/*' element={<Accounts />} />
							<Route path='/counterparties/*' element={<Counterparties />} />
							<Route path='/client-requests/*' element={<ClientRequests />} />
							<Route path='/invoices/*' element={<Invoices />} />
							<Route path='/job-posts/*' element={<JobPosts />} />
							<Route path='/prompts/*' element={<Prompts />} />
							<Route path='/client-calls/*' element={<ClientCalls />} />
							<Route path='/settings' element={<Settings />} />
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
