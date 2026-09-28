import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { AdminPanelSettingsOutlined, GroupOutlined, EditOutlined } from '@mui/icons-material'
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
import { useListPermissionsQuery, useListRolesQuery } from '../../store/roles/rolesApi'

const RoleViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const rolesQuery = useListRolesQuery()
	const permsQuery = useListPermissionsQuery()

	const role = useMemo(
		() => rolesQuery.data?.find((r) => r.id === id) ?? null,
		[rolesQuery.data, id]
	)

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

	const selectedKeys = new Set(role.permissions.map((p) => p.key))
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

				<Section $delay={80}>
					<SectionHead
						num='01'
						title='Identity'
						hint='Read-only view. Use the edit action to change label, description or permissions.'
					/>
					<IdentityGrid>
						<Field label='Label' hint='Human-readable name shown in pickers'>
							<TextField
								name='role-label'
								value={role.label}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>

						<Field label='Slug' hint='Immutable — assigned at creation time.'>
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
								value={role.description ?? ''}
								disable
								multiRow
								sizes='small'
								width='100%'
								style={{ minHeight: 80 }}
							/>
						</Field>
					</DescriptionStack>
				</Section>

				<Section $delay={140}>
					<SectionHead
						num='02'
						title='Assigned users'
						hint='Count of users who currently hold this role.'
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
					</AssignedRow>
				</Section>

				<Section $delay={200}>
					<SectionHead
						num='03'
						title='Permissions'
						hint='Read-only overview of what this role can do across modules.'
					/>
					<MatrixHost>
						<RolePermissionsMatrix
							role={role}
							catalogue={permsQuery.data ?? []}
							selected={selectedKeys}
							onToggle={() => {}}
							disabled
						/>
					</MatrixHost>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Viewing role in read-only mode.
					</FootLeft>
					<FootActions>
						<Button
							varient='outlined'
							color='rgba(3, 105, 161, 1)'
							type='button'
							onClick={() => navigate('/roles')}
						>
							Back to list
						</Button>
						<PermissionGate permission='roles:update'>
							<PrimarySolidButton
								type='button'
								onClick={() => navigate(`/roles/${role.id}/edit`)}
							>
								<EditOutlined />
								Edit role
							</PrimarySolidButton>
						</PermissionGate>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default RoleViewPage

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
