import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	ArrowDownwardRounded,
	ArrowOutwardRounded,
	ArrowUpwardRounded,
	CameraAltOutlined,
	EditOutlined,
	StarRounded,
	TrendingFlatRounded,
} from '@mui/icons-material'

import useTheme from '../../../theme/useTheme'
import {
	FormHeader,
	FormLoading,
	FormNotFound,
} from '../../../components/_shared/FormShell'
import {
	Section,
	Shell,
	Surface,
} from '../../../components/_shared/formShell.styled'
import {
	DataTable,
	TableSkeleton,
	type DataTableColumn,
} from '../../../components/_shared/DataTable'
import PermissionGate from '../../../components/auth/PermissionGate'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'

import {
	upworkProfileName,
	useGetUpworkSnapshotQuery,
	useListUpworkProfilesQuery,
	useListUpworkSnapshotsQuery,
	type UpworkSnapshot,
} from '../../../store/upwork/upworkApi'

/* ─── Tiles ──────────────────────────────────────────────────── */

const TilesRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 14px;
	margin-top: 10px;
`
const Tile = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 14px;
	padding: 16px 18px;
	background: #fff;
	display: flex;
	flex-direction: column;
	gap: 8px;
`
const TileLabel = styled.div`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: #64748b;
`
const TileValue = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 34px;
	font-weight: 600;
	letter-spacing: -0.8px;
	line-height: 1;
	color: #0f172a;
	font-variant-numeric: tabular-nums;
`
const TileDelta = styled.div<{ $t: 'gain' | 'loss' | 'flat' | 'none' }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: -0.3px;
	font-variant-numeric: tabular-nums;
	color: ${({ $t }) =>
		$t === 'gain'
			? '#166534'
			: $t === 'loss'
				? '#991b1b'
				: $t === 'flat'
					? '#475569'
					: '#94a3b8'};
	svg {
		font-size: 15px;
	}
`

interface DeltaTileProps {
	label: string
	value: number
	previous: number | null
	/** Rank-style tiles invert: smaller is better. */
	lowerIsBetter?: boolean
}
const DeltaTile = ({ label, value, previous, lowerIsBetter }: DeltaTileProps) => {
	const delta = previous == null ? null : value - previous
	let tone: 'gain' | 'loss' | 'flat' | 'none' = 'none'
	if (delta != null) {
		if (delta === 0) tone = 'flat'
		else {
			const better = lowerIsBetter ? delta < 0 : delta > 0
			tone = better ? 'gain' : 'loss'
		}
	}
	return (
		<Tile>
			<TileLabel>{label}</TileLabel>
			<TileValue>{value.toLocaleString()}</TileValue>
			<TileDelta $t={tone}>
				{delta == null ? (
					<>
						<TrendingFlatRounded />
						no previous snapshot
					</>
				) : delta === 0 ? (
					<>
						<TrendingFlatRounded />
						no change
					</>
				) : delta > 0 ? (
					<>
						<ArrowUpwardRounded />+{Math.abs(delta).toLocaleString()} vs prev
					</>
				) : (
					<>
						<ArrowDownwardRounded />−{Math.abs(delta).toLocaleString()} vs prev
					</>
				)}
			</TileDelta>
		</Tile>
	)
}

/* ─── Positions table ────────────────────────────────────────── */

interface PositionsRow {
	keywordId: string
	text: string
	isPrimary: boolean
	isActive: boolean
	rank: number
	/* `previous` isn't the immediately prior snapshot's value — it's
	 * the last snapshot (going back any distance) of this profile
	 * that actually recorded this phrase. Null means the phrase has
	 * no prior record at all, i.e. it's genuinely new. */
	previous: { rank: number; date: string } | null
}

const DeltaBadge = styled.span<{ $t: 'gain' | 'loss' | 'flat' | 'none' }>`
	display: inline-flex;
	align-items: center;
	gap: 2px;
	white-space: nowrap;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 13px;
	font-weight: 700;
	line-height: 1;
	letter-spacing: -0.3px;
	font-variant-numeric: tabular-nums;
	color: ${({ $t }) =>
		$t === 'gain'
			? '#166534'
			: $t === 'loss'
				? '#991b1b'
				: $t === 'flat'
					? '#475569'
					: '#94a3b8'};
	svg {
		font-size: 14px;
	}
`
/* Edit / Delete buttons: inherit the solid-filled look of
 * PrimarySolidButton (so the default state is the normal filled
 * button background) but every hover effect from the base — lift,
 * background shift, shadow pop — is clamped back to the resting
 * value. The only thing that moves on hover is the icon itself:
 * pencil tilts like writing (−12°), trash tips the other way
 * (+10°). Base filled colour comes through; delete variant uses
 * the project's error red. */
const AnimIconButton = styled(PrimarySolidButton)<{ $rot: number }>`
	svg {
		transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover:not(:disabled) {
		transform: none;
		box-shadow: 0 2px 6px rgba(3, 105, 161, 0.22);
		background: rgba(3, 105, 161, 1);
	}
	&:hover:not(:disabled) svg {
		transform: rotate(${({ $rot }) => $rot}deg);
	}
`

/* Slight gray pill next to the delta number — carries the "was N
 * on DATE" context. One-line, slightly darker-than-muted text so it
 * reads at a glance without stealing attention from the arrow. */
const DeltaContextPill = styled.span`
	display: inline-flex;
	align-items: center;
	margin-left: 10px;
	padding: 7px 16px;
	border-radius: 999px;
	background: #eef2f7;
	color: #334155;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 11.5px;
	font-weight: 500;
	letter-spacing: 0;
	white-space: nowrap;
`

const PhraseCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	.star {
		color: #eab308;
	}
	.text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.archived {
		margin-left: 6px;
		font-size: 11px;
		color: #92400e;
	}
`

/* Whole-phrase deep link into /dashboards/upwork pre-filtered for
 * this profile + phrase, scrolled to the Position chart. Color and
 * text stay put on hover — only the arrow glyph nudges up-right to
 * signal interactivity. */
const PhraseJumpLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	color: inherit;
	text-decoration: none;
	line-height: 1.3;
	.phrase-text {
		white-space: nowrap;
	}
	.jump-arrow {
		font-size: 14px;
		color: #0f172a;
		flex-shrink: 0;
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover .jump-arrow {
		transform: translate(2px, -2px);
	}
`

/* ─── Page ───────────────────────────────────────────────────── */

const UpworkSnapshotViewPage = () => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'


	const {
		data: snapshot,
		isLoading,
		isError,
	} = useGetUpworkSnapshotQuery(id!, { skip: !id })

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const profile = useMemo(
		() => profiles.find((p) => p.id === snapshot?.profileId) ?? null,
		[profiles, snapshot?.profileId],
	)

	/* All snapshots of the same profile — resolves previous snapshot
	 * for the tile deltas and the per-keyword previous rank for the
	 * positions table. */
	const { data: profileSnapshots = [] } = useListUpworkSnapshotsQuery(
		{ profileId: snapshot?.profileId },
		{ skip: !snapshot?.profileId },
	)

	const previousSnapshot: UpworkSnapshot | null = useMemo(() => {
		if (!snapshot) return null
		const older = profileSnapshots
			.filter((s) => s.id !== snapshot.id && s.date < snapshot.date)
			.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
		return older[0] ?? null
	}, [snapshot, profileSnapshots])

	const positionsRows: PositionsRow[] = useMemo(() => {
		if (!snapshot) return []
		/* For every phrase in this snapshot, walk backwards through
		 * older snapshots of the same profile (newest-first) and stop
		 * at the first one that actually recorded this phrase. That
		 * one is "previous" for the delta — not the immediately prior
		 * snapshot, which may not have had the phrase at all. */
		const olderDesc = profileSnapshots
			.filter((s) => s.id !== snapshot.id && s.date < snapshot.date)
			.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
		return snapshot.positions.map((p) => {
			let previous: { rank: number; date: string } | null = null
			for (const older of olderDesc) {
				const match = older.positions.find((q) => q.keyword.id === p.keyword.id)
				if (match) {
					previous = {
						rank: match.position,
						date: older.date.slice(0, 10),
					}
					break
				}
			}
			return {
				keywordId: p.keyword.id,
				text: p.keyword.text,
				isPrimary: p.keyword.isPrimary,
				isActive: p.keyword.isActive,
				rank: p.position,
				previous,
			}
		})
	}, [snapshot, profileSnapshots])


	const columns: DataTableColumn<PositionsRow>[] = [
		{
			key: 'phrase',
			label: 'Phrase',
			render: (r) => (
				<PhraseCell>
					{r.isPrimary && <StarRounded className='star' fontSize='small' />}
					{snapshot ? (
						<PhraseJumpLink
							to={`/dashboards/upwork?profile=${snapshot.profileId}&phrase=${encodeURIComponent(r.text)}#positions-chart`}
							title='Open this phrase in Upwork analytics'
						>
							<span className='phrase-text'>{r.text}</span>
							<ArrowOutwardRounded className='jump-arrow' fontSize='small' />
						</PhraseJumpLink>
					) : (
						<span className='text'>{r.text}</span>
					)}
					{!r.isActive && <span className='archived'>archived</span>}
				</PhraseCell>
			),
			skeleton: () => <TableSkeleton $w='160px' $h='13px' />,
		},
		{
			key: 'rank',
			label: 'Rank',
			render: (r) => (
				<span
					style={{
						fontFamily: 'Bricolage Grotesque, Inter, system-ui, sans-serif',
						fontSize: 16,
						fontWeight: 500,
						letterSpacing: '-0.2px',
						color: '#0f172a',
						fontVariantNumeric: 'tabular-nums',
					}}
				>
					{r.rank}
				</span>
			),
			skeleton: () => <TableSkeleton $w='48px' $h='18px' />,
		},
		{
			key: 'delta',
			label: 'Δ vs last record',
			render: (r) => {
				if (r.previous == null) {
					return <span style={{ color: '#94a3b8', fontSize: 13 }}>new</span>
				}
				const diff = r.rank - r.previous.rank // + = worse (bigger rank number)
				let tone: 'gain' | 'loss' | 'flat' = 'flat'
				if (diff < 0) tone = 'gain'
				else if (diff > 0) tone = 'loss'
				const context = (
					<DeltaContextPill>
						was {r.previous.rank} on {r.previous.date}
					</DeltaContextPill>
				)
				return (
					<DeltaBadge $t={tone}>
						{diff === 0 ? (
							<>
								<TrendingFlatRounded />
								0
							</>
						) : diff < 0 ? (
							<>
								<ArrowUpwardRounded />
								{Math.abs(diff)}
							</>
						) : (
							<>
								<ArrowDownwardRounded />
								{diff}
							</>
						)}
						{context}
					</DeltaBadge>
				)
			},
			skeleton: () => <TableSkeleton $w='160px' $h='13px' />,
		},
	]

	if (isLoading) return <FormLoading label='Loading snapshot…' />
	if (isError || !snapshot) return <FormNotFound label='Snapshot not found' />

	return (
		<Shell $dark={isDark}>
			{/* Large cap so the detail page spreads out to the main
			 * content container, matching the full-width feel of the
			 * snapshots list — the form chrome's 880 px default is too
			 * narrow for a page that's mostly a wide data table. */}
			<Surface $dark={isDark} $maxWidth={1600}>
				<FormHeader
					backTo='/upwork/snapshots'
					backLabel='Back to snapshots'
					icon={<CameraAltOutlined />}
					title={snapshot.date.slice(0, 10)}
					subtitle={
						profile
							? `Snapshot for ${upworkProfileName(profile)}.`
							: 'Snapshot detail.'
					}
					badgeLabel='Snapshot'
					badgeTone='edit'
				/>

				<Section $delay={80}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 6,
						}}
					>
						<div style={{ fontSize: 13, color: '#64748b' }}>
							{previousSnapshot ? (
								<>
									Deltas compared to{' '}
									<Link
										to={`/upwork/snapshots/${previousSnapshot.id}`}
										style={{ color: '#0369a1', fontWeight: 600 }}
									>
										{previousSnapshot.date.slice(0, 10)}
									</Link>
									.
								</>
							) : (
								'First snapshot for this profile — no prior values to compare.'
							)}
						</div>
						<div style={{ display: 'flex', gap: 8 }}>
							<PermissionGate permission='upwork:update'>
								<AnimIconButton
									$rot={-12}
									title='Edit'
									onClick={() => nav(`/upwork/snapshots/${snapshot.id}/edit`)}
								>
									<EditOutlined fontSize='small' />
									Edit
								</AnimIconButton>
							</PermissionGate>
						</div>
					</div>

					<TilesRow>
						<DeltaTile
							label='Views'
							value={snapshot.views}
							previous={previousSnapshot?.views ?? null}
						/>
						<DeltaTile
							label='Invites'
							value={snapshot.invites}
							previous={previousSnapshot?.invites ?? null}
						/>
						<DeltaTile
							label='Direct messages'
							value={snapshot.directMessages}
							previous={previousSnapshot?.directMessages ?? null}
						/>
					</TilesRow>
				</Section>

				<Section $delay={160}>
					<div style={{ marginBottom: 8 }}>
						<div
							style={{
								fontSize: 11,
								fontWeight: 700,
								letterSpacing: '0.1em',
								textTransform: 'uppercase',
								color: '#64748b',
							}}
						>
							Positions
						</div>
						<div style={{ fontSize: 13, color: '#8a85a3', marginTop: 2 }}>
							Rank per tracked phrase. Lower is better; the delta compares to
							the same phrase in the previous snapshot of this profile.
						</div>
					</div>
					<DataTable<PositionsRow>
						columns={columns}
						rows={positionsRows}
						rowKey={(r) => r.keywordId}
						emptyTitle='No tracked phrases in this snapshot.'
						pagination={{
							page: 1,
							pageSize: Math.max(positionsRows.length, 1),
							total: positionsRows.length,
							onPageChange: () => undefined,
						}}
					/>
				</Section>
			</Surface>

		</Shell>
	)
}

export default UpworkSnapshotViewPage
