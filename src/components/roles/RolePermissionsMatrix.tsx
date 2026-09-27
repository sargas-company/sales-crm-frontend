import { useMemo } from 'react'
import styled from 'styled-components'
import type { Permission, Role } from '../../store/roles/types'
import { OWNER_SLUG, ROLE_ERROR_MESSAGES } from '../../store/roles/types'

interface Props {
	role: Role
	catalogue: Permission[]
	selected: Set<string>
	onToggle: (key: string) => void
	disabled?: boolean
}

const RolePermissionsMatrix = ({ role, catalogue, selected, onToggle, disabled }: Props) => {
	const ownerLocked = role.name === OWNER_SLUG
	const readOnly = disabled || ownerLocked

	const grouped = useMemo(() => {
		const map = new Map<string, Permission[]>()
		for (const p of catalogue) {
			const list = map.get(p.module) ?? []
			list.push(p)
			map.set(p.module, list)
		}
		return Array.from(map.entries())
			.map(
				([module, perms]) =>
					[module, perms.sort((a, b) => a.action.localeCompare(b.action))] as const
			)
			.sort((a, b) => a[0].localeCompare(b[0]))
	}, [catalogue])

	return (
		<Wrapper>
			{ownerLocked && <LockNote>{ROLE_ERROR_MESSAGES.OWNER_PERMISSIONS_LOCKED}</LockNote>}
			<Grid>
				{grouped.map(([module, perms]) => (
					<GroupCard key={module}>
						<GroupHead>{module}</GroupHead>
						<PermList>
							{perms.map((p) => {
								const isChecked = selected.has(p.key)
								return (
									<PermRow key={p.id}>
										<input
											type='checkbox'
											checked={isChecked}
											disabled={readOnly}
											onChange={() => onToggle(p.key)}
											title={
												ownerLocked
													? ROLE_ERROR_MESSAGES.OWNER_PERMISSIONS_LOCKED
													: (p.label ?? p.key)
											}
											aria-label={p.key}
										/>
										<PermKey>{p.action}</PermKey>
										<PermHint>{p.label ?? p.key}</PermHint>
									</PermRow>
								)
							})}
						</PermList>
					</GroupCard>
				))}
			</Grid>
		</Wrapper>
	)
}

export default RolePermissionsMatrix

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.md}px;
`

const LockNote = styled.div`
	background: color-mix(in srgb, ${({ theme }) => theme.colors!.status.warning} 12%, transparent);
	border: 1px solid
		color-mix(in srgb, ${({ theme }) => theme.colors!.status.warning} 32%, transparent);
	border-radius: ${({ theme }) => theme.radius!.md}px;
	padding: ${({ theme }) => theme.spacing!.md}px;
	color: ${({ theme }) => theme.colors!.text.primary};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	gap: ${({ theme }) => theme.spacing!.md}px;
`

const GroupCard = styled.div`
	background: ${({ theme }) => theme.colors!.bg.surface};
	border: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ theme }) => theme.radius!.md}px;
	padding: ${({ theme }) => theme.spacing!.md}px;
`

const GroupHead = styled.div`
	font: ${({ theme }) => theme.typography!.overline.fontWeight}
		${({ theme }) => theme.typography!.overline.fontSize} /
		${({ theme }) => theme.typography!.overline.lineHeight}
		${({ theme }) => theme.typography!.overline.fontFamily};
	color: ${({ theme }) => theme.colors!.text.secondary};
	letter-spacing: ${({ theme }) => theme.typography!.overline.letterSpacing};
	margin-bottom: ${({ theme }) => theme.spacing!.sm}px;
`

const PermList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
`

const PermRow = styled.label`
	display: grid;
	grid-template-columns: auto 90px 1fr;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
	color: ${({ theme }) => theme.colors!.text.primary};
	cursor: pointer;

	input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
`

const PermKey = styled.span`
	font-weight: 500;
`

const PermHint = styled.span`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
`
