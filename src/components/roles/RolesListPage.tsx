import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../ui/page/PageShell'
import PageHeader from '../../ui/page/PageHeader'
import SectionCard from '../../ui/surface/SectionCard'
import FilterBar from '../../ui/data/FilterBar'
import * as TableShell from '../../ui/data/TableShell'
import Input from '../../ui/form/Input'
import Badge from '../../ui/badge/Badge'
import { Button, IconButton } from '../../ui'
import { DeleteOutline, EditOutlined } from '@mui/icons-material'
import PermissionGate from '../auth/PermissionGate'
import CreateRoleModal from './CreateRoleModal'
import RoleDeleteDialog from './RoleDeleteDialog'
import { useDeleteRoleMutation, useListRolesQuery } from '../../store/roles/rolesApi'
import type { Role } from '../../store/roles/types'
import { useToast } from '../../context/toast/ToastContext'
import { extractRoleErrorMessage } from './errorMessage'

const COLS = 5

const RolesListPage = () => {
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const [createOpen, setCreateOpen] = useState(false)
	const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

	const { data, isLoading, isError, refetch } = useListRolesQuery()
	const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation()
	const toast = useToast()

	const roles = data ?? []
	const items = search
		? roles.filter((r) => {
				const q = search.toLowerCase()
				return (
					r.name.toLowerCase().includes(q) ||
					r.label.toLowerCase().includes(q) ||
					(r.description ?? '').toLowerCase().includes(q)
				)
			})
		: roles

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await deleteRole(deleteTarget.id).unwrap()
			toast.showToast(`Role "${deleteTarget.label}" deleted`, 'success')
			setDeleteTarget(null)
		} catch (err) {
			toast.showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	return (
		<>
			<PageShell>
				<PageHeader
					title='Roles & Access'
					subtitle='Owner-only administration of capability-based roles and their permission set.'
					actions={
						<PermissionGate permission='roles:create'>
							<Button onClick={() => setCreateOpen(true)}>Create role</Button>
						</PermissionGate>
					}
				/>
				<SectionCard padding='none'>
					<FilterBar>
						<Input
							type='text'
							name='search-role'
							placeholder='Search role'
							sizes='small'
							maxWidth='280px'
							onChange={(e) => setSearch(e.target.value)}
						/>
					</FilterBar>
					<table style={{ width: '100%', borderCollapse: 'collapse' }}>
						<TableShell.Header>
							<TableShell.Row>
								<TableShell.Cell as='th' value='Slug' compact />
								<TableShell.Cell as='th' value='Label' compact />
								<TableShell.Cell as='th' value='Description' compact />
								<TableShell.Cell as='th' value='Users' compact align='right' />
								<TableShell.Cell as='th' value='Actions' compact align='right' />
							</TableShell.Row>
						</TableShell.Header>
						<TableShell.Body>
							{isLoading && (
								<TableShell.LoadingState colSpan={COLS} label='Loading roles…' />
							)}
							{isError && !isLoading && (
								<TableShell.ErrorState
									colSpan={COLS}
									description='Could not load roles.'
									action={<Button onClick={() => refetch()}>Retry</Button>}
								/>
							)}
							{!isLoading && !isError && items.length === 0 && (
								<TableShell.EmptyState
									colSpan={COLS}
									title={search ? 'No roles match your search.' : 'No roles yet.'}
									description={
										search
											? 'Adjust the search or clear it.'
											: 'Create the first custom role to begin.'
									}
									action={
										!search && (
											<PermissionGate permission='roles:create'>
												<Button onClick={() => setCreateOpen(true)}>Create role</Button>
											</PermissionGate>
										)
									}
								/>
							)}
							{!isLoading &&
								!isError &&
								items.map((role) => (
									<TableShell.Row key={role.id}>
										<TableShell.Cell value={role.name} weight={500} />
										<TableShell.Cell
											value={
												<span
													style={{
														display: 'inline-flex',
														gap: 8,
														alignItems: 'center',
													}}
												>
													{role.label}
													<Badge
														tone={role.system ? 'accent' : 'neutral'}
														variant='subtle'
													>
														{role.system ? 'system' : 'custom'}
													</Badge>
												</span>
											}
										/>
										<TableShell.Cell value={role.description ?? '—'} />
										<TableShell.Cell align='right' value={role.userCount} />
										<TableShell.Cell
											align='right'
											value={
												<span style={{ display: 'inline-flex', gap: 4 }}>
													<PermissionGate permission='roles:update'>
														<IconButton
															varient='text'
															size={30}
															fontSize={20}
															contentOpacity={5}
															onClick={() => navigate(`/roles/${role.id}`)}
														>
															<EditOutlined />
														</IconButton>
													</PermissionGate>
													{!role.system && (
														<PermissionGate permission='roles:delete'>
															<IconButton
																varient='text'
																size={30}
																fontSize={20}
																contentOpacity={role.userCount > 0 ? 2 : 5}
																onClick={() => setDeleteTarget(role)}
																disabled={role.userCount > 0}
															>
																<DeleteOutline />
															</IconButton>
														</PermissionGate>
													)}
												</span>
											}
										/>
									</TableShell.Row>
								))}
						</TableShell.Body>
					</table>
				</SectionCard>
			</PageShell>

			{createOpen && (
				<CreateRoleModal
					onClose={() => setCreateOpen(false)}
					onCreated={(role) => {
						setCreateOpen(false)
						toast.showToast(`Role "${role.label}" created`, 'success')
						navigate(`/roles/${role.id}`)
					}}
				/>
			)}

			{deleteTarget && (
				<RoleDeleteDialog
					role={deleteTarget}
					isBusy={isDeleting}
					onCancel={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
				/>
			)}
		</>
	)
}

export default RolesListPage
