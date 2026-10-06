import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import useTheme from '../../theme/useTheme'
import Box from '../box/Box'
import Card from '../card/Card'
import ProfileDropdown from './components/ProfileDropdown'
import NotificationBell from './components/NotificationBell'
import { T } from '../sales-analytics/_shared/tokens'

const AppBar = () => {
	const {
		theme: {
			mode,
			layout: { appBarBlur, appBarPosition },
			menuStyle: { layout },
		},
	} = useTheme()
	const navigate = useNavigate()

	return (
		<StyledThemeProvider theme={(outer) => ({ ...outer, mode, appBarBlur })}>
			<StyledAppBar
				className={`${
					appBarPosition === 'hidden'
						? 'appbar-hidden'
						: appBarPosition === 'static'
							? 'appbar-static'
							: 'appbar-fixed'
				} ${layout === 'horizontal' ? 'no_padding' : ''}`}
			>
				<Card className='appbar-content'>
					<Box
						display='flex'
						justify='flex-end'
						align='center'
						height='100%'
						px={layout === 'horizontal' ? 20 : 0}
					>
						<Box display='flex' align='center' space={0.6}>
							<ResourceGroup aria-label='Resources'>
								<HashLink
									type='button'
									onClick={() => navigate('/runbook')}
									aria-label='Runbook'
								>
									<Hash aria-hidden='true'>#</Hash>runbook
								</HashLink>
								<HashLink
									type='button'
									onClick={() => navigate('/help')}
									aria-label='Help and FAQ'
								>
									<Hash aria-hidden='true'>#</Hash>help
								</HashLink>
							</ResourceGroup>

							<NotificationBell />
							<ProfileDropdown />
						</Box>
					</Box>
				</Card>
			</StyledAppBar>
		</StyledThemeProvider>
	)
}

export default AppBar

/* Resource links in the header — mono hashtag style (V14):
   #runbook  #help  #sargas  #upwork  #clutch
   Orange "#" accent, textSecondary body → primary blue on hover. */

const ResourceGroup = styled('div')`
	display: inline-flex;
	align-items: center;
	gap: 14px;
	margin-right: 10px;
`

const HashLink = styled('button')`
	display: inline-flex;
	align-items: baseline;
	padding: 4px 2px;
	border: 0;
	background: transparent;
	color: ${T.textSecondary};
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.2px;
	cursor: pointer;
	transition: color 160ms ease;

	&:hover {
		color: ${T.primary};
	}

	[data-theme='dark'] & {
		color: rgba(226, 232, 240, 0.72);

		&:hover {
			color: #ffffff;
		}
	}
`

const Hash = styled('span')`
	color: #e85d2f;
	opacity: 0.75;
	margin-right: 5px;
`

const StyledAppBar = styled('header')`
	min-height: ${({ theme }) => `${theme.spacing!.xxxl + theme.spacing!.lg}px`};
	width: 100%;
	top: 0px;
	left: auto;
	right: 0px;
	padding: 0 ${({ theme }) => `${theme.spacing!.lg}px`};
	z-index: ${({ theme }) => theme.zIndex!.overlay};
	&.no_padding {
		padding: 0;
	}

	&.appbar-fixed {
		position: sticky;
	}
	&.appbar-static {
		position: relative;
	}
	&.appbar-hidden {
		display: none;
	}
	&.no_padding > .appbar-content {
		padding: 0;
	}
	& > .appbar-content {
		display: flex;
		flex-direction: column;
		${({ theme }) =>
			theme.appBarBlur
				? `background: color-mix(in srgb, ${theme.colors!.bg.surface} ${
						theme.mode.name === 'dark' ? '80%' : '57%'
					}, transparent);`
				: ''}
		width: 100%;
		height: 100%;
		flex: 0 0 auto;
		padding: 0 ${({ theme }) => `${theme.spacing!.lg}px`};
		border-radius: 0 0 28px 28px;
		transition: padding 300ms;
		${({ theme }) => (theme.appBarBlur ? `backdrop-filter: blur(10px);` : '')}
		z-index: ${({ theme }) => theme.zIndex!.overlay};
	}

	.horizontal_nav_bar {
		display: none;

		@media (min-width: ${({ theme }) => `${theme.breakpoint!.lg}px`}) {
			display: block;
		}
	}
`
