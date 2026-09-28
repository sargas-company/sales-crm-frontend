import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { AdminPanelSettingsOutlined, GroupOutlined } from '@mui/icons-material'
import { TextField, Button } from '../../ui'
import Loading from '../../ui/state/Loading'
import ErrorState from '../../ui/state/ErrorState'
import useTheme from '../../theme/useTheme'
import { Field, FormHeader, SectionHead } from '../_shared/FormShell'
import {
	DotMini,
	FootActions,
	FootBar,
	FootLeft,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../_shared/formShell.styled'
import PermissionGate from '../auth/PermissionGate'
import RolePermissionsMatrix from './RolePermissionsMatrix'
import AssignUserModal from './AssignUserModal'
import {
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
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const rolesQuery = useListRolesQuery()
	const permsQuery = useListPermissionsQuery()
	const [updateRole, { isLoading: isSaving }] = useUpdateRoleMutation()

	const role = useMemo(
		() => rolesQuery.data?.find((r) => r.id === id) ?? null,
		[rolesQuery.data, id]
	)

	const [label, setLabel] = useState('')
	const [description, setDescription] = useState('')
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [assignOpen, setAssignOpen] = useState(false)

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
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<CenteredState>
						<Loading label='Loading role…' />
					</CenteredState>
				</Surface>
			</Shell>
		)
	}

	if (rolesQuery.isError || permsQuery.isError || !role) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<CenteredState>
						<ErrorState
							title='Role not available'
							description='Could not load role or permission catalogue.'
							action={<Button onClick={() => navigate('/roles')}>Back to list</Button>}
						/>
					</CenteredState>
				</Surface>
			</Shell>
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

	const handleToggleAll = (keys: string[], nextValue: boolean) => {
		if (ownerLocked) return
		setSelected((prev) => {
			const next = new Set(prev)
			for (const k of keys) {
				if (nextValue) next.add(k)
				else next.delete(k)
			}
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
			showToast('Role updated', 'success')
		} catch (err) {
			showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	const badgeLabel = role.system ? 'System' : 'Custom'
	const badgeTone = role.system ? 'edit' : 'new'
	const usersWord = role.userCount === 1 ? 'user' : 'users'

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/roles'
					backLabel='Back to roles'
					icon={<AdminPanelSettingsOutlined />}
					title={role.label}
					subtitle={`Slug: ${role.name} · ${role.userCount} ${usersWord} assigned`}
					badgeLabel={badgeLabel}
					badgeTone={badgeTone}
				/>

				<form
					onSubmit={(e) => {
						e.preventDefault()
						if (dirty && !isSaving) handleSave()
					}}
					noValidate
				>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint={
								role.system
									? 'System roles keep their slug — only label and description are editable.'
									: 'Editable label and description. The slug is immutable.'
							}
						/>
						<IdentityGrid>
							<Field label='Label' required hint='Human-readable name shown in pickers'>
								<TextField
									name='role-label'
									placeholder='e.g. Sales Lead'
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									sizes='small'
									width='100%'
								/>
							</Field>

							<Field label='Slug' required hint='Immutable — assigned at creation time.'>
								<TextField
									name='role-slug'
									value={role.name}
									disable
									sizes='small'
									width='100%'
								/>
							</Field>
						</IdentityGrid>

						<DescriptionStack>
							<Field
								label='Description'
								hint='Optional — visible to Owners in the role editor.'
							>
								<TextField
									name='role-desc'
									placeholder='What is this role for?'
									value={description}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										setDescription(e.target.value)
									}
									multiRow
									sizes='small'
									width='100%'
									style={{ minHeight: 80, resize: 'vertical' }}
								/>
							</Field>
						</DescriptionStack>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Assigned users'
							hint={
								ownerLocked
									? 'Owner cannot be reassigned to anyone but the last Owner.'
									: 'Reassignments go through a modal so single edits do not clobber unsaved changes.'
							}
						/>
						<AssignedRow>
							<AssignedCountWrap>
								<AssignedIcon>
									<GroupOutlined />
								</AssignedIcon>
								<AssignedNumbers>
									<AssignedCount>{role.userCount}</AssignedCount>
									<AssignedLabel>{usersWord} assigned</AssignedLabel>
								</AssignedNumbers>
							</AssignedCountWrap>
							<PermissionGate permission='roles:assign'>
								<Button varient='outlined' onClick={() => setAssignOpen(true)}>
									Assign user
								</Button>
							</PermissionGate>
						</AssignedRow>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='Permissions'
							hint={
								ownerLocked
									? 'Owner permission set is locked. All modules are always granted.'
									: 'Tick modules or use the global toggle to grant access.'
							}
						/>
						<MatrixHost>
							<RolePermissionsMatrix
								role={role}
								catalogue={permsQuery.data ?? []}
								selected={selected}
								onToggle={handleToggle}
								onToggleAll={handleToggleAll}
							/>
						</MatrixHost>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini $color={dirty ? '#0284c7' : undefined} />
							{dirty ? 'Unsaved changes — save to apply.' : 'Everything is up to date.'}
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/roles')}
							>
								Cancel
							</Button>
							<PermissionGate permission='roles:update'>
								<PrimarySolidButton type='submit' disabled={!dirty || isSaving}>
									{isSaving ? 'Saving…' : 'Save changes'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>

			{assignOpen && <AssignUserModal role={role} onClose={() => setAssignOpen(false)} />}
		</Shell>
	)
}

export default RoleEditorPage

function setsEqual(a: Set<string>, b: Set<string>) {
	if (a.size !== b.size) return false
	for (const v of a) if (!b.has(v)) return false
	return true
}

const CenteredState = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const IdentityGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 22px 20px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`

const DescriptionStack = styled.div`
	display: flex;
	flex-direction: column;
	margin-top: 22px;
`

const MatrixHost = styled.div`
	margin-top: 4px;
`

const AssignedRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 18px;
	background: linear-gradient(135deg, #f8fafc 0%, #f4f2f8 100%);
	border: 1px solid #eeecf3;
	border-radius: 14px;
	flex-wrap: wrap;
`

const AssignedCountWrap = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
`

const AssignedIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 42px;
	height: 42px;
	border-radius: 12px;
	background: #e0f2fe;
	color: rgba(3, 105, 161, 1);

	svg {
		font-size: 22px;
	}
`

const AssignedNumbers = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const AssignedCount = styled.span`
	font-size: 22px;
	font-weight: 700;
	color: #252d3a;
	line-height: 1;
`

const AssignedLabel = styled.span`
	font-size: 12px;
	color: #7a7686;
	line-height: 1.3;
`
