import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	SearchOutlined,
	WorkOutlineOutlined,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../../components/_shared/DataTable'
import JobPostDeleteModal from '../../../components/job-posts/list/JobPostDeleteModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import type {
	JobPostItem,
	JobPostSortBy,
} from '../../../store/job-posts/types/definition'
import { useGetJobPostListQuery } from '../../../store/job-posts/jobPostsApi'
import { formatDate } from '../../../utils/formatDate'
import { getJobPostViewedAt, markJobPostViewed } from '../../../hooks/useViewedJobPosts'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

interface DeleteTarget {
	id: string
	title: string
}

const JobPostList = () => {
	const navigate = useNavigate()
	const [searchInput, setSearchInput] = useState('')
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	// Debounce search input → server request; also snap back to page 1 whenever
	// the effective query (search or sort) changes.
	useEffect(() => {
		const h = setTimeout(() => {
			setSearch(searchInput.trim())
			setPage(1)
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(h)
	}, [searchInput])

	const offset = (page - 1) * PAGE_SIZE

	const { data, isLoading, isError, refetch } = useGetJobPostListQuery({
		limit: PAGE_SIZE,
		offset,
		search: search || undefined,
		sortBy: (sort?.key as JobPostSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})

	const openJobPost = (id: string) => {
		markJobPostViewed(id)
		navigate(`/job-posts/preview/${id}`)
	}
	const items = data?.data ?? []
	const total = data?.meta.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	const columns: DataTableColumn<JobPostItem>[] = [
		{
			key: 'title',
			label: 'Title',
			minWidth: 480,
			sortable: true,
			sortValue: (r) => r.title ?? '',
			render: (r) => {
				const viewedAt = getJobPostViewedAt(r.id)
				return (
					<TitleRow>
						{viewedAt ? (
							<Tooltip title={`Viewed on ${formatDate(viewedAt)}`} placement='top'>
								<ViewedDot aria-label='Viewed'>
									<VisibilityOutlined style={{ fontSize: 12 }} />
								</ViewedDot>
							</Tooltip>
						) : (
							<ViewedSpacer aria-hidden />
						)}
						<TitleLink onClick={() => openJobPost(r.id)}>{r.title ?? '—'}</TitleLink>
					</TitleRow>
				)
			},
			skeleton: (i) => <TableSkeleton $w={`${260 + ((i * 41) % 160)}px`} $h='14px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => r.status,
			render: (r) => <StatusPill $status={r.status}>{r.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='70px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'matchScore',
			label: 'Score',
			minWidth: 90,
			sortable: true,
			sortValue: (r) => r.matchScore,
			render: (r) =>
				r.matchScore != null ? (
					<ScorePill $v={r.matchScore}>{r.matchScore}</ScorePill>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='48px' $h='24px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'budget',
			label: 'Budget',
			minWidth: 160,
			sortable: true,
			sortValue: (r) => r.budget ?? '',
			render: (r) => (r.budget ? <BudgetPill>{r.budget}</BudgetPill> : <Muted>—</Muted>),
			skeleton: () => <TableSkeleton $w='110px' $h='24px' style={{ borderRadius: 8 }} />,
		},
		{
			key: 'location',
			label: 'Location',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => r.location ?? '',
			render: (r) => <Muted>{r.location ?? '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'totalSpent',
			label: 'Total spent',
			minWidth: 130,
			sortable: true,
			sortValue: (r) => r.totalSpent,
			render: (r) => (
				<Num>{r.totalSpent != null ? `$${r.totalSpent.toLocaleString()}` : '—'}</Num>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='13px' />,
		},
		{
			key: 'avgRate',
			label: 'Avg rate',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => r.avgRatePaid,
			render: (r) => <Num>{r.avgRatePaid != null ? `$${r.avgRatePaid}/hr` : '—'}</Num>,
			skeleton: () => <TableSkeleton $w='60px' $h='13px' />,
		},
		{
			key: 'hireRate',
			label: 'Hire rate',
			minWidth: 100,
			sortable: true,
			sortValue: (r) => r.hireRate,
			render: (r) => <Num>{r.hireRate != null ? `${r.hireRate}%` : '—'}</Num>,
			skeleton: () => <TableSkeleton $w='44px' $h='13px' />,
		},
		{
			key: 'skills',
			label: 'Skills',
			minWidth: 220,
			render: (r) => (
				<SkillsRow>
					{r.hSkillsKeywords.slice(0, 3).map((s) => (
						<Skill key={s}>{s}</Skill>
					))}
					{r.hSkillsKeywords.length > 3 && (
						<Skill $more>+{r.hSkillsKeywords.length - 3}</Skill>
					)}
				</SkillsRow>
			),
			skeleton: () => <TableSkeleton $w='160px' $h='18px' style={{ borderRadius: 6 }} />,
		},
		{
			key: 'scanner',
			label: 'Scanner',
			minWidth: 130,
			sortable: true,
			sortValue: (r) => r.scanner ?? '',
			render: (r) => <Muted>{r.scanner ?? '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='80px' $h='13px' />,
		},
		{
			key: 'processed',
			label: 'Processed',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => (r.processedAt ? new Date(r.processedAt) : null),
			render: (r) => <Muted>{r.processedAt ? formatDate(r.processedAt) : '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'created',
			label: 'Created',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => new Date(r.createdAt),
			render: (r) => <Muted>{formatDate(r.createdAt)}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => openJobPost(r.id)}
						aria-label='View job post'
					>
						<VisibilityOutlined />
					</IconAction>
					<PermissionGate permission='job_posts:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: r.id, title: r.title ?? 'this job post' })}
							aria-label='Delete job post'
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
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<span className='crumb-dot' aria-hidden='true' />
							<span className='crumb-parent'>Pipeline</span>
							<span className='crumb-sep' aria-hidden='true'>
								/
							</span>
							<span className='current'>Job posts</span>
						</Crumbs>

						<PageHead>
							<div className='title'>
								<HeadIcon>
									<WorkOutlineOutlined />
								</HeadIcon>
								<div className='title-text'>
									<h1>Job posts</h1>
									<p>Incoming job feeds with AI-assisted decisions and priorities.</p>
								</div>
							</div>
							<div className='title-right' aria-hidden='true'>
								<span className='hand-line'>chase the good ones</span>
								<span className='hand-flourish'>
									<svg viewBox='0 0 120 20' width='120' height='20'>
										<path
											d='M2 12 C 28 2, 60 22, 96 6'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
										/>
										<path
											d='M88 4 L 98 6 L 92 14'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</span>
							</div>
						</PageHead>

						<FiltersBar>
							<SearchField>
								<SearchOutlined />
								<input
									type='text'
									name='search-job-post'
									placeholder='Search by title'
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									aria-label='Search job posts'
								/>
							</SearchField>
						</FiltersBar>

						<DataTable
							columns={columns}
							rows={items}
							rowKey={(r) => r.id}
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
					</ShellInner>
				</ShellCard>
			</ViewFade>

			{deleteTarget && (
				<JobPostDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => {
						if (items.length === 1 && page > 1) setPage(page - 1)
						else refetch()
					}}
				/>
			)}
		</>
	)
}

export default JobPostList

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const handDraw = keyframes`
	from { opacity: 0; transform: translate(-6px, 4px) rotate(-6deg); }
	to   { opacity: 1; transform: translate(0, 0)     rotate(-6deg); }
`

const flourishDraw = keyframes`
	from { stroke-dashoffset: 240; opacity: 0; }
	to   { stroke-dashoffset: 0;   opacity: 1; }
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

	.title-right {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding-right: 6px;
		flex-shrink: 0;
	}
	.hand-line {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 42px;
		font-weight: 700;
		line-height: 1;
		color: #0369a1;
		transform: rotate(-6deg);
		transform-origin: right center;
		text-shadow: 0 6px 22px rgba(2, 132, 199, 0.22);
		animation: ${handDraw} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
		white-space: nowrap;
	}
	.hand-flourish {
		display: inline-flex;
		color: #0284c7;
		opacity: 0.75;
		margin-right: -4px;
		transform: rotate(-4deg);
	}
	.hand-flourish svg path {
		stroke-dasharray: 240;
		stroke-dashoffset: 240;
		animation: ${flourishDraw} 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.hand-line {
			animation: none;
			transform: rotate(-6deg);
		}
		.hand-flourish svg path {
			animation: none;
			stroke-dashoffset: 0;
			opacity: 1;
		}
	}

	@media (max-width: 720px) {
		.title-text h1 {
			font-size: 28px;
			letter-spacing: -0.5px;
		}
		.title-right {
			display: none;
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

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	width: 100%;
`

const ViewedDot = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: rgba(3, 105, 161, 0.12);
	color: rgb(3, 105, 161);
	border: 1px solid rgba(3, 105, 161, 0.28);
	flex-shrink: 0;
	line-height: 0;
`

const ViewedSpacer = styled.span`
	display: inline-block;
	width: 20px;
	height: 20px;
	flex-shrink: 0;
`

const TitleLink = styled.button`
	background: none;
	border: none;
	padding: 0;
	font-family: inherit;
	font-size: 14.5px;
	font-weight: 500;
	color: ${T.textStrong};
	cursor: pointer;
	text-align: left;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	flex: 1;
	min-width: 0;

	&:hover {
		color: ${T.primary};
	}
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

const BudgetPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 5px 12px;
	border-radius: 8px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.1px;
	color: ${T.primary};
	background: ${T.primaryTint};
	border: 1px solid rgba(3, 105, 161, 0.28);
	white-space: nowrap;
`

const ScorePill = styled.span<{ $v: number }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 44px;
	padding: 4px 10px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 0.2px;
	font-variant-numeric: tabular-nums;
	background: ${({ $v }) =>
		$v >= 75
			? 'rgba(34, 197, 94, 0.14)'
			: $v >= 50
				? 'rgba(245, 158, 11, 0.16)'
				: 'rgba(239, 68, 68, 0.12)'};
	color: ${({ $v }) => ($v >= 75 ? '#15803d' : $v >= 50 ? '#a26608' : '#b91c1c')};
	border: 1px solid
		${({ $v }) =>
			$v >= 75
				? 'rgba(34, 197, 94, 0.28)'
				: $v >= 50
					? 'rgba(245, 158, 11, 0.32)'
					: 'rgba(239, 68, 68, 0.28)'};
`

const StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	background: ${({ $status }) => {
		const s = $status.toLowerCase()
		if (s === 'new') return 'rgba(3, 105, 161, 0.12)'
		if (s === 'processed') return 'rgba(34, 197, 94, 0.14)'
		if (s === 'processing') return 'rgba(245, 158, 11, 0.16)'
		if (s === 'failed') return 'rgba(239, 68, 68, 0.14)'
		return 'rgba(148, 163, 184, 0.18)'
	}};
	color: ${({ $status }) => {
		const s = $status.toLowerCase()
		if (s === 'new') return T.primary
		if (s === 'processed') return '#15803d'
		if (s === 'processing') return '#a26608'
		if (s === 'failed') return '#b91c1c'
		return '#475569'
	}};
`

const SkillsRow = styled.div`
	display: inline-flex;
	gap: 4px;
	flex-wrap: nowrap;
`

const Skill = styled.span<{ $more?: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 6px;
	background: ${({ $more }) => ($more ? T.primaryTint : T.subtleBg)};
	border: 1px solid ${({ $more }) => ($more ? '#d5e5f3' : T.border)};
	font-size: 11px;
	color: ${({ $more }) => ($more ? T.primary : T.textSecondary)};
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-weight: ${({ $more }) => ($more ? 700 : 500)};
`
