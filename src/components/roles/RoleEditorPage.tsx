import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import PageShell from '../../ui/page/PageShell'
import PageHeader from '../../ui/page/PageHeader'
import SectionCard from '../../ui/surface/SectionCard'
import Input from '../../ui/form/Input'
import Badge from '../../ui/badge/Badge'
import Loading from '../../ui/state/Loading'
import ErrorState from '../../ui/state/ErrorState'
import { Button } from '../../ui'
import PermissionGate from '../auth/PermissionGate'
import RolePermissionsMatrix from './RolePermissionsMatrix'
import {
	useAssignUserRoleMutation,
	useListPermissionsQuery,
	useListRolesQuery,
	useUpdateRoleMutation,
} from '../../store/roles/rolesApi'
import { OWNER_SLUG } from '../../store/roles/types'
import { useToast } from '../../context/toast/ToastContext'
import { extractRoleErrorMessage } from './errorMessage'

const RoleEditorPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const toast = useToast()

	const rolesQuery = useListRolesQuery()
	const permsQuery = useListPermissionsQuery()
	const [updateRole, { isLoading: isSaving }] = useUpdateRoleMutation()
	const [assignUserRole, { isLoading: isAssigning }] = useAssignUserRoleMutation()

	const role = useMemo(
		() => rolesQuery.data?.find((r) => r.id === id) ?? null,
		[rolesQuery.data, id]
	)

	const [label, setLabel] = useState('')
	const [description, setDescription] = useState('')
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [assignUserId, setAssignUserId] = useState('')

	// Rehydrate local form state only when the ROLE ID changes (initial
	// load or navigation to a different role). A refetch of the same id
	// (e.g., after `assignUserRole` invalidates the list cache and RTK
	// Query returns a fresh role object) MUST NOT overwrite unsaved
	// edits — dep is intentionally `role?.id`, not `role`.
	useEffect(() => {
		if (!role) return
		setLabel(role.label)
		setDescription(role.description ?? '')
		setSelected(new Set(role.permissions.map((p) => p.key)))
	}, [role?.id])

	if (rolesQuery.isLoading || permsQuery.isLoading) {
		return (
			<PageShell>
				<Loading label='Loading role…' />
			</PageShell>
		)
	}
	if (rolesQuery.isError || permsQuery.isError || !role) {
		return (
			<PageShell>
				<ErrorState
					title='Role not available'
					description='Could not load role or permission catalogue.'
					action={<Button onClick={() => navigate('/roles')}>Back to list</Button>}
				/>
			</PageShell>
		)
	}

	const ownerLocked = role.name === OWNER_SLUG
	const initialKeys = new Set(role.permissions.map((p) => p.key))
	const permsChanged = !setsEqual(initialKeys, selected)
	const labelChanged = label !== role.label
	const descChanged = (description || null) !== (role.description || null)
	const dirty = labelChanged || descChanged || permsChanged

	const handleToggle = (key: string) => {
		if (ownerLocked) return
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})
	}

	const handleSave = async () => {
		try {
			const payload: {
				id: string
				label?: string
				description?: string
				permissionKeys?: string[]
			} = { id: role.id }
			if (labelChanged) payload.label = label
			if (descChanged) payload.description = description
			if (permsChanged && !ownerLocked) payload.permissionKeys = Array.from(selected).sort()
			await updateRole(payload).unwrap()
			toast.showToast('Role updated', 'success')
		} catch (err) {
			toast.showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	const handleAssign = async () => {
		if (!assignUserId) return
		try {
			await assignUserRole({ userId: assignUserId, roleId: role.id }).unwrap()
			toast.showToast('User assigned to role', 'success')
			setAssignUserId('')
		} catch (err) {
			toast.showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	return (
		<PageShell>
			<PageHeader
				title={role.label}
				subtitle={
					<HeaderMeta>
						<Badge tone={role.system ? 'accent' : 'neutral'} variant='subtle'>
							{role.system ? 'system' : 'custom'}
						</Badge>
						<span>Slug: {role.name}</span>
						<span>{role.userCount} users assigned</span>
					</HeaderMeta>
				}
				actions={
					<Button varient='outlined' onClick={() => navigate('/roles')}>
						Back to list
					</Button>
				}
			/>

			<SectionCard title='Details'>
				<Grid>
					<Field>
						<label>Label</label>
						<Input
							type='text'
							name='role-label'
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							sizes='small'
						/>
					</Field>
					<Field>
						<label>Description</label>
						<Input
							type='text'
							name='role-desc'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							sizes='small'
						/>
					</Field>
				</Grid>
			</SectionCard>

			<SectionCard title='Permissions'>
				<RolePermissionsMatrix
					role={role}
					catalogue={permsQuery.data ?? []}
					selected={selected}
					onToggle={handleToggle}
				/>
			</SectionCard>

			<PermissionGate permission='roles:assign'>
				<SectionCard title='Assign user'>
					<AssignRow>
						<Input
							type='text'
							name='assign-user-id'
							placeholder='User ID (UUID)'
							value={assignUserId}
							onChange={(e) => setAssignUserId(e.target.value)}
							sizes='small'
							maxWidth='360px'
						/>
						<Button onClick={handleAssign} disabled={!assignUserId || isAssigning}>
							{isAssigning ? 'Assigning…' : 'Assign'}
						</Button>
					</AssignRow>
					<Hint>
						Assigning moves the user to this role. Reassigning the only Owner returns
						`LAST_OWNER_LOCK` (spec §6).
					</Hint>
				</SectionCard>
			</PermissionGate>

			<StickyActions>
				<Button varient='outlined' onClick={() => navigate('/roles')}>
					Cancel
				</Button>
				<PermissionGate permission='roles:update'>
					<Button onClick={handleSave} disabled={!dirty || isSaving}>
						{isSaving ? 'Saving…' : 'Save changes'}
					</Button>
				</PermissionGate>
			</StickyActions>
		</PageShell>
	)
}

export default RoleEditorPage

function setsEqual(a: Set<string>, b: Set<string>) {
	if (a.size !== b.size) return false
	for (const v of a) if (!b.has(v)) return false
	return true
}

const HeaderMeta = styled.div`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: ${({ theme }) => theme.spacing!.md}px;
`

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;

	label {
		color: ${({ theme }) => theme.colors!.text.secondary};
		font-size: ${({ theme }) => theme.typography!.caption.fontSize};
		text-transform: uppercase;
		letter-spacing: ${({ theme }) => theme.typography!.caption.letterSpacing};
	}
`

const AssignRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	margin-bottom: ${({ theme }) => theme.spacing!.sm}px;
`

const Hint = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
`

const StickyActions = styled.div`
	position: sticky;
	bottom: 0;
	display: flex;
	justify-content: flex-end;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	padding: ${({ theme }) => theme.spacing!.md}px 0;
	background: ${({ theme }) => theme.colors!.bg.canvas};
`
