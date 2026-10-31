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

/* Plain profile name cell — the standalone profile-view page was
 * removed, so this is no longer a link; just typography. */
export const ProfileLink = ({ profile, max = 220 }: Props) => (
	<Name $max={max}>{upworkProfileName(profile)}</Name>
)

const Name = styled.span<{ $max: number }>`
	display: inline-block;
	max-width: ${(p) => p.$max}px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	vertical-align: bottom;
	color: #0f172a;
	font-weight: 600;
	font-size: 13.5px;
`
