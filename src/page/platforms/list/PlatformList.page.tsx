import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	SearchOutlined,
	HubOutlined,
	AddRounded,
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
import PlatformDeleteModal from '../../../components/platforms/list/PlatformDeleteModal'
import type { PlatformItem } from '../../../store/platforms/platformsApi'
import { useGetPlatformsQuery } from '../../../store/platforms/platformsApi'
import { formatDate } from '../../../utils/format'

const PAGE_SIZE = 20

interface DeleteTarget {
	id: string
	title: string
}

const PlatformList = () => {
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, isError, refetch } = useGetPlatformsQuery()

	const platforms = data ?? []
	const filtered = useMemo(() => {
		if (!search) return platforms
		const q = search.toLowerCase()
		return platforms.filter(
			(p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
		)
	}, [platforms, search])

	const total = filtered.length
	const offset = (page - 1) * PAGE_SIZE
	const pageItems = filtered.slice(offset, offset + PAGE_SIZE)

	const columns: DataTableColumn<PlatformItem>[] = useMemo(
		() => [
			{
				key: 'platform',
				label: 'Platform',
				minWidth: 260,
				sortable: true,
				sortValue: (p) => p.title,
				render: (p) => (
					<PlatformCell>
						<Avatar $hasImage={!!p.imageUrl}>
							{p.imageUrl ? (
								<img src={p.imageUrl} alt={p.title} />
							) : (
								<span>{initials(p.title)}</span>
							)}
						</Avatar>
						<PlatformLabel>{p.title}</PlatformLabel>
					</PlatformCell>
				),
				skeleton: (i) => (
					<PlatformCell>
						<TableSkeleton $w='36px' $h='36px' style={{ borderRadius: 10, flexShrink: 0 }} />
						<TableSkeleton $w={`${110 + ((i * 37) % 90)}px`} $h='14px' />
					</PlatformCell>
				),
			},
			{
				key: 'slug',
				label: 'Slug',
				minWidth: 160,
				sortable: true,
				sortValue: (p) => p.slug,
				render: (p) => <Slug>{p.slug}</Slug>,
				skeleton: (i) => (
					<TableSkeleton
						$w={`${80 + ((i * 13) % 50)}px`}
						$h='20px'
						style={{ borderRadius: 6 }}
					/>
				),
			},
			{
				key: 'created',
				label: 'Created',
				minWidth: 130,
				sortable: true,
				sortValue: (p) => new Date(p.createdAt),
				render: (p) => <CreatedAt>{formatDate(p.createdAt, 'short')}</CreatedAt>,
				skeleton: () => <TableSkeleton $w='84px' $h='13px' />,
			},
			{
				key: 'updated',
				label: 'Updated',
				minWidth: 130,
				sortable: true,
				sortValue: (p) => new Date(p.updatedAt),
				render: (p) => <CreatedAt>{formatDate(p.updatedAt, 'short')}</CreatedAt>,
				skeleton: () => <TableSkeleton $w='84px' $h='13px' />,
			},
			{
				key: 'actions',
				label: 'Actions',
				render: (p) => (
					<Actions>
						<IconAction
							type='button'
							onClick={() => navigate(`/platforms/${p.id}`)}
							aria-label='View platform'
						>
							<VisibilityOutlined />
						</IconAction>
						<IconAction
							type='button'
							onClick={() => navigate(`/platforms/edit/${p.id}`)}
							aria-label='Edit platform'
						>
							<EditOutlined />
						</IconAction>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: p.id, title: p.title })}
							aria-label='Delete platform'
						>
							<DeleteOutline />
						</IconAction>
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
							<span className='crumb-parent'>Sources</span>
							<span className='crumb-sep' aria-hidden='true'>
								/
							</span>
							<span className='current'>Platforms</span>
						</Crumbs>

						<PageHead>
							<div className='title'>
								<HeadIcon>
									<HubOutlined />
								</HeadIcon>
								<div className='title-text'>
									<h1>Platforms</h1>
									<p>Sources for job posts and proposals.</p>
								</div>
							</div>
							<PrimarySolidButton type='button' onClick={() => navigate('/platforms/add/')}>
								<AddRounded />
								New platform
							</PrimarySolidButton>
						</PageHead>

						<FiltersBar>
							<SearchField>
								<SearchOutlined />
								<input
									type='text'
									name='search-platform'
									placeholder='Search by title or slug'
									value={search}
									onChange={(e) => {
										setSearch(e.target.value)
										setPage(1)
									}}
									aria-label='Search platforms'
								/>
							</SearchField>
						</FiltersBar>

						<DataTable
							columns={columns}
							rows={pageItems}
							rowKey={(p) => p.id}
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
				<PlatformDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => refetch()}
				/>
			)}
		</>
	)
}

export default PlatformList

function initials(title: string): string {
	const parts = title.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return '?'
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
	return (parts[0][0] + parts[1][0]).toUpperCase()
}

/* ── Page-level styles (crumbs + header + filters) ──────────────────── */

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

/* ── Row-cell primitives (platform-specific) ────────────────────────── */

const PlatformCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
`

const Avatar = styled.span<{ $hasImage: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: ${({ $hasImage }) => ($hasImage ? '#fff' : T.subtleBg)};
	border: 1px solid ${T.border};
	color: ${T.textSecondary};
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.4px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	overflow: hidden;
	flex-shrink: 0;

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 4px;
	}
`

const PlatformLabel = styled.span`
	font-size: 15px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
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

const CreatedAt = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`
