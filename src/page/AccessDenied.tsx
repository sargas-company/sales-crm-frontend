import styled from 'styled-components'
import { Link as RouterLink } from 'react-router-dom'
import { LockOutlined } from '@mui/icons-material'
import Box from '../components/box/Box'
import { Text } from '../ui'
import usePermissions from '../hooks/usePermissions'
import { firstAvailableLandingPath } from '../routes/landing'

/**
 * Authenticated-only fallback when the caller lacks the permission
 * the target route required. Uses the shared visual language of the
 * app (Text + Box + INK-neutral copy) — no redesign, no new tokens.
 * Every business route already redirects here via <ProtectedRoute>.
 */
const AccessDenied = () => {
	const { has } = usePermissions()
	const fallback = firstAvailableLandingPath(has)

	return (
		<StyledSection>
			<Box display='flex' flexDirection='column' align='center' py={32} px={28} space={0.6}>
				<IconWrap aria-hidden='true'>
					<LockOutlined />
				</IconWrap>
				<Text heading='h3'>Access denied</Text>
				<Text varient='body1' align='center' paragraph secondary>
					Your role doesn't include permission to open this page. Ask an
					administrator to grant it, or open a section you already have
					access to.
				</Text>
				{fallback && (
					<Text align='center' varient='body2'>
						<RouterLink to={fallback} className='fallback-link'>
							Go to a section you can open →
						</RouterLink>
					</Text>
				)}
			</Box>
		</StyledSection>
	)
}

export default AccessDenied

const StyledSection = styled('section')`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 60vh;

	.fallback-link {
		color: #0369a1;
		text-decoration: none;
		font-weight: 600;
	}
	.fallback-link:hover {
		text-decoration: underline;
	}
`

const IconWrap = styled('span')`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 64px;
	height: 64px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: rgba(3, 105, 161, 0.9);
	margin-bottom: 12px;

	svg {
		font-size: 32px;
	}
`
