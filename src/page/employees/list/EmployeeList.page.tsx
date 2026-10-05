import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	GroupsOutlined,
	AddRounded,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import PermissionGate from '../../../components/auth/PermissionGate'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import { useToast } from '../../../context/toast/ToastContext'
import type {
	EmployeeItem,
	EmployeeSortBy,
} from '../../../store/employees/employeesApi'
import {
	useGetEmployeesQuery,
	useDeleteEmployeeMutation,
} from '../../../store/employees/employeesApi'
import { formatDate } from '../../../utils/format'
import useDebouncedValue from '../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

const initials = (first: string, last: string) => {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

const fullName = (e: EmployeeItem) => `${e.firstName} ${e.lastName}`.trim() || '—'

const EmployeeList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

	const { data, isLoading, isError, refetch } = useGetEmployeesQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as EmployeeSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation()

	const items = data?.data ?? []
	const total = data?.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	useEffect(() => {
		setPage(1)
	}, [search])

	const columns: DataTableColumn<EmployeeItem>[] = [
		{
			// Full name column shrinks to its content — no minWidth. Sort
			// key matches the backend enum (firstName is what BE actually
			// orders by).
			key: 'firstName',
			label: 'Full name',
			sortable: true,
			sortValue: (e) => fullName(e),
			render: (e) => (
				<NameCell>
					<Avatar>{initials(e.firstName, e.lastName)}</Avatar>
					<NameText>{fullName(e)}</NameText>
				</NameCell>
			),
			skeleton: () => (
				<NameCell>
					<TableSkeleton $w='36px' $h='36px' style={{ borderRadius: 10, flexShrink: 0 }} />
					<TableSkeleton $w='120px' $h='14px' />
				</NameCell>
			),
		},
		{
			// Email in its own column; also shrinks to content.
			key: 'email',
			label: 'Email',
			sortable: true,
			sortValue: (e) => e.email,
			render: (e) => <EmailCell>{e.email}</EmailCell>,
			skeleton: () => <TableSkeleton $w='180px' $h='13px' />,
		},
		{
			key: 'positions',
			label: 'Positions',
			minWidth: 220,
			render: (e) =>
				e.positions.length > 0 ? (
					<Tags>
						{e.positions.slice(0, 3).map((p) => (
							<Tag key={p}>{p}</Tag>
						))}
						{e.positions.length > 3 && <Sub>+{e.positions.length - 3}</Sub>}
					</Tags>
				) : (
					<Sub>—</Sub>
				),
			skeleton: () => <TableSkeleton $w='120px' $h='20px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 110,
			sortable: true,
			sortValue: (e) => e.status,
			render: (e) => <StatusPill $status={e.status}>{e.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'hiredAt',
			label: 'Hired',
			minWidth: 130,
			sortable: true,
			sortValue: (e) => (e.hiredAt ? new Date(e.hiredAt) : new Date(0)),
			render: (e) => <Sub>{e.hiredAt ? formatDate(e.hiredAt, 'short') : '—'}</Sub>,
			skeleton: () => <TableSkeleton $w='80px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (e) => (
				<Actions>
					<PermissionGate permission='employees:view'>
						<IconAction
							type='button'
							onClick={() => navigate(`/employees/${e.id}`)}
							aria-label='View employee'
						>
							<VisibilityOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='employees:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/employees/edit/${e.id}`)}
							aria-label='Edit employee'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='employees:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: e.id, title: fullName(e) })}
							aria-label='Delete employee'
						>
							<DeleteOutline />
						</IconAction>
					</PermissionGate>
				</Actions>
			),
		},
	]

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await deleteEmployee(deleteTarget.id).unwrap()
			showToast('Employee deleted', 'success')
			setDeleteTarget(null)
			refetch()
		} catch {
			showToast('Failed to delete employee', 'error')
		}
	}

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'People' }, { label: 'Employees', current: true }]}
				icon={<GroupsOutlined />}
				title='Employees'
				subtitle='Team directory — names, contacts and roles.'
				action={
					<PermissionGate permission='employees:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/employees/add')}>
							<AddRounded />
							New employee
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by name or email'
				search={searchInput}
				onSearchChange={setSearchInput}
			>
				<DataTable
					columns={columns}
					rows={items}
					rowKey={(e) => e.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
					sort={sort}
					onSortChange={handleSortChange}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{deleteTarget && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete employee?'
					description={
						<>
							Are you sure you want to delete <strong>&quot;{deleteTarget.title}&quot;</strong>? This action cannot be undone.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onClose={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
					isLoading={deleting}
				/>
			)}
		</>
	)
}

export default EmployeeList

const NameCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
`

const Avatar = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: ${T.subtleBg};
	border: 1px solid ${T.border};
	color: ${T.textSecondary};
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.4px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	flex-shrink: 0;
`

const NameText = styled.div`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
	white-space: nowrap;
`

const EmailCell = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
	white-space: nowrap;
`

const Sub = styled.span`
	font-size: 12.5px;
	color: ${T.textSecondary};
`

const Tags = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	gap: 6px;
	align-items: center;
`

const Tag = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 9px;
	border-radius: 999px;
	font-size: 11.5px;
	font-weight: 600;
	background: ${T.primaryTint};
	color: ${T.primary};
	border: 1px solid #d5e5f3;
`

const StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: ${({ $status }) =>
		$status === 'active' ? 'rgba(21, 128, 61, 0.12)' : 'rgba(100, 116, 139, 0.14)'};
	color: ${({ $status }) => ($status === 'active' ? '#15803d' : '#475569')};
`
