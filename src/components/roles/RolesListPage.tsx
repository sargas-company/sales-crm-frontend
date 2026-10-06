import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { Tooltip } from '@mui/material'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	SearchOutlined,
	AdminPanelSettingsOutlined,
	AddRounded,
} from '@mui/icons-material'
import { T } from '../sales-analytics/_shared/tokens'
import PermissionGate from '../auth/PermissionGate'
import RoleDeleteDialog from './RoleDeleteDialog'
import { useDeleteRoleMutation, useListRolesQuery } from '../../store/roles/rolesApi'
import type { Role } from '../../store/roles/types'
import { useToast } from '../../context/toast/ToastContext'
import { extractRoleErrorMessage } from './errorMessage'

const PAGE_SIZE = 12

type RoleSortKey = 'label' | 'userCount'
type RoleSortDirection = 'asc' | 'desc'
interface RoleSortState {
	key: RoleSortKey
	direction: RoleSortDirection
}

const cycleSortState = (current: RoleSortState | null, next: RoleSortKey): RoleSortState | null => {
	if (!current || current.key !== next) return { key: next, direction: 'asc' }
	if (current.direction === 'asc') return { key: next, direction: 'desc' }
	return null
}

const RolesListPage = () => {
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<RoleSortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

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

	const sorted = useMemo(() => {
		if (!sort) return filtered
		const dir = sort.direction === 'asc' ? 1 : -1
		return [...filtered].sort((a, b) => {
			if (sort.key === 'label') return a.label.localeCompare(b.label) * dir
			return (a.userCount - b.userCount) * dir
		})
	}, [filtered, sort])

	const cycleSort = (key: RoleSortKey) => {
		setSort((prev) => cycleSortState(prev, key))
		setPage(1)
	}

	const sortIndicator = (key: RoleSortKey): string => {
		if (!sort || sort.key !== key) return ''
		return sort.direction === 'asc' ? ' ▲' : ' ▼'
	}

	const total = sorted.length
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
	const clampedPage = Math.min(page, totalPages)
	const offset = (clampedPage - 1) * PAGE_SIZE
	const pageItems = sorted.slice(offset, offset + PAGE_SIZE)

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await deleteRole(deleteTarget.id).unwrap()
			toast.showToast(`Role "${deleteTarget.label}" deleted`, 'success')
			if (pageItems.length === 1 && clampedPage > 1) setPage(clampedPage - 1)
			setDeleteTarget(null)
		} catch (err) {
			toast.showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	return (
		<>
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<span className='crumb-dot' aria-hidden='true' />
							<span className='crumb-parent'>Access</span>
							<span className='crumb-sep' aria-hidden='true'>
								/
							</span>
							<span className='current'>Roles</span>
						</Crumbs>

						<PageHead>
							<div className='title'>
								<HeadIcon>
									<AdminPanelSettingsOutlined />
								</HeadIcon>
								<div className='title-text'>
									<h1>Roles &amp; Access</h1>
									<p>
										Owner-only administration of capability-based roles and their
										permission set.
									</p>
								</div>
							</div>
							<PermissionGate permission='roles:create'>
								<PrimaryCta type='button' onClick={() => navigate('/roles/add')}>
									<AddRounded />
									New role
								</PrimaryCta>
							</PermissionGate>
						</PageHead>

						<FiltersBar>
							<SearchField>
								<SearchOutlined />
								<input
									type='text'
									name='search-role'
									placeholder='Search by slug, label or description'
									value={search}
									onChange={(e) => {
										setSearch(e.target.value)
										setPage(1)
									}}
									aria-label='Search roles'
								/>
							</SearchField>
						</FiltersBar>

						<TableCard>
							<TableScroll>
								<Table>
									<thead>
										<tr>
											<th
												className='col-role sortable'
												onClick={() => cycleSort('label')}
												aria-sort={
													sort?.key === 'label'
														? sort.direction === 'asc'
															? 'ascending'
															: 'descending'
														: 'none'
												}
												role='columnheader'
											>
												Role{sortIndicator('label')}
											</th>
											<th className='col-desc'>Description</th>
											<th
												className='col-users sortable'
												onClick={() => cycleSort('userCount')}
												aria-sort={
													sort?.key === 'userCount'
														? sort.direction === 'asc'
															? 'ascending'
															: 'descending'
														: 'none'
												}
												role='columnheader'
											>
												Users{sortIndicator('userCount')}
											</th>
											<th className='col-actions'>Actions</th>
										</tr>
									</thead>
									<tbody>
										{isLoading &&
											Array.from({ length: 5 }).map((_, i) => (
												<tr key={`skel-${i}`} className='skeleton-row'>
													<td>
														<SkeletonRoleCell>
															<Skeleton $w='140px' $h='14px' />
															<Skeleton $w='96px' $h='11px' />
														</SkeletonRoleCell>
													</td>
													<td>
														<Skeleton $w='70%' $h='12px' />
													</td>
													<td>
														<Skeleton $w='28px' $h='14px' $inline />
													</td>
													<td>
														<SkeletonActions>
															<Skeleton $w='26px' $h='26px' $round />
															<Skeleton $w='26px' $h='26px' $round />
															<Skeleton $w='26px' $h='26px' $round />
														</SkeletonActions>
													</td>
												</tr>
											))}
										{!isLoading && isError && (
											<tr>
												<td colSpan={4}>
													<InlineState>
														<div className='state-title'>Could not load roles</div>
														<div className='state-sub'>
															The list request failed. Retry to reload.
														</div>
														<button
															type='button'
															className='state-cta'
															onClick={() => refetch()}
														>
															Retry
														</button>
													</InlineState>
												</td>
											</tr>
										)}
										{!isLoading && !isError && pageItems.length === 0 && (
											<tr>
												<td colSpan={4}>
													<InlineState>
														<div className='state-title'>
															{search
																? 'No roles match your search'
																: 'No custom roles yet'}
														</div>
														<div className='state-sub'>
															{search
																? 'Adjust or clear the search to see all roles.'
																: 'System roles are pre-seeded. Create a custom role to grant a scoped permission set.'}
														</div>
														{!search && (
															<PermissionGate permission='roles:create'>
																<button
																	type='button'
																	className='state-cta'
																	onClick={() => navigate('/roles/add')}
																>
																	<AddRounded />
																	Create the first role
																</button>
															</PermissionGate>
														)}
													</InlineState>
												</td>
											</tr>
										)}
										{!isLoading &&
											!isError &&
											pageItems.map((role) => {
												const deleteDisabled = role.userCount > 0
												return (
													<DataRow key={role.id}>
														<td className='col-role'>
															<RoleCell>
																<RoleLabel>{role.label}</RoleLabel>
																<RoleMeta>
																	<Slug>{role.name}</Slug>
																	<SystemPill $system={role.system}>
																		{role.system ? 'system' : 'custom'}
																	</SystemPill>
																</RoleMeta>
															</RoleCell>
														</td>
														<td className='col-desc'>
															<Description title={role.description ?? undefined}>
																{role.description || '—'}
															</Description>
														</td>
														<td className='col-users'>
															<UsersPill $muted={role.userCount === 0}>
																{role.userCount}
															</UsersPill>
														</td>
														<td className='col-actions'>
															<Actions>
																<IconAction
																	type='button'
																	onClick={() => navigate(`/roles/${role.id}`)}
																	aria-label='View role'
																>
																	<VisibilityOutlined />
																</IconAction>
																<PermissionGate permission='roles:update'>
																	<IconAction
																		type='button'
																		onClick={() =>
																			navigate(`/roles/${role.id}/edit`)
																		}
																		aria-label='Edit role'
																	>
																		<EditOutlined />
																	</IconAction>
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
																			arrow
																		>
																			<span>
																				<IconAction
																					type='button'
																					$danger
																					disabled={deleteDisabled}
																					onClick={() => setDeleteTarget(role)}
																					aria-label='Delete role'
																				>
																					<DeleteOutline />
																				</IconAction>
																			</span>
																		</Tooltip>
																	</PermissionGate>
																)}
															</Actions>
														</td>
													</DataRow>
												)
											})}
									</tbody>
								</Table>
							</TableScroll>

							{total > PAGE_SIZE && (
								<Pager>
									<span className='pager-info'>
										Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
									</span>
									<PagerButtons>
										<PagerBtn
											type='button'
											disabled={clampedPage === 1}
											onClick={() => setPage(clampedPage - 1)}
										>
											Prev
										</PagerBtn>
										<span className='pager-current'>
											Page {clampedPage} / {totalPages}
										</span>
										<PagerBtn
											type='button'
											disabled={clampedPage >= totalPages}
											onClick={() => setPage(clampedPage + 1)}
										>
											Next
										</PagerBtn>
									</PagerButtons>
								</Pager>
							)}
						</TableCard>
					</ShellInner>
				</ShellCard>
			</ViewFade>

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

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const skeletonPulse = keyframes`
	0%   { opacity: 0.55; }
	50%  { opacity: 0.95; }
	100% { opacity: 0.55; }
`

const ViewFade = styled.div`
	animation: ${fadeUp} 240ms ${T.ease};
`

const ShellCard = styled.div`
	position: relative;
	background: ${T.cardBg};
	border-radius: ${T.radiusLg};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 12px 40px rgba(39, 36, 45, 0.06);
	overflow: hidden;
`

const ShellInner = styled.div`
	padding: 30px 32px 32px;
	display: flex;
	flex-direction: column;
	gap: 22px;

	@media (max-width: 767px) {
		padding: 22px 18px 24px;
		gap: 18px;
	}
`

const Crumbs = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 12.5px;
	color: ${T.textMuted};

	.crumb-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${T.primary};
	}
	.crumb-sep {
		opacity: 0.4;
	}
	.current {
		color: ${T.textSecondary};
		font-weight: 600;
	}
`

const PageHead = styled.header`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20px;
	flex-wrap: wrap;
	padding-bottom: 22px;
	border-bottom: 1px solid ${T.divider};

	.title {
		display: inline-flex;
		align-items: center;
		gap: 18px;
		min-width: 0;
	}
	.title-text {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	.title-text h1 {
		margin: 0;
		font-size: 34px;
		font-weight: 700;
		letter-spacing: -0.8px;
		line-height: 1.05;
		color: ${T.textStrong};
	}
	.title-text p {
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
		color: ${T.textSecondary};
		max-width: 62ch;
	}

	@media (max-width: 720px) {
		.title-text h1 {
			font-size: 28px;
			letter-spacing: -0.5px;
		}
	}
`

const HeadIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 28px;
	}
`

const PrimaryCta = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	background: ${T.primary};
	color: #fff;
	border: none;
	padding: 11px 18px;
	font-family: inherit;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.01em;
	border-radius: ${T.radiusSm};
	cursor: pointer;
	transition:
		transform 120ms ${T.ease},
		box-shadow 160ms ${T.ease},
		background 160ms ${T.ease};
	box-shadow: 0 2px 6px rgba(3, 105, 161, 0.22);

	svg {
		font-size: 18px;
	}

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(3, 105, 161, 0.28);
		background: #027cc0;
	}

	&:active {
		transform: translateY(0);
	}
`

const FiltersBar = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
`

const SearchField = styled.label`
	position: relative;
	display: inline-flex;
	align-items: center;
	background: transparent;
	border: 1.5px solid #cec9d8;
	border-radius: ${T.radiusPill};
	padding: 10px 16px 10px 14px;
	gap: 10px;
	min-width: 280px;
	max-width: 380px;
	flex: 1;
	transition:
		border-color 120ms ${T.ease},
		box-shadow 160ms ${T.ease};

	svg {
		font-size: 19px;
		color: ${T.textSecondary};
	}
	input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: 13.5px;
		color: ${T.textStrong};
		min-width: 0;

		&::placeholder {
			color: ${T.textSecondary};
		}
	}

	&:hover {
		border-color: #b3adc2;
	}

	&:focus-within {
		border-color: ${T.primary};
		box-shadow: 0 0 0 3px ${T.primaryTint};
	}
`

const TableCard = styled.div`
	background: #fff;
	border: 1px solid ${T.border};
	border-radius: ${T.radius};
	overflow: hidden;
`

const TableScroll = styled.div`
	overflow-x: auto;
`

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;

	thead th {
		text-align: left;
		font-size: 12.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		color: ${T.textStrong};
		background: ${T.subtleBg};
		padding: 15px 22px;
		border-bottom: 1px solid ${T.divider};
	}

	thead th.sortable {
		cursor: pointer;
		user-select: none;
	}
	thead th.sortable:hover {
		color: ${T.primary};
	}

	thead th.col-users,
	thead th.col-actions {
		text-align: right;
	}

	tbody td {
		padding: 16px 22px;
		vertical-align: middle;
		border-bottom: 1px solid ${T.divider};
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.col-desc {
		width: 40%;
	}
	.col-users,
	.col-actions {
		text-align: right;
		white-space: nowrap;
		width: 1%;
	}

	@media (max-width: 900px) {
		.col-desc {
			display: none;
		}
	}
`

const rowStagger = keyframes`
	from {
		opacity: 0;
		transform: translateY(6px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`

const DataRow = styled.tr`
	transition: background 120ms ${T.ease};
	animation: ${rowStagger} 360ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:nth-of-type(1) {
		animation-delay: 20ms;
	}
	&:nth-of-type(2) {
		animation-delay: 60ms;
	}
	&:nth-of-type(3) {
		animation-delay: 100ms;
	}
	&:nth-of-type(4) {
		animation-delay: 140ms;
	}
	&:nth-of-type(5) {
		animation-delay: 180ms;
	}
	&:nth-of-type(6) {
		animation-delay: 220ms;
	}
	&:nth-of-type(7) {
		animation-delay: 260ms;
	}
	&:nth-of-type(8) {
		animation-delay: 300ms;
	}
	&:nth-of-type(9) {
		animation-delay: 340ms;
	}
	&:nth-of-type(n + 10) {
		animation-delay: 380ms;
	}

	&:hover {
		background: #fbfafc;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const RoleCell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const RoleLabel = styled.span`
	font-size: 15px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
`

const RoleMeta = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
`

const Slug = styled.code`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12px;
	color: ${T.textSecondary};
	background: ${T.subtleBg};
	padding: 3px 9px;
	border-radius: ${T.radiusXs};
	border: 1px solid ${T.border};
`

const SystemPill = styled.span<{ $system?: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: ${T.radiusPill};
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	background: ${({ $system }) => ($system ? T.primaryStrong : T.purpleTint)};
	color: ${({ $system }) => ($system ? T.primary : T.purple)};
`

const Description = styled.span`
	display: inline-block;
	color: ${T.textSecondary};
	font-size: 13.5px;
	line-height: 1.5;
	max-width: 480px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const UsersPill = styled.span<{ $muted?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 30px;
	padding: 4px 12px;
	border-radius: ${T.radiusPill};
	font-size: 13px;
	font-weight: 700;
	color: ${({ $muted }) => ($muted ? T.textMuted : T.textStrong)};
	background: ${({ $muted }) => ($muted ? T.subtleBg : '#eef4fb')};
	border: 1px solid ${({ $muted }) => ($muted ? T.border : '#d5e5f3')};
`

const Actions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	justify-content: flex-end;
`

const IconAction = styled.button<{ $danger?: boolean }>`
	flex: 0 0 34px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	width: 34px;
	min-width: 34px;
	max-width: 34px;
	height: 34px;
	min-height: 34px;
	max-height: 34px;
	padding: 0;
	margin: 0;
	line-height: 0;
	aspect-ratio: 1 / 1;
	background: transparent;
	border: none;
	border-radius: 50%;
	color: ${T.textSecondary};
	cursor: pointer;
	transition:
		background 160ms ${T.ease},
		color 160ms ${T.ease};

	svg {
		font-size: 19px;
	}

	&:hover:not(:disabled) {
		background: ${({ $danger }) =>
			$danger ? 'rgba(201, 75, 75, 0.12)' : 'rgba(3, 105, 161, 0.12)'};
		color: ${({ $danger }) => ($danger ? T.error : T.primary)};
	}

	&:focus-visible {
		outline: none;
		background: ${({ $danger }) =>
			$danger ? 'rgba(201, 75, 75, 0.12)' : 'rgba(3, 105, 161, 0.12)'};
		color: ${({ $danger }) => ($danger ? T.error : T.primary)};
		box-shadow: 0 0 0 3px
			${({ $danger }) => ($danger ? 'rgba(201, 75, 75, 0.22)' : 'rgba(3, 105, 161, 0.22)')};
	}

	&:disabled {
		color: ${T.textMuted};
		cursor: not-allowed;
		opacity: 0.5;
	}
`

const Pager = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 22px;
	border-top: 1px solid ${T.divider};
	background: ${T.subtleBg};
	font-size: 12.5px;
	color: ${T.textSecondary};

	.pager-current {
		font-weight: 600;
		color: ${T.textStrong};
		font-size: 13px;
	}
`

const PagerButtons = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
`

const PagerBtn = styled.button`
	background: #fff;
	border: 1px solid ${T.border};
	border-radius: ${T.radiusXs};
	padding: 6px 12px;
	font-family: inherit;
	font-size: 12px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	transition:
		background 120ms ${T.ease},
		border-color 120ms ${T.ease};

	&:hover:not(:disabled) {
		border-color: ${T.primary};
		color: ${T.primary};
		background: ${T.primaryTint};
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`

const InlineState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 48px 24px;
	text-align: center;

	.state-title {
		font-size: 16px;
		font-weight: 700;
		color: ${T.textStrong};
	}
	.state-sub {
		font-size: 13.5px;
		line-height: 1.5;
		color: ${T.textSecondary};
		max-width: 44ch;
	}
	.state-cta {
		margin-top: 6px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: ${T.primary};
		color: #fff;
		border: none;
		padding: 9px 16px;
		font-family: inherit;
		font-size: 13px;
		font-weight: 600;
		border-radius: ${T.radiusSm};
		cursor: pointer;
		transition: background 120ms ${T.ease};
	}
	.state-cta svg {
		font-size: 16px;
	}
	.state-cta:hover {
		background: #027cc0;
	}
`

const Skeleton = styled.span<{
	$w?: string
	$h?: string
	$round?: boolean
	$inline?: boolean
}>`
	display: ${({ $inline }) => ($inline ? 'inline-block' : 'block')};
	width: ${({ $w }) => $w ?? '80%'};
	height: ${({ $h }) => $h ?? '12px'};
	background: linear-gradient(90deg, ${T.subtleBg} 0%, ${T.border} 50%, ${T.subtleBg} 100%);
	border-radius: ${({ $round }) => ($round ? '50%' : T.radiusXs)};
	animation: ${skeletonPulse} 1.5s ease-in-out infinite;
`

const SkeletonRoleCell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const SkeletonActions = styled.div`
	display: inline-flex;
	gap: 6px;
	justify-content: flex-end;
`
