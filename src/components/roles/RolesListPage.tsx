import { FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	Add,
	ContentCopyOutlined,
	DeleteOutlineOutlined,
	EditOutlined,
	Search as SearchIcon,
} from '@mui/icons-material'
import { Button, IconButton } from '../../ui'
import { allPermissions } from '../../store/roles/types'
import { useRoles } from '../../store/roles/rolesMockStore'
import { useToast } from './Toast'
import CreateRoleModal from './CreateRoleModal'
import RoleBadge from './RoleBadge'
import RoleAvatars from './RoleAvatars'
import {
	Crumbs,
	Meter,
	PageHead,
	Panel,
	PanelHead,
	RoleDesc,
	RoleName,
	RolesTable,
	Search,
	ShellCard,
	ShellInner,
	ViewFade,
} from './roles.styled'

const plural = (n: number, singular: string, plural: string) =>
	n === 1 ? singular : plural

const RolesListPage: FC = () => {
	const navigate = useNavigate()
	const { roles, users, duplicateRole, deleteRole, createRole } = useRoles()
	const { push } = useToast()

	const [query, setQuery] = useState('')
	const [showCreate, setShowCreate] = useState(false)

	const total = useMemo(() => allPermissions().size, [])

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return roles
		return roles.filter(
			(r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
		)
	}, [roles, query])

	const usersOf = (ids: string[]) =>
		ids.map((id) => users.find((u) => u.id === id)).filter(Boolean) as typeof users

	const handleCreate = (name: string, description: string) => {
		const role = createRole(name, description)
		setShowCreate(false)
		push(`Created: ${role.name}`)
		navigate(`/roles/${role.id}`)
	}

	const handleDuplicate = (id: string) => {
		const copy = duplicateRole(id)
		if (copy) push(`Duplicated: ${copy.name}`)
	}

	const handleDelete = (id: string, name: string) => {
		deleteRole(id)
		push(`Deleted: ${name}`)
	}

	return (
		<ViewFade>
			<ShellCard>
				<ShellInner>
					<Crumbs>
						<span className='current'>Roles &amp; Access</span>
					</Crumbs>

					<PageHead>
						<div className='title'>
							<h1>Roles &amp; permissions</h1>
							<p>
								Who sees what and who can do what. Owner always has full access - create
								separate roles for your team's tasks.
							</p>
						</div>
						<Button onClick={() => setShowCreate(true)}>
							<Add fontSize='small' />
							Create role
						</Button>
					</PageHead>

					<Panel>
						<PanelHead>
							<span className='count'>
								{filtered.length} {plural(filtered.length, 'role', 'roles')}
							</span>
							<Search>
								<SearchIcon />
								<input
									placeholder='Search by name...'
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</Search>
						</PanelHead>

						<RolesTable>
							<thead>
								<tr>
									<th style={{ width: '42%' }}>Role</th>
									<th style={{ width: '10%' }}>Type</th>
									<th style={{ width: '18%' }}>Users</th>
									<th style={{ width: '20%' }}>Permissions</th>
									<th style={{ width: '10%' }}></th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((role) => {
									const pct = Math.round((role.permissions.size / total) * 100)
									const canDelete = role.type === 'custom'
									return (
										<tr key={role.id} onClick={() => navigate(`/roles/${role.id}`)}>
											<td>
												<RoleName>{role.name}</RoleName>
												<RoleDesc>{role.description}</RoleDesc>
											</td>
											<td>
												<RoleBadge type={role.type} />
											</td>
											<td>
												<RoleAvatars users={usersOf(role.userIds)} />
											</td>
											<td className='num'>
												<Meter>
													<span className='bar'>
														<span
															className='fill'
															style={{ width: `${pct}%` }}
														/>
													</span>
													<span className='num'>
														{role.permissions.size}
														<span className='sub'>/{total}</span>
													</span>
												</Meter>
											</td>
											<td className='actions'>
												<span
													className='row-actions'
													onClick={(e) => e.stopPropagation()}
												>
													<IconButton
														size={28}
														fontSize={15}
														roundness='rounded'
														varient='text'
														onClick={() => handleDuplicate(role.id)}
													>
														<ContentCopyOutlined />
													</IconButton>
													<IconButton
														size={28}
														fontSize={15}
														roundness='rounded'
														varient='text'
														onClick={() => navigate(`/roles/${role.id}`)}
													>
														<EditOutlined />
													</IconButton>
													<IconButton
														size={28}
														fontSize={15}
														roundness='rounded'
														varient='text'
														disabled={!canDelete}
														onClick={() =>
															canDelete && handleDelete(role.id, role.name)
														}
													>
														<DeleteOutlineOutlined />
													</IconButton>
												</span>
											</td>
										</tr>
									)
								})}
							</tbody>
						</RolesTable>
					</Panel>

					<CreateRoleModal
						open={showCreate}
						onClose={() => setShowCreate(false)}
						onCreate={handleCreate}
					/>
				</ShellInner>
			</ShellCard>
		</ViewFade>
	)
}

export default RolesListPage
