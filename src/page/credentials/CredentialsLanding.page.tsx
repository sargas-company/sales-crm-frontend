import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	AddRounded,
	HistoryOutlined,
	LockOutlined,
	VpnKeyOutlined,
	VisibilityOutlined,
	EditOutlined,
	TuneRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { useAppSelector } from '../../hooks'
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
	useListProfilesQuery,
} from '../../store/credentials/credentialsApi'
import VaultSetupGate from './VaultSetupGate'
import VaultIsland from './VaultIsland'
import { useGetVaultStatusQuery } from '../../store/credentials/vaultApi'

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
			render: (r) => (
				<ProfileCell>
					<Avatar>{r.name.slice(0, 2).toUpperCase()}</Avatar>
					<div>
						<ProfName>{r.name}</ProfName>
						{r.description && <ProfMeta>{r.description}</ProfMeta>}
					</div>
				</ProfileCell>
			),
			skeleton: () => (
				<ProfileCell>
					<TableSkeleton
						$w='36px'
						$h='36px'
						style={{ borderRadius: 10, flexShrink: 0 }}
					/>
					<TableSkeleton $w='140px' $h='14px' />
				</ProfileCell>
			),
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
			key: 'tags',
			label: 'Tags',
			minWidth: 180,
			render: (r) =>
				r.tags.length > 0 ? (
					<TagRow>
						{r.tags.slice(0, 3).map((t) => (
							<TagPill key={t}>{t}</TagPill>
						))}
						{r.tags.length > 3 && <TagPill>+{r.tags.length - 3}</TagPill>}
					</TagRow>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='120px' $h='13px' />,
		},
		{
			key: 'updatedAt',
			label: 'Updated',
			minWidth: 120,
			sortable: true,
			sortValue: (r) => new Date(r.updatedAt),
			render: (r) => <Muted>{formatRelative(r.updatedAt)}</Muted>,
			skeleton: () => <TableSkeleton $w='70px' $h='13px' />,
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
				<VaultIsland />
				<AuditLink to='/credentials/vault-settings'>
					<TuneRounded style={{ fontSize: 16 }} />
					My vault access
				</AuditLink>
				{vaultUnlocked && canSeeAudit && (
					<AuditLink to='/credentials/audit'>
						<HistoryOutlined style={{ fontSize: 16 }} />
						Sensitive Access
					</AuditLink>
				)}
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
			<VaultSetupGate />
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

const ProfileCell = styled.div`
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

const ProfName = styled.div`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
`

const ProfMeta = styled.div`
	font-size: 12px;
	color: ${T.textSecondary};
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

const TagRow = styled.span`
	display: inline-flex;
	gap: 4px;
	flex-wrap: wrap;
`

const TagPill = styled.span`
	padding: 2px 8px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: ${T.textSecondary};
`

function formatRelative(iso: string): string {
	const dayMs = 24 * 60 * 60 * 1000
	const diff = Math.floor((Date.now() - new Date(iso).getTime()) / dayMs)
	if (diff <= 0) return 'today'
	if (diff === 1) return 'yesterday'
	if (diff < 7) return `${diff}d ago`
	if (diff < 30) return `${Math.round(diff / 7)}w ago`
	if (diff < 365) return `${Math.round(diff / 30)}mo ago`
	return `${Math.round(diff / 365)}y ago`
}
