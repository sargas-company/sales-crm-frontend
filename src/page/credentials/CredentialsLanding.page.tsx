import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	AddRounded,
	DeleteOutlineRounded,
	HistoryOutlined,
	LockOutlined,
	VpnKeyOutlined,
	VisibilityOutlined,
	EditOutlined,
	TuneRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { useAppSelector } from '../../hooks'
import { useToast } from '../../context/toast/ToastContext'
import { usePageHeader } from './CredentialsLayout'
import {
	Actions,
	DataTable,
	IconAction,
	TableSkeleton,
} from '../../components/_shared/DataTable'
import type {
	DataTableColumn,
	SortState,
} from '../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import {
	type CredentialProfile,
	type CredentialProfileType,
	useHardDeleteProfileMutation,
	useListProfilesQuery,
} from '../../store/credentials/credentialsApi'
import { useGetVaultStatusQuery } from '../../store/credentials/vaultApi'
import VaultIsland from './VaultIsland'
import HardDeleteModal from './HardDeleteModal'

const PAGE_SIZE = 20

const TYPE_LABEL: Record<CredentialProfileType, string> = {
	PERSON: 'Person',
	COMPANY: 'Company',
	OTHER: 'Other',
}

const CredentialsLandingPage = () => {
	const navigate = useNavigate()
	const permissions = useAppSelector((s) => s.auth.permissions ?? [])
	const canSeeAudit = permissions.includes('credential_audit:view')
	const canHardDelete = permissions.includes('credentials:hard_delete')
	const [deleting, setDeleting] = useState<CredentialProfile | null>(null)
	const [hardDeleteProfile] = useHardDeleteProfileMutation()
	const { showToast } = useToast()
	const { data: vaultStatus } = useGetVaultStatusQuery()

	const vaultUnlocked = (() => {
		if (!vaultStatus?.session) return false
		return new Date(vaultStatus.session.expiresAt).getTime() > Date.now()
	})()

	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>({
		key: 'accounts',
		direction: 'desc',
	})

	const { data, isLoading, isError, refetch } = useListProfilesQuery({
		search: search || undefined,
		status: 'ACTIVE',
		limit: PAGE_SIZE,
		page,
	})
	const items = data?.data ?? []
	const total = data?.total ?? 0

	useEffect(() => {
		setPage(1)
	}, [search])

	const columns: DataTableColumn<CredentialProfile>[] = [
		{
			key: 'name',
			label: 'Profile',
			minWidth: 260,
			sortable: true,
			sortValue: (r) => r.name.toLowerCase(),
			render: (r) => <ProfName>{r.name}</ProfName>,
			skeleton: () => <TableSkeleton $w='180px' $h='14px' />,
		},
		{
			key: 'type',
			label: 'Type',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => r.type,
			render: (r) => <TypeChip>{TYPE_LABEL[r.type]}</TypeChip>,
			skeleton: () => (
				<TableSkeleton $w='64px' $h='22px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'accounts',
			label: 'Accounts',
			minWidth: 100,
			sortable: true,
			sortValue: (r) => r._count.accounts,
			render: (r) => <Num>{r._count.accounts}</Num>,
			skeleton: () => <TableSkeleton $w='40px' $h='13px' />,
		},
		{
			key: 'createdAt',
			label: 'Created',
			minWidth: 190,
			sortable: true,
			sortValue: (r) => new Date(r.createdAt),
			render: (r) => <DateTimeCell iso={r.createdAt} />,
			skeleton: () => <TableSkeleton $w='180px' $h='14px' />,
		},
		{
			key: 'updatedAt',
			label: 'Updated',
			minWidth: 190,
			sortable: true,
			sortValue: (r) => new Date(r.updatedAt),
			render: (r) => <DateTimeCell iso={r.updatedAt} />,
			skeleton: () => <TableSkeleton $w='180px' $h='14px' />,
		},
		...(vaultUnlocked
			? [
					{
						key: 'actions',
						label: 'Actions',
						render: (r: CredentialProfile) => (
							<Actions>
								<IconAction
									type='button'
									onClick={() =>
										navigate(`/credentials/profiles/${r.id}`)
									}
									aria-label='View profile'
								>
									<VisibilityOutlined />
								</IconAction>
								<PermissionGate permission='credentials:update'>
									<IconAction
										type='button'
										onClick={() =>
											navigate(
												`/credentials/profiles/${r.id}/edit`,
											)
										}
										aria-label='Edit profile'
									>
										<EditOutlined />
									</IconAction>
								</PermissionGate>
								{canHardDelete && (
									<IconAction
										type='button'
										$danger
										onClick={() => setDeleting(r)}
										aria-label='Permanently delete profile'
									>
										<DeleteOutlineRounded />
									</IconAction>
								)}
							</Actions>
						),
					} as DataTableColumn<CredentialProfile>,
				]
			: []),
	]

	usePageHeader({
		crumbs: [
			{ label: 'Secure' },
			{ label: 'Credentials', current: true },
		],
		icon: <VpnKeyOutlined />,
		title: 'Credentials',
		subtitle:
			'One safe place for every human account the team shares.',
		action: (
			<HeroActions>
				<AuditLink to='/settings?s=vault_mfa'>
					<TuneRounded style={{ fontSize: 16 }} />
					My vault access
				</AuditLink>
				{vaultUnlocked && canSeeAudit && (
					<AuditLink to='/audit-log/sensitive-access'>
						<HistoryOutlined style={{ fontSize: 16 }} />
						Sensitive Access
					</AuditLink>
				)}
				<VaultIsland />
				{vaultUnlocked && (
					<PermissionGate permission='credentials:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate('/credentials/profiles/new')}
						>
							<AddRounded />
							New profile
						</PrimarySolidButton>
					</PermissionGate>
				)}
			</HeroActions>
		),
		searchPlaceholder: 'Search profiles',
		search: searchInput,
		onSearchChange: setSearchInput,
	})

	return (
		<>
			<DataTable
				columns={columns}
				rows={items}
				rowKey={(r) => r.id}
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				searchActive={!!search}
				sort={sort}
				onSortChange={(next) => {
					setSort(next)
					setPage(1)
				}}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					total,
					onPageChange: setPage,
				}}
				emptyIcon={<LockOutlined />}
				emptyTitle='No profiles yet'
				emptyTitleSearch='No profiles match your search'
			/>

			{deleting && (
				<HardDeleteModal
					title='Permanently delete profile'
					description='This removes every account, encrypted secret and version history inside. Audit entries remain forever. This cannot be undone.'
					confirmationLabel={deleting.name}
					expectedConfirmation={deleting.name}
					onClose={() => setDeleting(null)}
					onConfirm={async ({ confirmation, mfa }) => {
						await hardDeleteProfile({
							id: deleting.id,
							confirmation,
							mfa,
						}).unwrap()
						showToast('Profile deleted', 'success')
						setDeleting(null)
					}}
				/>
			)}
		</>
	)
}

export default CredentialsLandingPage



const HeroActions = styled.div`
	display: inline-flex;
	gap: 8px;
	align-items: center;
`

const AuditLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 9px 14px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	color: ${T.textSecondary};
	background: #ffffff;
	font-weight: 600;
	font-size: 12.5px;
	text-decoration: none;
	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`

const ProfName = styled.div`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
`

const TypeChip = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: rgba(3, 105, 161, 0.1);
	color: ${T.primary};
`

const Num = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

/* Stacked date-time cell: short date on top (e.g. "21 Oct 2026"),
 * precise HH:MM:SS below in muted mono. Reads cleaner than a single
 * ISO string, still carries full second-level precision. */
const MONTH_SHORT = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
]

const DateTimeCell = ({ iso }: { iso: string }) => {
	const d = new Date(iso)
	const pad = (n: number) => String(n).padStart(2, '0')
	const date = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
	const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
	return (
		<DateTimeInline>
			<span className='date'>{date}</span>
			<span className='sep'>·</span>
			<span className='time'>{time}</span>
		</DateTimeInline>
	)
}

const DateTimeInline = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	white-space: nowrap;

	.date {
		font-size: 13px;
		font-weight: 600;
		color: ${T.textStrong};
	}
	.sep {
		color: ${T.textSecondary};
		opacity: 0.5;
	}
	.time {
		font-size: 12px;
		font-weight: 500;
		color: ${T.textSecondary};
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-variant-numeric: tabular-nums;
	}
`
