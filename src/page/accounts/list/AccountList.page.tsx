import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	SearchOutlined,
	PeopleAltOutlined,
	AddRounded,
	VisibilityOutlined,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type { DataTableColumn } from '../../../components/_shared/DataTable'
import AccountDeleteModal from '../../../components/accounts/list/AccountDeleteModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import type { AccountItem } from '../../../store/accounts/accountsApi'
import { useGetAccountsQuery } from '../../../store/accounts/accountsApi'
import { formatDate } from '../../../utils/format'

const PAGE_SIZE = 20

interface DeleteTarget {
	id: string
	title: string
}

const AccountList = () => {
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, isError, refetch } = useGetAccountsQuery()

	const accounts = data ?? []
	const filtered = useMemo(() => {
		if (!search) return accounts
		const q = search.toLowerCase()
		return accounts.filter(
			(a) =>
				a.firstName.toLowerCase().includes(q) ||
				a.lastName.toLowerCase().includes(q) ||
				(a.platform?.title ?? '').toLowerCase().includes(q)
		)
	}, [accounts, search])

	const total = filtered.length
	const offset = (page - 1) * PAGE_SIZE
	const pageItems = filtered.slice(offset, offset + PAGE_SIZE)

	const columns: DataTableColumn<AccountItem>[] = useMemo(
		() => [
			{
				key: 'account',
				label: 'Account',
				minWidth: 260,
				sortable: true,
				sortValue: (a) => `${a.firstName} ${a.lastName}`,
				render: (a) => (
					<AccountCell>
						<Avatar>{personInitials(a.firstName, a.lastName)}</Avatar>
						<AccountName>
							{a.firstName} {a.lastName}
						</AccountName>
					</AccountCell>
				),
				skeleton: (i) => (
					<AccountCell>
						<TableSkeleton $w='36px' $h='36px' style={{ borderRadius: 10, flexShrink: 0 }} />
						<TableSkeleton $w={`${120 + ((i * 37) % 90)}px`} $h='14px' />
					</AccountCell>
				),
			},
			{
				key: 'platform',
				label: 'Platform',
				minWidth: 160,
				sortable: true,
				sortValue: (a) => a.platform?.title ?? '',
				render: (a) => <PlatformChip>{a.platform?.title ?? '—'}</PlatformChip>,
				skeleton: () => <TableSkeleton $w='100px' $h='20px' style={{ borderRadius: 6 }} />,
			},
			{
				key: 'created',
				label: 'Created',
				minWidth: 130,
				sortable: true,
				sortValue: (a) => new Date(a.createdAt),
				render: (a) => <Muted>{formatDate(a.createdAt, 'short')}</Muted>,
				skeleton: () => <TableSkeleton $w='84px' $h='13px' />,
			},
			{
				key: 'updated',
				label: 'Updated',
				minWidth: 130,
				sortable: true,
				sortValue: (a) => new Date(a.updatedAt),
				render: (a) => <Muted>{formatDate(a.updatedAt, 'short')}</Muted>,
				skeleton: () => <TableSkeleton $w='84px' $h='13px' />,
			},
			{
				key: 'actions',
				label: 'Actions',
				render: (a) => (
					<Actions>
						<PermissionGate permission='accounts:view'>
							<IconAction
								type='button'
								onClick={() => navigate(`/accounts/${a.id}`)}
								aria-label='View account'
							>
								<VisibilityOutlined />
							</IconAction>
						</PermissionGate>
						<PermissionGate permission='accounts:update'>
							<IconAction
								type='button'
								onClick={() => navigate(`/accounts/edit/${a.id}`)}
								aria-label='Edit account'
							>
								<EditOutlined />
							</IconAction>
						</PermissionGate>
						<PermissionGate permission='accounts:delete'>
							<IconAction
								type='button'
								$danger
								onClick={() =>
									setDeleteTarget({ id: a.id, title: `${a.firstName} ${a.lastName}` })
								}
								aria-label='Delete account'
							>
								<DeleteOutline />
							</IconAction>
						</PermissionGate>
					</Actions>
				),
			},
		],
		[navigate]
	)

	return (
		<>
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<span className='crumb-dot' aria-hidden='true' />
							<span className='crumb-parent'>People</span>
							<span className='crumb-sep' aria-hidden='true'>
								/
							</span>
							<span className='current'>Accounts</span>
						</Crumbs>

						<PageHead>
							<div className='title'>
								<HeadIcon>
									<PeopleAltOutlined />
								</HeadIcon>
								<div className='title-text'>
									<h1>Accounts</h1>
									<p>Team members and freelance accounts linked to sources.</p>
								</div>
							</div>
							<PermissionGate permission='accounts:create'>
								<PrimarySolidButton
									type='button'
									onClick={() => navigate('/accounts/add/')}
								>
									<AddRounded />
									New account
								</PrimarySolidButton>
							</PermissionGate>
						</PageHead>

						<FiltersBar>
							<SearchField>
								<SearchOutlined />
								<input
									type='text'
									name='search-account'
									placeholder='Search by name or platform'
									value={search}
									onChange={(e) => {
										setSearch(e.target.value)
										setPage(1)
									}}
									aria-label='Search accounts'
								/>
							</SearchField>
						</FiltersBar>

						<DataTable
							columns={columns}
							rows={pageItems}
							rowKey={(a) => a.id}
							isLoading={isLoading}
							isError={isError}
							onRetry={refetch}
							searchActive={!!search}
							pagination={{
								page,
								pageSize: PAGE_SIZE,
								total,
								onPageChange: setPage,
							}}
						/>
					</ShellInner>
				</ShellCard>
			</ViewFade>

			{deleteTarget && (
				<AccountDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => refetch()}
				/>
			)}
		</>
	)
}

export default AccountList

function personInitials(first: string, last: string): string {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
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

const AccountCell = styled.div`
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

const AccountName = styled.span`
	font-size: 15px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
`

const PlatformChip = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${T.primaryTint};
	color: ${T.primary};
	border: 0;
	font-size: 12px;
	font-weight: 600;
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`
