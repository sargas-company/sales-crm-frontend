import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	ArticleOutlined,
	AddRounded,
	CalendarMonthOutlined,
	DeleteOutline,
	EditOutlined,
	ListAltOutlined,
	OpenInNewOutlined,
	VisibilityOutlined,
	AccountCircleOutlined,
	DashboardCustomizeOutlined,
	ExpandMoreRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import { AnimatedSegmented } from '../../components/_shared/AnimatedSegmented'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../components/_shared/DataTable'
import type {
	DataTableColumn,
	DataTableSelection,
	SortState,
} from '../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import BulkActionBar from '../../components/_shared/BulkActionBar'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import PostsCalendar from './PostsCalendar'
import {
	useGetLinkedInPostsQuery,
	useDeleteLinkedInPostMutation,
	useBulkDeleteLinkedInPostsMutation,
	type LinkedInPost,
	type LinkedInPostStatus,
} from '../../store/linkedin-posts/linkedInPostsApi'
import { useGetLinkedInAccountsQuery } from '../../store/linkedin-accounts/linkedInAccountsApi'
import type { LinkedInPostFormat } from '../../store/linkedin-ideas/linkedInIdeasApi'

const PAGE_SIZE = 25

const STATUS_META: Record<
	LinkedInPostStatus,
	{ label: string; bg: string; color: string }
> = {
	DRAFT: { label: 'Draft', bg: 'rgba(15, 23, 42, 0.08)', color: '#64748b' },
	READY: { label: 'Ready', bg: 'rgba(3, 105, 161, 0.14)', color: '#0369a1' },
	SCHEDULED: {
		label: 'Scheduled',
		bg: 'rgba(217, 119, 6, 0.15)',
		color: '#b45309',
	},
	PUBLISHED: {
		label: 'Published',
		bg: 'rgba(16, 185, 129, 0.15)',
		color: '#059669',
	},
	ARCHIVED: {
		label: 'Archived',
		bg: 'rgba(217, 34, 113, 0.10)',
		color: '#9d174d',
	},
}

const FORMAT_META: Record<LinkedInPostFormat, string> = {
	TEXT: 'Text',
	IMAGE: 'Image',
	VIDEO: 'Video',
	DOCUMENT: 'Doc',
	LINK: 'Link',
	POLL: 'Poll',
}

const fmtDate = (iso: string | null): string => {
	if (!iso) return '—'
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return '—'
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

const LinkedInPostsList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [view, setView] = useState<'list' | 'calendar'>('list')
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [status, setStatus] = useState<LinkedInPostStatus | ''>('')
	const [format, setFormat] = useState<LinkedInPostFormat | ''>('')
	const [accountId, setAccountId] = useState<string>('')
	const [sort, setSort] = useState<SortState | null>({
		key: 'updatedAt',
		direction: 'desc',
	})
	const [toDelete, setToDelete] = useState<LinkedInPost | null>(null)
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkOpen, setBulkOpen] = useState(false)

	const { data: accountsData } = useGetLinkedInAccountsQuery({
		page: 1,
		limit: 100,
		status: 'all',
	})

	const { data, isLoading, isError, refetch } = useGetLinkedInPostsQuery(
		view === 'list'
			? {
					page,
					limit: PAGE_SIZE,
					search: search || undefined,
					status: status || undefined,
					format: format || undefined,
					accountId: accountId || undefined,
					sortBy: (sort?.key as
						| 'internalTitle'
						| 'status'
						| 'format'
						| 'scheduledAt'
						| 'publishedAt'
						| 'impressions'
						| 'createdAt'
						| 'updatedAt') ?? 'updatedAt',
					sortDir: sort?.direction ?? 'desc',
				}
			: { page: 1, limit: 0 },
		{ skip: view !== 'list' },
	)
	const [deletePost, { isLoading: deleting }] = useDeleteLinkedInPostMutation()
	const [bulkDeletePosts, { isLoading: bulkDeleting }] =
		useBulkDeleteLinkedInPostsMutation()

	const items = data?.data ?? []

	// Prune stale selections after each refetch.
	useEffect(() => {
		if (selected.size === 0) return
		const live = new Set(items.map((r) => r.id))
		let changed = false
		const next = new Set<string>()
		for (const id of selected) {
			if (live.has(id)) next.add(id)
			else changed = true
		}
		if (changed) setSelected(next)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items])

	const selection = useMemo<DataTableSelection<LinkedInPost>>(
		() => ({
			selected,
			onToggleRow: (id, next) =>
				setSelected((prev) => {
					const n = new Set(prev)
					if (next) n.add(id)
					else n.delete(id)
					return n
				}),
			onToggleAllOnPage: (rows, next) =>
				setSelected((prev) => {
					const n = new Set(prev)
					for (const r of rows) {
						if (next) n.add(r.id)
						else n.delete(r.id)
					}
					return n
				}),
			headerLabel: 'Select every LinkedIn post on this page',
			rowLabel: (r) => `Select LinkedIn post ${r.internalTitle ?? r.id}`,
		}),
		[selected],
	)

	const handleBulkDelete = async () => {
		const ids = [...selected]
		if (ids.length === 0) return
		try {
			const res = await bulkDeletePosts(ids).unwrap()
			showToast(
				`Deleted ${res.deleted} LinkedIn post${res.deleted === 1 ? '' : 's'}`,
				'success',
			)
			setSelected(new Set())
			setBulkOpen(false)
			refetch()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const columns: DataTableColumn<LinkedInPost>[] = [
		{
			key: 'internalTitle',
			label: 'Post',
			sortable: true,
			render: (r) => (
				<TitleCell onClick={() => navigate(`/linkedin/posts/${r.id}`)}>
					<TitleText>{r.internalTitle}</TitleText>
				</TitleCell>
			),
			skeleton: () => <TableSkeleton $w='260px' $h='16px' />,
		},
		{
			key: 'author',
			label: 'Author',
			render: (r) => (
				<AuthorText>
					{r.author ? `${r.author.firstName} ${r.author.lastName}` : '—'}
				</AuthorText>
			),
			skeleton: () => <TableSkeleton $w='120px' $h='14px' />,
		},
		{
			key: 'status',
			label: 'Status',
			sortable: true,
			render: (r) => (
				<StatusPill $bg={STATUS_META[r.status].bg} $color={STATUS_META[r.status].color}>
					{STATUS_META[r.status].label}
				</StatusPill>
			),
			skeleton: () => (
				<TableSkeleton $w='80px' $h='22px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'format',
			label: 'Format',
			sortable: true,
			render: (r) => <FormatChip>{FORMAT_META[r.format]}</FormatChip>,
			skeleton: () => (
				<TableSkeleton $w='60px' $h='20px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'publishedAt',
			label: 'Published / Scheduled',
			sortable: true,
			render: (r) => (
				<DateCell>
					<SubText>{fmtDate(r.publishedAt ?? r.scheduledAt)}</SubText>
					{r.linkedInUrl && (
						<ExternalLink
							href={r.linkedInUrl}
							target='_blank'
							rel='noreferrer noopener'
							onClick={(e) => e.stopPropagation()}
						>
							Open <OpenInNewOutlined style={{ fontSize: 11 }} />
						</ExternalLink>
					)}
				</DateCell>
			),
			skeleton: () => <TableSkeleton $w='100px' $h='14px' />,
		},
		{
			key: 'impressions',
			label: 'Impressions',
			sortable: true,
			render: (r) => (
				<MonoText>{r.impressions.toLocaleString('en-US')}</MonoText>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='14px' />,
		},
		{
			key: 'engagementRate',
			label: 'Engagement',
			render: (r) => (
				<MonoText>
					{r.impressions > 0 ? `${r.engagementRate.toFixed(2)}%` : '—'}
				</MonoText>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='14px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/linkedin/posts/${r.id}`)}
						aria-label='View post'
					>
						<VisibilityOutlined />
					</IconAction>
					<PermissionGate permission='linkedin_posts:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/linkedin/posts/edit/${r.id}`)}
							aria-label='Edit post'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='linkedin_posts:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setToDelete(r)}
							aria-label='Delete post'
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
					{ label: 'Posts', current: true },
				]}
				icon={<ArticleOutlined />}
				title='LinkedIn posts'
				subtitle='Draft, schedule and track posts across the accounts you publish from.'
				action={
					<PermissionGate permission='linkedin_posts:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate('/linkedin/posts/add')}
						>
							<AddRounded />
							New post
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by title, body, hashtag or account'
				search={search}
				onSearchChange={(v) => {
					setSearch(v)
					setPage(1)
				}}
			>
				<FiltersRow>
					<AnimatedSegmented
						items={[
							{ value: '', label: 'All' },
							...(Object.keys(STATUS_META) as LinkedInPostStatus[]).map((s) => ({
								value: s,
								label: STATUS_META[s].label,
								color: STATUS_META[s].color,
							})),
						]}
						active={status}
						onSelect={(v) => {
							setStatus(v as LinkedInPostStatus | '')
							setPage(1)
						}}
					/>

					<RightCluster>
						<PermissionGate permission='linkedin_posts:delete'>
							<InlineBulkSlot $open={selected.size > 0}>
								<InlineBulkInner>
									<BulkActionBar
										count={selected.size}
										onClear={() => setSelected(new Set())}
										onConfirm={() => setBulkOpen(true)}
										isLoading={bulkDeleting}
									/>
								</InlineBulkInner>
							</InlineBulkSlot>
						</PermissionGate>
						<FilterSelects>
						<VarA_Pill>
							<VarA_Icon>
								<AccountCircleOutlined style={{ fontSize: 16 }} />
							</VarA_Icon>
							<VarA_Text>
								{accountId
									? accountsData?.data.find((a) => a.id === accountId)?.displayName ?? 'Account'
									: 'All accounts'}
							</VarA_Text>
							<VarA_Chev>
								<ExpandMoreRounded style={{ fontSize: 16 }} />
							</VarA_Chev>
							<VarA_HiddenSelect
								value={accountId}
								onChange={(e) => { setAccountId(e.target.value); setPage(1) }}
							>
								<option value=''>All accounts</option>
								{(accountsData?.data ?? []).map((a) => (
									<option key={a.id} value={a.id}>{a.displayName}</option>
								))}
							</VarA_HiddenSelect>
						</VarA_Pill>
						<VarA_Pill>
							<VarA_Icon $accent='#d97706'>
								<DashboardCustomizeOutlined style={{ fontSize: 16 }} />
							</VarA_Icon>
							<VarA_Text>
								{format ? FORMAT_META[format as LinkedInPostFormat] : 'All formats'}
							</VarA_Text>
							<VarA_Chev>
								<ExpandMoreRounded style={{ fontSize: 16 }} />
							</VarA_Chev>
							<VarA_HiddenSelect
								value={format}
								onChange={(e) => { setFormat(e.target.value as LinkedInPostFormat | ''); setPage(1) }}
							>
								<option value=''>All formats</option>
								{(Object.keys(FORMAT_META) as LinkedInPostFormat[]).map((f) => (
									<option key={f} value={f}>{FORMAT_META[f]}</option>
								))}
							</VarA_HiddenSelect>
						</VarA_Pill>
						</FilterSelects>
					</RightCluster>
				</FiltersRow>

				<ViewToggleRow>
					<AnimatedSegmented
						items={[
							{
								value: 'list',
								label: 'List',
								icon: <ListAltOutlined style={{ fontSize: 15 }} />,
							},
							{
								value: 'calendar',
								label: 'Calendar',
								icon: <CalendarMonthOutlined style={{ fontSize: 15 }} />,
							},
						]}
						active={view}
						onSelect={(v) => setView((v || 'list') as 'list' | 'calendar')}
					/>
				</ViewToggleRow>

				{view === 'list' ? (
					<>
						<DataTable
							columns={columns}
							rows={items}
							rowKey={(r) => r.id}
							isLoading={isLoading}
							isError={isError}
							onRetry={refetch}
							searchActive={!!search || !!status || !!format || !!accountId}
							sort={sort}
							onSortChange={setSort}
							selection={selection}
							pagination={{
								page,
								pageSize: PAGE_SIZE,
								total: data?.total ?? 0,
								onPageChange: setPage,
							}}
						/>
					</>
				) : (
					<PostsCalendar
						accountId={accountId || undefined}
						status={status || undefined}
						format={format || undefined}
					/>
				)}
			</ListPageShell>

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete LinkedIn post?'
					description={
						<>
							Delete <strong>&quot;{toDelete.internalTitle}&quot;</strong>? This
							cannot be undone.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onConfirm={async () => {
						try {
							await deletePost(toDelete.id).unwrap()
							showToast('Post deleted', 'success')
							setToDelete(null)
						} catch (err) {
							showToast(parseServerError(err), 'error')
						}
					}}
					onClose={() => setToDelete(null)}
					isLoading={deleting}
				/>
			)}
			{bulkOpen && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title={`Delete ${selected.size} LinkedIn post${selected.size === 1 ? '' : 's'}?`}
					description={
						<>
							You are about to delete <strong>{selected.size}</strong> LinkedIn
							post{selected.size === 1 ? '' : 's'}. This cannot be undone.
						</>
					}
					confirmLabel={`Delete ${selected.size}`}
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onClose={() => setBulkOpen(false)}
					onConfirm={handleBulkDelete}
					isLoading={bulkDeleting}
				/>
			)}
		</>
	)
}

export default LinkedInPostsList

/* The right-end cluster that groups the bulk slot and the right
 * filter pills. The cluster itself has fixed layout; the bulk slot
 * is absolutely positioned to its LEFT so it never shifts the
 * surrounding filter pills — on toggle, only opacity animates. */
const RightCluster = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 12px;
	margin-left: auto;
`
const InlineBulkSlot = styled.div<{ $open: boolean }>`
	position: absolute;
	right: 100%;
	top: 50%;
	transform: translateY(-50%)
		translateX(${({ $open }) => ($open ? '0' : '8px')});
	margin-right: 12px;
	opacity: ${({ $open }) => ($open ? 1 : 0)};
	pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
	transition:
		opacity 200ms ease,
		transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`
const InlineBulkInner = styled.div`
	display: flex;
	align-items: center;
	white-space: nowrap;
`

const TitleCell = styled.div`
	cursor: pointer;
	max-width: 380px;
`

const TitleText = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const AuthorText = styled.span`
	font-size: 13px;
	color: ${T.textStrong};
	white-space: nowrap;
`

const DateCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
`

const StatusPill = styled.span<{ $bg: string; $color: string }>`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${({ $bg }) => $bg};
	color: ${({ $color }) => $color};
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	white-space: nowrap;
`

const FormatChip = styled.span`
	display: inline-block;
	padding: 2px 10px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.06);
	color: ${T.textSecondary};
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
`

const SubText = styled.span`
	font-size: 12.5px;
	color: ${T.textStrong};
`

const ExternalLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 3px;
	font-size: 11.5px;
	font-weight: 600;
	color: ${T.primary};
	text-decoration: none;
	&:hover {
		text-decoration: underline;
	}
`

const MonoText = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 12.5px;
	font-weight: 600;
	color: ${T.textStrong};
`

const ViewToggleRow = styled.div`
	display: flex;
	justify-content: flex-start;
	margin-bottom: 4px;
`

const FiltersRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin-bottom: 18px;
`

const FilterSelects = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`

/* ─── Icon-prefix rich pill select ─────────────────────────── */

const VarA_Pill = styled.label`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 5px 14px 5px 6px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.08);
	background: #ffffff;
	color: ${T.textStrong};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
	&:hover {
		transform: translateY(-1px);
	}
`

const VarA_Icon = styled.span<{ $accent?: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: ${({ $accent }) =>
		$accent ? `${$accent}18` : 'rgba(3, 105, 161, 0.1)'};
	color: ${({ $accent }) => $accent ?? T.primary};
`

const VarA_Text = styled.span`
	max-width: 180px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const VarA_Chev = styled.span`
	display: inline-flex;
	align-items: center;
	color: ${T.textMuted};
`

const VarA_HiddenSelect = styled.select`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	opacity: 0;
	cursor: pointer;
	border: none;
	outline: none;
	appearance: none;
	-webkit-appearance: none;
	background: transparent;
`

