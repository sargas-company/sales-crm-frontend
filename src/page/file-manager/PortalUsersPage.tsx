import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
	BlockRounded,
	CheckCircleOutlineRounded,
	ClearRounded,
	DeleteOutline,
	FilterListOutlined,
	FolderOutlined,
	InsertDriveFileOutlined,
	PeopleOutlineRounded,
	SearchOutlined,
	VisibilityOutlined,
} from '@mui/icons-material'

import BulkActionBar from '../../components/_shared/BulkActionBar'
import ConfirmModal from '../../components/_shared/ConfirmModal'
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
import {
	BottomSlot,
	ClearBtn as FreshClearBtn,
	FreshFiltersWrap,
	RowBreak,
	SearchPill,
} from '../../components/_shared/filters/freshPaperFilters'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../analytics/filters/filters.styled'
import { useToast } from '../../context/toast/ToastContext'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import {
	useReactivatePortalUserMutation,
	useRevokeShareMutation,
	useTerminatePortalUserMutation,
	type PortalUserDetail,
	type PortalUserRow,
} from '../../store/file-manager/fileManagerShareApi'
import { formatDate } from '../../utils/format'

/* ─── TEMP demo data ──────────────────────────────────────────────── */
/* Real data arrives when the first worker accepts an invite. Until
 * then, this hard-coded set lets the owner audit the admin UI
 * visually. Remove together with the two `const … = DEMO_*` lines
 * below once end-to-end flow is smoke-tested. */

const DEMO_USERS: PortalUserRow[] = [
	{
		id: 'demo-alex',
		email: 'alex.hartford@gmail.com',
		displayName: 'Alex Hartford',
		firstName: 'Alex',
		lastName: 'Hartford',
		avatarUrl: null,
		discordId: '234567890123456789',
		active: true,
		createdAt: '2026-09-14T10:12:00Z',
		_count: { fileManagerSharesReceived: 12 },
	},
	{
		id: 'demo-maria',
		email: 'maria.novak@proton.me',
		displayName: 'Maria Novak',
		firstName: 'Maria',
		lastName: 'Novak',
		avatarUrl: null,
		discordId: '345678901234567890',
		active: true,
		createdAt: '2026-10-02T15:34:00Z',
		_count: { fileManagerSharesReceived: 8 },
	},
	{
		id: 'demo-sergey',
		email: 'sergey.petrov@gmail.com',
		displayName: 'Sergey Petrov',
		firstName: 'Sergey',
		lastName: 'Petrov',
		avatarUrl: null,
		discordId: '456789012345678901',
		active: true,
		createdAt: '2026-10-18T09:20:00Z',
		_count: { fileManagerSharesReceived: 25 },
	},
	{
		id: 'demo-emma',
		email: 'emma.k@outlook.com',
		displayName: 'Emma Köhler',
		firstName: 'Emma',
		lastName: 'Köhler',
		avatarUrl: null,
		discordId: '567890123456789012',
		active: false,
		createdAt: '2026-08-01T11:00:00Z',
		_count: { fileManagerSharesReceived: 9 },
	},
	{
		id: 'demo-takeshi',
		email: 'takeshi.sato@gmail.com',
		displayName: null,
		firstName: 'Takeshi',
		lastName: 'Sato',
		avatarUrl: null,
		discordId: '678901234567890123',
		active: true,
		createdAt: '2026-10-24T18:45:00Z',
		_count: { fileManagerSharesReceived: 7 },
	},
	{
		id: 'demo-oliver',
		email: 'oliver.wiseman@gmail.com',
		displayName: 'Oliver Wiseman',
		firstName: 'Oliver',
		lastName: 'Wiseman',
		avatarUrl: null,
		discordId: '789012345678901234',
		active: true,
		createdAt: '2026-10-25T07:11:00Z',
		_count: { fileManagerSharesReceived: 0 },
	},
]

const DEMO_DETAILS: Record<string, PortalUserDetail> = Object.fromEntries(
	DEMO_USERS.map((u) => [
		u.id,
		{
			...u,
			fileManagerSharesReceived: Array.from(
				{ length: u._count.fileManagerSharesReceived },
				(_, i) => ({
					id: `${u.id}-s-${i}`,
					userId: u.id,
					resourceType: i % 4 === 3 ? 'FILE' : 'FOLDER',
					resourceId: `${u.id}-r-${i}`,
					recursive: i % 2 === 0,
					canDownload: true,
					canUpload: i % 3 === 0,
					canCreateSubfolders: i === 0,
					grantedById: null,
					createdAt: u.createdAt,
					updatedAt: u.createdAt,
					resourceName:
						i % 4 === 3
							? [
									'proposal.pdf',
									'notes.md',
									'brief.docx',
									'invoice-signed.pdf',
									'contract-draft.pdf',
									'logo-vector.svg',
									'mockup-final.sketch',
									'onboarding.pptx',
									'budget-q4.xlsx',
								][i % 9]
							: [
									'Projects',
									'Clients',
									'Internal',
									'Research',
									'Archive',
									'Shared',
									'Deliverables',
									'Brand-Assets',
									'Legal-Docs',
									'Marketing',
									'Design-System',
									'EU-Expansion',
									'Q4-Reports',
									'Templates',
									'Scratch',
									'Approved',
									'In-Review',
									'Backup',
									'Vault',
								][i % 19],
					user: null as unknown as (typeof u._count) extends infer _ ? never : never,
					grantedBy: {
						id: 'u1',
						firstName: 'Vadim',
						lastName: '',
						email: 'v@sargas.io',
					},
				}),
			) as unknown as PortalUserDetail['fileManagerSharesReceived'],
		},
	]),
)

/* ─── Helpers ─────────────────────────────────────────────────────── */

const fullName = (u: PortalUserRow): string => {
	const parts = [u.firstName, (u as unknown as { lastName?: string | null }).lastName]
		.filter((p): p is string => !!p && p.length > 0)
	if (parts.length > 0) return parts.join(' ')
	return u.displayName ?? u.email
}

/* "Joined X days/months/years ago" — compact signal below the date. */
const tenureCompact = (iso: string): string => {
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return ''
	const now = new Date()
	const ms = now.getTime() - d.getTime()
	const days = Math.floor(ms / (1000 * 60 * 60 * 24))
	if (days < 1) return 'today'
	if (days < 7) return `${days}d ago`
	if (days < 30) return `${Math.floor(days / 7)}w ago`
	if (days < 365) return `${Math.floor(days / 30)}mo ago`
	const years = Math.floor(days / 365)
	const rem = Math.floor((days % 365) / 30)
	return rem > 0 ? `${years}y ${rem}mo` : `${years}y ago`
}

const JoinedCell = ({ iso }: { iso: string }) => (
	<JoinedStack>
		<JoinedTop>{formatDate(iso, 'short')}</JoinedTop>
		<JoinedBottom>{tenureCompact(iso)}</JoinedBottom>
	</JoinedStack>
)

/* ─── Main page ───────────────────────────────────────────────────── */

type StatusPreset = '' | 'ACTIVE' | 'TERMINATED'

const STATUS_PRESETS: { value: StatusPreset; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'TERMINATED', label: 'Terminated' },
]

const PAGE_SIZE = 20

export const PortalUsersPage = () => {
	const users = DEMO_USERS
	const { showToast } = useToast()

	const [statusPreset, setStatusPreset] = useState<StatusPreset>('')
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput, 200)
	const [sort, setSort] = useState<SortState | null>({
		key: 'createdAt',
		direction: 'desc',
	})
	const [page, setPage] = useState(1)
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [viewTarget, setViewTarget] = useState<string | null>(null)
	const [terminateTarget, setTerminateTarget] = useState<PortalUserRow | null>(
		null,
	)
	const [bulkTerminateOpen, setBulkTerminateOpen] = useState(false)

	const [terminate] = useTerminatePortalUserMutation()
	const [reactivate] = useReactivatePortalUserMutation()

	/* Tape indicator rect — tracks active preset pill. */
	const pillsRef = useRef<HTMLDivElement | null>(null)
	const [ind, setInd] = useState({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		const container = pillsRef.current
		if (!container) return
		const active = container.querySelector<HTMLButtonElement>(
			'[data-active]',
		)
		if (!active) {
			setInd({ left: 0, width: 0, opacity: 0 })
			return
		}
		const cRect = container.getBoundingClientRect()
		const aRect = active.getBoundingClientRect()
		setInd({ left: aRect.left - cRect.left, width: aRect.width, opacity: 1 })
	}, [statusPreset])

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		return users.filter((u) => {
			if (statusPreset === 'ACTIVE' && !u.active) return false
			if (statusPreset === 'TERMINATED' && u.active) return false
			if (q) {
				const hay = [
					u.email,
					u.displayName ?? '',
					u.firstName ?? '',
					u.discordId ?? '',
				]
					.join(' ')
					.toLowerCase()
				if (!hay.includes(q)) return false
			}
			return true
		})
	}, [users, statusPreset, search])

	const total = filtered.length

	const paged = useMemo(() => {
		const start = (page - 1) * PAGE_SIZE
		return filtered.slice(start, start + PAGE_SIZE)
	}, [filtered, page])

	const activeFilterCount = (statusPreset !== '' ? 1 : 0) + (search ? 1 : 0)
	const clearFilters = () => {
		setStatusPreset('')
		setSearchInput('')
	}

	const toggleRow = (id: string, next: boolean) => {
		setSelected((prev) => {
			const n = new Set(prev)
			if (next) n.add(id)
			else n.delete(id)
			return n
		})
	}
	const toggleAllOnPage = (rows: PortalUserRow[], next: boolean) => {
		setSelected((prev) => {
			const n = new Set(prev)
			for (const r of rows) {
				if (next) n.add(r.id)
				else n.delete(r.id)
			}
			return n
		})
	}
	const clearSelection = () => setSelected(new Set())

	const handleBulkTerminate = async () => {
		for (const id of selected) {
			try {
				await terminate(id).unwrap()
			} catch {
				/* skip failed ones silently; could aggregate */
			}
		}
		showToast(`${selected.size} user(s) terminated`, 'success')
		clearSelection()
		setBulkTerminateOpen(false)
	}

	const handleBulkReactivate = async () => {
		for (const id of selected) {
			try {
				await reactivate(id).unwrap()
			} catch {
				/* skip */
			}
		}
		showToast(`${selected.size} user(s) reactivated`, 'success')
		clearSelection()
	}

	const anyActiveSelected = Array.from(selected).some(
		(id) => users.find((u) => u.id === id)?.active,
	)
	const anyTerminatedSelected = Array.from(selected).some(
		(id) => !users.find((u) => u.id === id)?.active,
	)

	const columns: DataTableColumn<PortalUserRow>[] = [
		{
			key: 'name',
			label: 'Name',
			minWidth: 180,
			sortable: true,
			sortValue: (u) => fullName(u),
			render: (u) => <NameText>{fullName(u)}</NameText>,
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'email',
			label: 'Email',
			minWidth: 220,
			sortable: true,
			sortValue: (u) => u.email,
			render: (u) => <EmailCell>{u.email}</EmailCell>,
			skeleton: () => <TableSkeleton $w='180px' $h='14px' />,
		},
		{
			key: 'discordId',
			label: 'Discord ID',
			minWidth: 180,
			render: (u) => <DiscordId>{u.discordId ?? '—'}</DiscordId>,
			skeleton: () => <TableSkeleton $w='160px' $h='14px' />,
		},
		{
			key: 'shares',
			label: 'Shares',
			minWidth: 100,
			sortable: true,
			sortValue: (u) => u._count.fileManagerSharesReceived,
			render: (u) => (
				<SharesBadge $zero={u._count.fileManagerSharesReceived === 0}>
					{u._count.fileManagerSharesReceived}
				</SharesBadge>
			),
			skeleton: () => <TableSkeleton $w='40px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 110,
			sortable: true,
			sortValue: (u) => (u.active ? 'ACTIVE' : 'TERMINATED'),
			render: (u) => (
				<StatusPill $active={u.active}>
					{u.active ? 'Active' : 'Terminated'}
				</StatusPill>
			),
			skeleton: () => (
				<TableSkeleton $w='70px' $h='22px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'createdAt',
			label: 'Joined',
			minWidth: 140,
			sortable: true,
			sortValue: (u) => u.createdAt,
			render: (u) => <JoinedCell iso={u.createdAt} />,
			skeleton: () => <TableSkeleton $w='90px' $h='32px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (u) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => setViewTarget(u.id)}
						aria-label='View details'
					>
						<VisibilityOutlined />
					</IconAction>
					{u.active ? (
						<IconAction
							type='button'
							$danger
							onClick={() => setTerminateTarget(u)}
							aria-label='Terminate'
						>
							<BlockRounded />
						</IconAction>
					) : (
						<IconAction
							type='button'
							onClick={async () => {
								try {
									await reactivate(u.id).unwrap()
									showToast('User reactivated', 'success')
								} catch {
									showToast('Reactivation failed', 'error')
								}
							}}
							aria-label='Reactivate'
						>
							<CheckCircleOutlineRounded />
						</IconAction>
					)}
				</Actions>
			),
		},
	]

	return (
		<>
			<ListPageShell
				crumbs={[
					{ label: 'File Manager' },
					{ label: 'Portal Users', current: true },
				]}
				icon={<PeopleOutlineRounded />}
				title='Portal Users'
				subtitle='External workers with Discord-login access to shared folders.'
				filters={
					<FiltersWrap role='region' aria-label='Portal users filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Filter</span>
								<span className='bot'>
									{STATUS_PRESETS.find((p) => p.value === statusPreset)?.label ??
										'All'}
								</span>
							</div>
						</div>

						<TapePills ref={pillsRef} role='tablist' aria-label='Status preset'>
							<TapeIndicator
								style={{
									transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
									width: `${ind.width}px`,
									opacity: ind.opacity,
								}}
							/>
							{STATUS_PRESETS.map((p) => (
								<TapePill
									key={p.value || 'all'}
									type='button'
									role='tab'
									data-active={statusPreset === p.value || undefined}
									aria-selected={statusPreset === p.value}
									$active={statusPreset === p.value}
									onClick={() => setStatusPreset(p.value)}
								>
									{p.label}
								</TapePill>
							))}
						</TapePills>

						<div className='filter-spacer' />

						<div className='upwork-hint' aria-hidden='true'>
							<span className='row'>
								<span className='w'>every</span>
								<span className='amber-wrap'>
									<span className='a'>WORKER</span>
									<svg
										className='squiggle'
										viewBox='0 0 120 12'
										width='120'
										height='12'
										preserveAspectRatio='none'
									>
										<path
											d='M2 8 Q 12 2, 22 8 T 42 8 T 62 8 T 82 8 T 102 8 T 118 8'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
										/>
									</svg>
								</span>
								<span className='w'>with access</span>
							</span>
						</div>

						<RowBreak />

						<BottomSlot>
							<SearchPill>
								<SearchOutlined className='ico' />
								<input
									type='text'
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									placeholder='Search by name, email or Discord ID'
									aria-label='Search portal users'
								/>
							</SearchPill>
						</BottomSlot>

						<div className='filter-spacer' />

						<FreshClearBtn
							type='button'
							onClick={clearFilters}
							disabled={activeFilterCount === 0}
						>
							<ClearRounded style={{ fontSize: 15 }} />
							Clear
						</FreshClearBtn>
					</FiltersWrap>
				}
			>
				<DataTable<PortalUserRow>
					columns={columns}
					rows={paged}
					rowKey={(u) => u.id}
					isLoading={false}
					searchActive={!!search}
					sort={sort}
					onSortChange={setSort}
					selection={{
						selected,
						onToggleRow: toggleRow,
						onToggleAllOnPage: toggleAllOnPage,
						headerLabel: 'Select all portal users on this page',
						rowLabel: (u) => `Select ${u.displayName ?? u.email}`,
					}}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			<BulkActionBar
				count={selected.size}
				onClear={clearSelection}
				onConfirm={() => setBulkTerminateOpen(true)}
				label={`Terminate ${selected.size}`}
				hideDelete={!anyActiveSelected}
				secondaryActions={
					anyTerminatedSelected
						? [
								{
									key: 'reactivate',
									icon: <CheckCircleOutlineRounded style={{ fontSize: 18 }} />,
									label: 'Reactivate',
									onClick: handleBulkReactivate,
								},
							]
						: undefined
				}
			/>

			{viewTarget && (
				<PortalUserDetailModal
					userId={viewTarget}
					onClose={() => setViewTarget(null)}
				/>
			)}

			{terminateTarget && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Terminate portal user?'
					description={
						<>
							<strong>
								{terminateTarget.displayName ??
									terminateTarget.firstName ??
									terminateTarget.email}
							</strong>{' '}
							will lose access within 15 minutes. Their shares stay in the system
							— reactivation restores access.
						</>
					}
					confirmLabel='Terminate'
					confirmColor='error'
					cancelLabel='Cancel'
					onConfirm={async () => {
						try {
							await terminate(terminateTarget.id).unwrap()
							showToast('User terminated', 'success')
							setTerminateTarget(null)
						} catch {
							showToast('Termination failed', 'error')
						}
					}}
					onClose={() => setTerminateTarget(null)}
				/>
			)}

			{bulkTerminateOpen && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title={`Terminate ${selected.size} user${selected.size === 1 ? '' : 's'}?`}
					description='Each will lose access within 15 minutes. Their shares stay in the system.'
					confirmLabel={`Terminate ${selected.size}`}
					confirmColor='error'
					cancelLabel='Cancel'
					onConfirm={handleBulkTerminate}
					onClose={() => setBulkTerminateOpen(false)}
				/>
			)}
		</>
	)
}

/* ─── Detail modal — shares list ──────────────────────────────────── */

const PortalUserDetailModal = ({
	userId,
	onClose,
}: {
	userId: string
	onClose: () => void
}) => {
	const user = DEMO_DETAILS[userId]
	const [revokeShare] = useRevokeShareMutation()
	const { showToast } = useToast()
	/* Done/Confirm should play the same scrim+scale exit animation as
	 * Cancel/outside. ConfirmModal's `onConfirm` fires straight through
	 * (no animation), so we route Done through `forceClose` which
	 * triggers the regular close sequence inside the modal. */
	const [closing, setClosing] = useState(false)
	const handleRevoke = async (s: PortalUserDetail['fileManagerSharesReceived'][number]) => {
		try {
			await revokeShare({
				id: s.id,
				resourceType: s.resourceType,
				resourceId: s.resourceId,
			}).unwrap()
			showToast('Share revoked', 'success')
		} catch {
			showToast('Revoke failed', 'error')
		}
	}
	if (!user) return null
	return (
		<ConfirmModal
			icon={<PeopleOutlineRounded />}
			iconTone='ink'
			title='Portal user'
			description=''
			confirmLabel='Done'
			confirmColor='ink'
			cancelLabel='Close'
			onConfirm={() => setClosing(true)}
			onClose={onClose}
			forceClose={closing}
			maxWidth={620}
		>
			<DetailBody>
				{/* Hero — ink gradient strip with name, status chip,
				 *  Discord ID and joined time. Avatar circle intentionally
				 *  removed (owner's call). */}
				<AHero>
					<AHeroBg />
					<AInfo>
						<AName>
							{(user as unknown as { lastName?: string | null }).lastName
								? `${user.firstName} ${(user as unknown as { lastName?: string | null }).lastName}`
								: user.firstName || user.email}
						</AName>
						<AEmail>{user.email}</AEmail>
						<AMetaRow>
							<AChip $tone={user.active ? 'ok' : 'off'}>
								{user.active ? 'Active' : 'Terminated'}
							</AChip>
							<AMetaText>{user.discordId ?? 'no discord id'}</AMetaText>
							<AMetaText>·</AMetaText>
							<AMetaText>joined {tenureCompact(user.createdAt)}</AMetaText>
						</AMetaRow>
					</AInfo>
				</AHero>

				{/* Shares (from direction B) — permission matrix. Each row
				 *  renders 4 bit cells for download / upload / mkdir /
				 *  recursive; lit (ink) = granted, dim = denied. */}
				<SharesSubTitle>Shares ({user.fileManagerSharesReceived.length})</SharesSubTitle>
				<BLegend>
					<BLegendItem><BIconDl /> download</BLegendItem>
					<BLegendItem><BIconUp /> upload</BLegendItem>
					<BLegendItem><BIconMkdir /> create subfolder</BLegendItem>
					<BLegendItem><BIconRec /> recursive</BLegendItem>
				</BLegend>
				<SharesScroll>
					{user.fileManagerSharesReceived.map((s) => (
						<BRow key={s.id}>
							<BResource>
								{s.resourceType === 'FOLDER' ? (
									<FileBadgeFolder>
										<FileBadgeFold />
										<FileBadgeExt>DIR</FileBadgeExt>
									</FileBadgeFolder>
								) : (
									<FileBadgeFile $kind={fileKind(resName(s))}>
										<FileBadgeFold />
										<FileBadgeExt>{fileExt(resName(s))}</FileBadgeExt>
									</FileBadgeFile>
								)}
								<BResourceName>{resName(s)}</BResourceName>
							</BResource>
							<BMatrix>
								<BBit $on={s.canDownload}><BIconDl /></BBit>
								<BBit $on={s.canUpload}><BIconUp /></BBit>
								<BBit $on={s.canCreateSubfolders}><BIconMkdir /></BBit>
								<BBit $on={s.recursive}><BIconRec /></BBit>
							</BMatrix>
							<IconAction type='button' $danger aria-label='Revoke share' onClick={() => handleRevoke(s)}>
								<DeleteOutline />
							</IconAction>
						</BRow>
					))}
				</SharesScroll>
			</DetailBody>
		</ConfirmModal>
	)
}

/* ─── Detail variants ────────────────────────────────────────────── */

type DetailShare = PortalUserDetail['fileManagerSharesReceived'][number]
const resName = (s: DetailShare): string =>
	(s as DetailShare & { resourceName: string | null }).resourceName ??
	`(${s.resourceType.toLowerCase()})`

/* Pick a gradient family for the file-badge from the extension —
 * mirrors AttachmentsSection / UploadTray palette. */
const fileKind = (name: string): 'pdf' | 'img' | 'doc' | 'other' => {
	const ext = (name.split('.').pop() ?? '').toLowerCase()
	if (ext === 'pdf') return 'pdf'
	if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'avif'].includes(ext))
		return 'img'
	if (
		['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'md', 'txt', 'json'].includes(ext)
	)
		return 'doc'
	return 'other'
}
const fileExt = (name: string): string => {
	const i = name.lastIndexOf('.')
	if (i < 0 || i === name.length - 1) return 'FILE'
	return name.slice(i + 1, i + 5).toUpperCase()
}

/* Mini permission icons for the shares matrix — inline SVG so we tint
 * them via `currentColor` (ink when `$on`, muted slate otherwise). */
const BIconDl = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M12 3v12m0 0l-5-5m5 5l5-5M4 21h16' />
	</svg>
)
const BIconUp = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M12 21V9m0 0l-5 5m5-5l5 5M4 3h16' />
	</svg>
)
const BIconMkdir = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z' />
		<path d='M12 11v6M9 14h6' />
	</svg>
)
const BIconRec = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M17 2.5a7 7 0 0 1 0 10l-3 3a7 7 0 0 1-10-10l1.5-1.5M7 21.5a7 7 0 0 1 0-10l3-3a7 7 0 0 1 10 10l-1.5 1.5' />
	</svg>
)

/* ─── Styled ──────────────────────────────────────────────────────── */

/* Filter wrap — matches Employees exactly. Base is FreshFiltersWrap
 * which already brings `.filter-lead` (dark FILTER block with ink icon
 * + vertical rule + preset label) and `.upwork-hint` (Caveat
 * handwritten callout with PAPER_ACCENT orange squiggle). Overriding
 * those here is what caused the wrong amber shade — now left alone. */
const FiltersWrap = styled(FreshFiltersWrap)`
	width: 100%;
	padding: 18px 22px;
`

const NameText = styled.div`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	font-weight: 600;
	color: #0f172a;
	line-height: 1.3;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const DiscordId = styled.span`
	font-size: 13px;
	color: #475569;
	font-variant-numeric: tabular-nums;
`
const SharesBadge = styled.span<{ $zero: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 32px;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${({ $zero }) =>
		$zero ? 'rgba(15, 23, 42, 0.04)' : 'rgba(99, 102, 241, 0.1)'};
	color: ${({ $zero }) => ($zero ? '#94a3b8' : '#4338ca')};
	font-size: 12px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
`
/* Status pill — mirrors Employees `StatusPill` conventions exactly:
 * 4px/10px padding, 11px/700 uppercase, letter-spacing 0.3, 999 radius. */
const StatusPill = styled.span<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: ${({ $active }) =>
		$active ? 'rgba(21, 128, 61, 0.12)' : 'rgba(100, 116, 139, 0.14)'};
	color: ${({ $active }) => ($active ? '#15803d' : '#475569')};
`
const JoinedStack = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
	line-height: 1.15;
	white-space: nowrap;
`
const JoinedTop = styled.span`
	font-size: 13.5px;
	font-weight: 700;
	color: #0f172a;
	font-variant-numeric: tabular-nums;
	letter-spacing: 0.1px;
`
const JoinedBottom = styled.span`
	font-size: 11px;
	font-weight: 500;
	color: #64748b;
	font-variant-numeric: tabular-nums;
`
const EmailCell = styled.span`
	font-size: 13px;
	color: #475569;
	font-weight: 400;
`

/* Detail modal content */
const DetailBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	margin-top: 12px;
`
const SharesSubTitle = styled.div`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 11.5px;
	font-weight: 500;
	color: #94a3b8;
	text-transform: uppercase;
	letter-spacing: 0.6px;
`

/* ─── Direction A styled — Hero avatar + folder-card tiles ──────── */
const AHero = styled.div`
	position: relative;
	padding: 20px 24px;
	border-radius: 14px;
	overflow: hidden;
`
const AHeroBg = styled.div`
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%);
	z-index: 0;
	&::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -10%;
		width: 220px;
		height: 220px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(148, 163, 184, 0.3), transparent 70%);
		pointer-events: none;
	}
`
const AInfo = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`
const AName = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 18px;
	font-weight: 800;
	color: #ffffff;
	letter-spacing: -0.3px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const AEmail = styled.div`
	font-size: 13px;
	color: rgba(203, 213, 225, 0.9);
	font-weight: 400;
	margin-top: 4px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const AMetaRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	margin-top: 8px;
`
const AChip = styled.span<{ $tone: 'ok' | 'off' }>`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 10.5px;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	background: ${({ $tone }) => ($tone === 'ok' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(148, 163, 184, 0.25)')};
	color: ${({ $tone }) => ($tone === 'ok' ? '#86efac' : '#cbd5e1')};
`
const AMetaText = styled.span`
	font-size: 12px;
	color: rgba(203, 213, 225, 0.85);
`
/* ─── Resource badge — mime-color gradient (UploadTray language) ─── */
const FileBadgeFolder = styled.div`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding-bottom: 4px;
	width: 32px;
	height: 36px;
	border-radius: 6px;
	background: linear-gradient(135deg, #0f172a, #334155);
	box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.3);
`
const FileBadgeFile = styled.div<{ $kind: 'pdf' | 'img' | 'doc' | 'other' }>`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding-bottom: 4px;
	width: 32px;
	height: 36px;
	border-radius: 6px;
	background: ${({ $kind }) =>
		$kind === 'pdf'
			? 'linear-gradient(135deg, #f87171, #dc2626)'
			: $kind === 'img'
				? 'linear-gradient(135deg, #60a5fa, #2563eb)'
				: $kind === 'doc'
					? 'linear-gradient(135deg, #4ade80, #16a34a)'
					: 'linear-gradient(135deg, #fbbf24, #f59e0b)'};
	box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.2);
`
const FileBadgeFold = styled.span`
	position: absolute;
	top: 0;
	right: 0;
	width: 10px;
	height: 10px;
	background: linear-gradient(
		225deg,
		rgba(255, 255, 255, 0.5) 0%,
		rgba(255, 255, 255, 0.5) 50%,
		rgba(0, 0, 0, 0.08) 50%,
		rgba(0, 0, 0, 0.08) 100%
	);
	border-radius: 0 6px 0 4px;
`
const FileBadgeExt = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 8px;
	font-weight: 800;
	letter-spacing: 0.6px;
	color: #ffffff;
`

/* ─── Shares matrix styled (direction B) ─────────────────────────── */
const BLegend = styled.div`
	display: inline-flex;
	gap: 14px;
	padding: 6px 10px;
	font-size: 11px;
	color: #64748b;
`
const BLegendItem = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	color: #94a3b8;
`
const BRow = styled.div`
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: 12px;
	align-items: center;
	padding: 8px 12px;
	border-radius: 8px;
	transition: background 160ms ease;
	&:hover { background: #f8fafc; }
`
const BResource = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
`
const BResourceName = styled.span`
	font-size: 13px;
	color: #0f172a;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const BMatrix = styled.div`
	display: inline-flex;
	gap: 2px;
	padding: 2px;
	border-radius: 6px;
	background: rgba(15, 23, 42, 0.03);
`
const BBit = styled.span<{ $on: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border-radius: 6px;
	background: ${({ $on }) => ($on ? '#0f172a' : 'transparent')};
	color: ${({ $on }) => ($on ? '#ffffff' : 'rgba(15, 23, 42, 0.18)')};
	transition: background 160ms ease, color 160ms ease;
`

/* ─── Direction C styled — Quiet typography ─────────────────────── */
const CMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`
const CMetaLine = styled.div`
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 10px;
	align-items: baseline;
	font-size: 13px;
`
const CKey = styled.span`
	color: #94a3b8;
	font-size: 12px;
`
const CVal = styled.span`
	color: #0f172a;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const CTime = styled.span`
	color: #94a3b8;
	font-weight: 400;
`
const CDivider = styled.div`
	height: 1px;
	background: rgba(15, 23, 42, 0.06);
	margin: 4px 0;
`
const CSharesHead = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	font-size: 13px;
	color: #0f172a;
	font-weight: 500;
`
const CCount = styled.span`
	font-size: 12px;
	color: #94a3b8;
`
const CRow = styled.div`
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: 14px;
	align-items: baseline;
	padding: 8px 0;
	border-bottom: 1px solid rgba(15, 23, 42, 0.04);
	&:last-child { border-bottom: none; }
`
const CRowMain = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	min-width: 0;
`
const CResourceType = styled.span`
	font-size: 10.5px;
	color: #94a3b8;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	flex: 0 0 auto;
`
const CResourceName = styled.span`
	font-size: 13px;
	color: #0f172a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const CPerms = styled.span`
	font-size: 11.5px;
	color: #64748b;
`
const CRevokeBtn = styled.button`
	border: none;
	background: transparent;
	font: inherit;
	font-size: 11.5px;
	color: #94a3b8;
	cursor: pointer;
	padding: 2px 4px;
	transition: color 160ms ease;
	&:hover { color: #dc2626; }
`
const EmptyNote = styled.div`
	padding: 20px 14px;
	font-size: 13px;
	color: #94a3b8;
	text-align: center;
	line-height: 1.6;
`
/* Scrollable shares area — caps the detail modal height so a worker
 * with 50 shares doesn't push the modal past the viewport. Internal
 * scroll inside the modal; header + metadata + actions stay fixed. */
const SharesScroll = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	max-height: 320px;
	overflow-y: auto;
	/* 2px right-margin so the scrollbar doesn't butt against the
	 * card edge; keeps the rounded corner clean. */
	margin-right: -4px;
	padding-right: 4px;
	scrollbar-gutter: stable;
`

const ShareRow = styled.div`
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 10px;
	align-items: center;
	padding: 10px 12px;
	background: transparent;
	border-radius: 10px;
	transition: background 160ms ease;
	&:hover {
		background: #f8fafc;
	}
`
const ShareIcon = styled.span`
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: #f8fafc;
	border: 1px solid rgba(15, 23, 42, 0.06);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #334155;
`
const ShareBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`
const ShareName = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #0f172a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const SharePerms = styled.div`
	font-size: 11.5px;
	color: #64748b;
`
