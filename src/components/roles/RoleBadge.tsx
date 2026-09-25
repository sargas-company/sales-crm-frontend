import { FC } from 'react'
import { RoleType } from '../../store/roles/types'
import { Badge } from './roles.styled'

const label: Record<RoleType, string> = {
	system: 'system',
	default: 'default',
	custom: 'custom',
}

const RoleBadge: FC<{ type: RoleType }> = ({ type }) => (
	<Badge variant={type}>{label[type]}</Badge>
)

export default RoleBadge
