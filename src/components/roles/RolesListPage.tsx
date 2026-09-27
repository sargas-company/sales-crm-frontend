import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { Tooltip } from '@mui/material'
import { DeleteOutline, EditOutlined } from '@mui/icons-material'
import Card from '../../components/card/Card'
import AnimatedCardShell from '../../components/card/AnimatedCardShell'
import PageShell from '../../ui/page/PageShell'
import PageHeader from '../../ui/page/PageHeader'
import FilterBar from '../../ui/data/FilterBar'
import * as TableShell from '../../ui/data/TableShell'
import Input from '../../ui/form/Input'
import Badge from '../../ui/badge/Badge'
import DataGridFooter from '../data-grid-item/DataGridFooter'
import { Button, IconButton } from '../../ui'
import PermissionGate from '../auth/PermissionGate'
import CreateRoleModal from './CreateRoleModal'
import RoleDeleteDialog from './RoleDeleteDialog'
import { useDeleteRoleMutation, useListRolesQuery } from '../../store/roles/rolesApi'
import type { Role } from '../../store/roles/types'
import { useToast } from '../../context/toast/ToastContext'
import { extractRoleErrorMessage } from './errorMessage'

const COLS = 5
const LIMIT_OPTIONS = [10, 25]

const RolesListPage = () => {
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const [createOpen, setCreateOpen] = useState(false)
	const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])

	const { data, isLoading, isError, refetch } = useListRolesQuery()
	const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation()
	const toast = useToast()

	const roles = data ?? []
	const filtered = useMemo(() => {
		if (!search) return roles
		const q = search.toLowerCase()
		return roles.filter(
			(r) =>
				r.name.toLowerCase().includes(q) ||
				r.label.toLowerCase().includes(q) ||
				(r.description ?? '').toLowerCase().includes(q)
		)
	}, [roles, search])

	const total = filtered.length
	const offset = (page - 1) * limit
	const pageItems = filtered.slice(offset, offset + limit)
	const passed = total === 0 ? 0 : offset + 1
	const next = Math.min(offset + limit, total)

	const systemCount = roles.filter((r) => r.system).length
	const customCount = roles.length - systemCount

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit)
		setPage(1)
	}

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await deleteRole(deleteTarget.id).unwrap()
			toast.showToast(`Role "${deleteTarget.label}" deleted`, 'success')
			if (pageItems.length === 1 && page > 1) setPage(page - 1)
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
					subtitle={
						roles.length > 0
							? `${roles.length} role${roles.length === 1 ? '' : 's'} · ${systemCount} system · ${customCount} custom`
							: 'Owner-only administration of capability-based roles and their permission set.'
					}
					actions={
						<PermissionGate permission='roles:create'>
							<Button onClick={() => setCreateOpen(true)}>New role</Button>
						</PermissionGate>
					}
				/>
				<AnimatedCardShell>
					<Card padding='24px'>
						<FilterBar>
							<Input
								type='text'
								name='search-role'
								placeholder='Search by slug, label or description'
								sizes='small'
								maxWidth='320px'
								value={search}
								onChange={(e) => {
									setSearch(e.target.value)
									setPage(1)
								}}
							/>
						</FilterBar>
						<StyledTable>
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
								{isLoading &&
									Array.from({ length: 5 }).map((_, i) => (
										<TableShell.Row key={`skeleton-${i}`}>
											<TableShell.Cell value={<Skeleton $width='120px' />} />
											<TableShell.Cell
												value={
													<SkeletonLabelCell>
														<Skeleton $width='140px' />
														<Skeleton $width='54px' $height='18px' />
													</SkeletonLabelCell>
												}
											/>
											<TableShell.Cell value={<Skeleton $width='60%' />} />
											<TableShell.Cell
												align='right'
												value={<Skeleton $width='24px' $inline />}
											/>
											<TableShell.Cell
												align='right'
												value={
													<SkeletonActions>
														<Skeleton $width='24px' $height='24px' $round />
														<Skeleton $width='24px' $height='24px' $round />
													</SkeletonActions>
												}
											/>
										</TableShell.Row>
									))}
								{isError && !isLoading && (
									<TableShell.ErrorState
										colSpan={COLS}
										description='Could not load roles.'
										action={<Button onClick={() => refetch()}>Retry</Button>}
									/>
								)}
								{!isLoading && !isError && pageItems.length === 0 && (
									<TableShell.EmptyState
										colSpan={COLS}
										title={
											search ? 'No roles match your search.' : 'No custom roles yet.'
										}
										description={
											search
												? 'Adjust or clear the search to see all roles.'
												: 'System roles come pre-seeded. Create a custom role to grant a scoped permission set.'
										}
										action={
											!search && (
												<PermissionGate permission='roles:create'>
													<Button onClick={() => setCreateOpen(true)}>New role</Button>
												</PermissionGate>
											)
										}
									/>
								)}
								{!isLoading &&
									!isError &&
									pageItems.map((role) => {
										const deleteDisabled = role.userCount > 0
										return (
											<TableShell.Row key={role.id} hover>
												<TableShell.Cell value={<SlugText>{role.name}</SlugText>} />
												<TableShell.Cell
													value={
														<LabelCell>
															<span>{role.label}</span>
															<Badge
																tone={role.system ? 'accent' : 'neutral'}
																variant='subtle'
															>
																{role.system ? 'system' : 'custom'}
															</Badge>
														</LabelCell>
													}
												/>
												<TableShell.Cell
													value={
														<DescriptionText>
															{role.description ?? '—'}
														</DescriptionText>
													}
												/>
												<TableShell.Cell align='right' value={role.userCount} />
												<TableShell.Cell
													align='right'
													value={
														<ActionsRow>
															<PermissionGate permission='roles:update'>
																<Tooltip title='Edit role' placement='top'>
																	<span>
																		<IconButton
																			varient='text'
																			size={30}
																			fontSize={20}
																			contentOpacity={5}
																			onClick={() =>
																				navigate(`/roles/${role.id}`)
																			}
																		>
																			<EditOutlined />
																		</IconButton>
																	</span>
																</Tooltip>
															</PermissionGate>
															{!role.system && (
																<PermissionGate permission='roles:delete'>
																	<Tooltip
																		title={
																			deleteDisabled
																				? 'Role still has assigned users'
																				: 'Delete role'
																		}
																		placement='top'
																	>
																		<span>
																			<IconButton
																				varient='text'
																				size={30}
																				fontSize={20}
																				contentOpacity={deleteDisabled ? 2 : 5}
																				onClick={() => setDeleteTarget(role)}
																				disabled={deleteDisabled}
																			>
																				<DeleteOutline />
																			</IconButton>
																		</span>
																	</Tooltip>
																</PermissionGate>
															)}
														</ActionsRow>
													}
												/>
											</TableShell.Row>
										)
									})}
							</TableShell.Body>
						</StyledTable>
						{total > limit && (
							<FooterWrap>
								<DataGridFooter
									total={total}
									rowPerPage={limit}
									rowPerPageOptions={LIMIT_OPTIONS}
									currentPage={page}
									next={next}
									passed={passed}
									handlePagination={setPage}
									handleRowOptSelect={handleLimitChange}
								/>
							</FooterWrap>
						)}
					</Card>
				</AnimatedCardShell>
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

const StyledTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin-top: ${({ theme }) => theme.spacing!.sm}px;
`

const SlugText = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-weight: 500;
	color: ${({ theme }) => theme.colors!.text.primary};
`

const LabelCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	font-weight: 500;
`

const DescriptionText = styled.span`
	display: inline-block;
	max-width: 380px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: ${({ theme }) => theme.colors!.text.secondary};

	@media (max-width: 900px) {
		display: none;
	}
`

const ActionsRow = styled.span`
	display: inline-flex;
	gap: ${({ theme }) => theme.spacing!.xs}px;
	justify-content: flex-end;
`

const FooterWrap = styled.div`
	margin-top: ${({ theme }) => theme.spacing!.md}px;
`

const skeletonPulse = keyframes`
	0% { opacity: 0.55; }
	50% { opacity: 0.9; }
	100% { opacity: 0.55; }
`

const Skeleton = styled.span<{
	$width?: string
	$height?: string
	$round?: boolean
	$inline?: boolean
}>`
	display: ${({ $inline }) => ($inline ? 'inline-block' : 'block')};
	width: ${({ $width }) => $width ?? '80%'};
	height: ${({ $height }) => $height ?? '14px'};
	background: ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ $round, theme }) => ($round ? '50%' : `${theme.radius!.sm}px`)};
	animation: ${skeletonPulse} 1.4s ease-in-out infinite;
`

const SkeletonLabelCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
`

const SkeletonActions = styled.span`
	display: inline-flex;
	gap: ${({ theme }) => theme.spacing!.xs}px;
	justify-content: flex-end;
`
