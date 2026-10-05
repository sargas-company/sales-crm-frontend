import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import useTheme from '../../theme/useTheme'
import { Tab, TabContent, TabItem, TabList } from '../../ui'
import JobPostAnalyticsDrawer from '../../components/sales-analytics/posts/JobPostAnalyticsDrawer'
import SalesFiltersBar from './filters/SalesFiltersBar'
import OverviewTab from './tabs/OverviewTab'
import SoonCursorOverlay from './SoonCursorOverlay'
import {
	Crumbs,
	PageHead,
	ShellCard,
	ShellInner,
	SoonBadge,
	TabLabel,
	TabsWrap,
	ViewFade,
} from './salesAnalytics.styled'

const Analytics = () => {
	const [, setSearchParams] = useSearchParams()
	const {
		theme: { mode, primaryColor },
	} = useTheme()

	const setTab = useCallback(() => {
		setSearchParams(
			(prev) => {
				const p = new URLSearchParams(prev)
				p.delete('tab')
				return p
			},
			{ replace: true }
		)
	}, [setSearchParams])

	return (
		<ThemeProvider theme={{ mode, primaryColor }}>
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<span className='crumb-dot' aria-hidden='true' />
							<span className='current'>Sales dashboard</span>
						</Crumbs>

						<PageHead>
							<div className='title'>
								<h1>Sales</h1>
								<p>Scanner activity, market intelligence, and emerging demand signals.</p>
							</div>
							<div className='title-right' aria-hidden='true'>
								<span className='hand-line'>signal over noise</span>
								<span className='hand-flourish'>
									<svg viewBox='0 0 120 20' width='120' height='20'>
										<path
											d='M2 12 C 28 2, 60 22, 96 6'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
										/>
										<path
											d='M88 4 L 98 6 L 92 14'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</span>
							</div>
						</PageHead>

						<SalesFiltersBar />

						<TabsWrap>
							<Tab value={0}>
								<TabList>
									<TabItem value={0} label='Overview' onClick={() => setTab()} />
									<TabItem
										value={1}
										disabled
										label={
											(
												<TabLabel>
													Market Intelligence
													<SoonBadge aria-label='Coming soon'>Soon</SoonBadge>
												</TabLabel>
											) as unknown as React.ReactNode
										}
									/>
									<TabItem
										value={2}
										disabled
										label={
											(
												<TabLabel>
													Emerging Signals
													<SoonBadge aria-label='Coming soon'>Soon</SoonBadge>
												</TabLabel>
											) as unknown as React.ReactNode
										}
									/>
								</TabList>
								<TabContent tabIndex={0}>
									<OverviewTab />
								</TabContent>
							</Tab>
						</TabsWrap>
					</ShellInner>
				</ShellCard>

				<JobPostAnalyticsDrawer />
				<SoonCursorOverlay />
			</ViewFade>
		</ThemeProvider>
	)
}

export default Analytics
