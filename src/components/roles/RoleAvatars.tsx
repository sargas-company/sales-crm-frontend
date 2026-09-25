import { FC } from 'react'
import useTheme from '../../theme/useTheme'
import { UserPreview } from '../../store/roles/types'
import { AvatarChip, AvatarCluster } from './roles.styled'

const PALETTE = ['#3C4CE0', '#A83B29', '#2F7A50', '#8A6B00', '#5B4396', '#0E7A8A', '#8A2E5B']

const initials = (name: string) =>
	name
		.split(' ')
		.map((w) => w[0])
		.slice(0, 2)
		.join('')
		.toUpperCase()

const color = (name: string) => PALETTE[name.charCodeAt(0) % PALETTE.length]

const RoleAvatars: FC<{ users: UserPreview[]; max?: number }> = ({ users, max = 3 }) => {
	const {
		theme: { mode },
	} = useTheme()
	const shown = users.slice(0, max)
	const rest = users.length - shown.length
	return (
		<AvatarCluster>
			{shown.map((u) => (
				<AvatarChip key={u.id} bg={color(u.name)} dark={mode.name === 'dark'} title={u.name}>
					{initials(u.name)}
				</AvatarChip>
			))}
			{rest > 0 && (
				<span
					style={{
						marginLeft: 8,
						fontSize: 13,
						fontWeight: 600,
						color: mode.name === 'dark' ? 'rgba(211, 211, 211, 0.55)' : '#7a7686',
					}}
				>
					+{rest}
				</span>
			)}
			{users.length === 0 && (
				<span
					style={{
						fontSize: 13,
						color: mode.name === 'dark' ? 'rgba(211, 211, 211, 0.35)' : '#a5a1b0',
					}}
				>
					-
				</span>
			)}
		</AvatarCluster>
	)
}

export default RoleAvatars
