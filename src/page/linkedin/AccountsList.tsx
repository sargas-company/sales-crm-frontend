import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { AnimatedSegmented } from '../../components/_shared/AnimatedSegmented'
import {
	AccountCircleOutlined,
	BusinessCenterOutlined,
	AddRounded,
	DeleteOutline,
	EditOutlined,
	OpenInNewOutlined,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import {
	useGetLinkedInAccountsQuery,
	useDeleteLinkedInAccountMutation,
	type LinkedInAccount,
	type LinkedInAccountType,
} from '../../store/linkedin-accounts/linkedInAccountsApi'

const PAGE_SIZE = 25

const TYPE_LABEL: Record<LinkedInAccountType, string> = {
	PERSONAL: 'Personal',
	COMPANY: 'Company',
}

const LinkedInAccountsList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [type, setType] = useState<LinkedInAccountType | ''>('')
	const [status, setStatus] = useState<'active' | 'inactive' | ''>('')
	const [sort, setSort] = useState<SortState | null>({
		key: 'displayName',
		direction: 'asc',
	})
	const [toDelete, setToDelete] = useState<LinkedInAccount | null>(null)

	const { data, isLoading, isError, refetch } = useGetLinkedInAccountsQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		type: type || undefined,
		status: status || undefined,
		sortBy: (sort?.key as
			| 'displayName'
			| 'type'
			| 'isActive'
			| 'createdAt'
			| 'updatedAt') ?? 'displayName',
		sortDir: sort?.direction ?? 'asc',
	})
	const [deleteAccount, { isLoading: deleting }] =
		useDeleteLinkedInAccountMutation()

	const columns: DataTableColumn<LinkedInAccount>[] = [
		{
			key: 'displayName',
			label: 'Account',
			sortable: true,
			render: (r) => (
				<div>
					<NameText>{r.displayName}</NameText>
					{r.employee && (
						<SubMuted>
							{r.employee.firstName} {r.employee.lastName}
						</SubMuted>
					)}
				</div>
			),
			skeleton: () => <TableSkeleton $w='220px' $h='16px' />,
		},
		{
			key: 'type',
			label: 'Type',
			sortable: true,
			render: (r) => <TypePill $type={r.type}>{TYPE_LABEL[r.type]}</TypePill>,
			skeleton: () => (
				<TableSkeleton $w='70px' $h='22px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'profileUrl',
			label: 'Profile',
			render: (r) => (
				<ProfileLink
					href={r.profileUrl}
					target='_blank'
					rel='noreferrer noopener'
					title={r.profileUrl}
					onClick={(e) => e.stopPropagation()}
				>
					<span>{r.profileUrl.replace(/^https?:\/\//, '')}</span>
					<OpenInNewOutlined style={{ fontSize: 13 }} />
				</ProfileLink>
			),
			skeleton: () => <TableSkeleton $w='200px' $h='14px' />,
		},
		{
			key: 'posts',
			label: 'Posts',
			render: (r) => <CountText>{r._count?.posts ?? 0}</CountText>,
			skeleton: () => <TableSkeleton $w='36px' $h='14px' />,
		},
		{
			key: 'isActive',
			label: 'Status',
			sortable: true,
			render: (r) => (
				<StatusPill $active={r.isActive}>
					{r.isActive ? 'Active' : 'Inactive'}
				</StatusPill>
			),
			skeleton: () => (
				<TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<PermissionGate permission='linkedin_accounts:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/linkedin/accounts/edit/${r.id}`)}
							aria-label='Edit account'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='linkedin_accounts:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setToDelete(r)}
							aria-label='Delete account'
						>
							<DeleteOutline />
						</IconAction>
					</PermissionGate>
				</Actions>
			),
		},
	]

	return (
		<>
			<ListPageShell
				crumbs={[
					{ label: 'LinkedIn' },
					{ label: 'Accounts', current: true },
				]}
				icon={<AccountCircleOutlined />}
				title='LinkedIn accounts'
				subtitle='Directory of the profiles and company pages used to publish content.'
				action={
					<PermissionGate permission='linkedin_accounts:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate('/linkedin/accounts/add')}
						>
							<AddRounded />
							New account
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by name, URL or note'
				search={search}
				onSearchChange={(v) => {
					setSearch(v)
					setPage(1)
				}}
			>
				<FiltersRow>
					<AnimatedSegmented
						items={[
							{ value: '', label: 'All types' },
							{ value: 'PERSONAL', label: 'Personal', color: '#d97706' },
							{ value: 'COMPANY', label: 'Company', color: '#0369a1' },
						]}
						active={type}
						onSelect={(v) => {
							setType(v as LinkedInAccountType | '')
							setPage(1)
						}}
					/>
					<div style={{ marginLeft: 'auto' }}>
						<AnimatedSegmented
							items={[
								{ value: '', label: 'Any status' },
								{ value: 'active', label: 'Active', color: '#059669' },
								{ value: 'inactive', label: 'Inactive', color: '#64748b' },
							]}
							active={status}
							onSelect={(v) => {
								setStatus(v as 'active' | 'inactive' | '')
								setPage(1)
							}}
						/>
					</div>
				</FiltersRow>

				<DataTable
					columns={columns}
					rows={data?.data ?? []}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search || !!type || !!status}
					sort={sort}
					onSortChange={setSort}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total: data?.total ?? 0,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete LinkedIn account?'
					description={
						<>
							Delete <strong>&quot;{toDelete.displayName}&quot;</strong>? Accounts
							with existing posts cannot be deleted — archive them instead.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onConfirm={async () => {
						try {
							await deleteAccount(toDelete.id).unwrap()
							showToast('LinkedIn account deleted', 'success')
							setToDelete(null)
						} catch (err) {
							showToast(parseServerError(err), 'error')
						}
					}}
					onClose={() => setToDelete(null)}
					isLoading={deleting}
				/>
			)}
		</>
	)
}

export default LinkedInAccountsList

const NameCell = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`

const AccountAvatar = styled.span<{ $type: LinkedInAccountType }>`
	width: 32px;
	height: 32px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${({ $type }) =>
		$type === 'COMPANY' ? 'rgba(3, 105, 161, 0.12)' : 'rgba(217, 119, 6, 0.12)'};
	color: ${({ $type }) => ($type === 'COMPANY' ? T.primary : '#b45309')};
	flex-shrink: 0;
`

const NameText = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
`

const SubMuted = styled.div`
	font-size: 11.5px;
	color: ${T.textSecondary};
	margin-top: 1px;
`

const TypePill = styled.span<{ $type: LinkedInAccountType }>`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${({ $type }) =>
		$type === 'COMPANY' ? 'rgba(3, 105, 161, 0.14)' : 'rgba(217, 119, 6, 0.14)'};
	color: ${({ $type }) => ($type === 'COMPANY' ? T.primary : '#b45309')};
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
`

const ProfileLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	max-width: 260px;
	font-size: 12.5px;
	color: ${T.primary};
	text-decoration: none;
	span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	&:hover {
		text-decoration: underline;
	}
`

const CountText = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 13px;
	font-weight: 600;
	color: ${T.textStrong};
`

const StatusPill = styled.span<{ $active: boolean }>`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${({ $active }) =>
		$active ? 'rgba(16, 185, 129, 0.15)' : '#f0edf9'};
	color: ${({ $active }) => ($active ? '#059669' : '#5a5476')};
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
`

const FiltersRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin-bottom: 18px;
`
