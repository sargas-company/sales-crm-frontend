import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { upworkProfileName } from '../../../store/upwork/upworkApi'

interface Props {
	profile: {
		id: string
		firstName: string
		lastName: string | null
	}
	max?: number
}

/* Clickable firstName+lastName — jumps to the profile view page.
 * Alias for the full Upwork URL; the raw URL lives inside the view
 * page, not in list cells. */
export const ProfileLink = ({ profile, max = 220 }: Props) => (
	<StyledLink to={`/upwork/profiles/${profile.id}`} $max={max}>
		{upworkProfileName(profile)}
	</StyledLink>
)

const StyledLink = styled(Link)<{ $max: number }>`
	display: inline-block;
	max-width: ${(p) => p.$max}px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	vertical-align: bottom;
	color: #0f172a;
	font-weight: 600;
	font-size: 13.5px;
	text-decoration: none;
	border-bottom: 1px solid transparent;
	transition:
		color 160ms ease,
		border-color 160ms ease;
	&:hover {
		color: #0369a1;
		border-bottom-color: rgba(3, 105, 161, 0.4);
	}
`
