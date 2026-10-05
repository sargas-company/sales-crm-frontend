import { useState } from 'react'
import styled from 'styled-components'
import { atom, nthStagger } from './_shared/stagger'
import { useNavigate } from 'react-router-dom'
import {
	CheckCircleOutlined,
	ErrorOutlineOutlined,
	StorageRounded,
	TrendingUpRounded,
	VisibilityOutlined,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import {
	Actions,
	DataTable,
	IconAction,
	TableSkeleton,
	type DataTableColumn,
} from '../../components/_shared/DataTable'
import {
	useListBackupsQuery,
	type BackupRun,
} from '../../store/backups/backupsApi'

const PAGE_SIZE = 25

const STATS_WINDOW = 500

const formatBytes = (n: number): string => {
	if (!Number.isFinite(n) || n <= 0) return '0 B'
	const kb = n / 1024
	if (kb < 1024) return `${kb.toFixed(1)} KB`
	const mb = kb / 1024
	if (mb < 1024) return `${mb.toFixed(1)} MB`
	const gb = mb / 1024
	return `${gb.toFixed(2)} GB`
}

const BackupRecoveryPanel = () => {
	const [page, setPage] = useState(1)
	const { data, isLoading } = useListBackupsQuery({
		page,
		limit: PAGE_SIZE,
	})
	const { data: allData } = useListBackupsQuery({
		page: 1,
		limit: STATS_WINDOW,
	})
	const navigate = useNavigate()

	const runs = data?.data ?? []
	const total = data?.total ?? 0

	/* Stats computed from the first STATS_WINDOW runs; accurate while
	 * the total count stays within that window. */
	const stats = (() => {
		const items = allData?.data ?? []
		let succeeded = 0
		let failed = 0
		let totalSize = 0
		let sizedCount = 0
		for (const r of items) {
			if (r.status === 'SUCCEEDED' || r.status === 'VERIFIED') succeeded++
			else if (r.status === 'FAILED') failed++
			if (r.size) {
				totalSize += Number(r.size)
				sizedCount++
			}
		}
		return {
			succeeded,
			failed,
			totalSize,
			avgSize: sizedCount ? totalSize / sizedCount : 0,
		}
	})()

	const columns: DataTableColumn<BackupRun>[] = [
		{
			key: 'startedAt',
			label: 'Date / time',
			minWidth: 150,
			render: (r) => (
				<Mono>{new Date(r.startedAt).toLocaleString()}</Mono>
			),
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'type',
			label: 'Type',
			minWidth: 110,
			render: (r) => <TypePill>{r.type.toLowerCase()}</TypePill>,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 100,
			render: (r) => (
				<StatusPill $status={r.status}>{r.status.toLowerCase()}</StatusPill>
			),
		},
		{
			key: 'size',
			label: 'Size',
			render: (r) =>
				r.size ? (
					<Mono>{(Number(r.size) / 1024 / 1024).toFixed(1)} MB</Mono>
				) : (
					'—'
				),
		},
		{
			key: 'duration',
			label: 'Duration',
			render: (r) =>
				r.durationMs ? (
					<Mono>{(r.durationMs / 1000).toFixed(1)} s</Mono>
				) : (
					'—'
				),
		},
		{
			key: 'gitSha',
			label: 'Git',
			minWidth: 100,
			render: (r) => (r.gitSha ? <Mono>{r.gitSha.slice(0, 8)}</Mono> : '—'),
		},
		{
			key: 'migration',
			label: 'Migration',
			minWidth: 180,
			render: (r) =>
				r.migrationName ? (
					<Mono title={r.migrationName}>
						{r.migrationName.length > 24
							? r.migrationName.slice(0, 24) + '…'
							: r.migrationName}
					</Mono>
				) : (
					'—'
				),
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<IconAction
						type='button'
						aria-label='View backup'
						onClick={() => navigate(`/backups/${r.id}`)}
					>
						<VisibilityOutlined />
					</IconAction>
				</Actions>
			),
		},
	]

	return (
		<Shell>
			<HeroCards>
				<HeroCard>
					<HeroIcon>
						<CheckCircleOutlined />
					</HeroIcon>
					<HeroBody>
						<HeroLabel>Successful</HeroLabel>
						<HeroValue>{stats.succeeded}</HeroValue>
					</HeroBody>
				</HeroCard>
				<HeroCard>
					<HeroIcon>
						<ErrorOutlineOutlined />
					</HeroIcon>
					<HeroBody>
						<HeroLabel>Failed</HeroLabel>
						<HeroValue>{stats.failed}</HeroValue>
					</HeroBody>
				</HeroCard>
				<HeroCard>
					<HeroIcon>
						<StorageRounded />
					</HeroIcon>
					<HeroBody>
						<HeroLabel>Total size</HeroLabel>
						<HeroValue>{formatBytes(stats.totalSize)}</HeroValue>
					</HeroBody>
				</HeroCard>
				<HeroCard>
					<HeroIcon>
						<TrendingUpRounded />
					</HeroIcon>
					<HeroBody>
						<HeroLabel>Average size</HeroLabel>
						<HeroValue>{formatBytes(stats.avgSize)}</HeroValue>
					</HeroBody>
				</HeroCard>
			</HeroCards>

			<DataTable
				columns={columns}
				rows={runs}
				rowKey={(r) => r.id}
				isLoading={isLoading}
				emptyTitle='No backups yet'
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					total,
					onPageChange: setPage,
				}}
			/>

		</Shell>
	)
}

export default BackupRecoveryPanel

/* ─── Styles ──────────────────────────────────────── */

const Shell = styled.section`
	display: flex;
	flex-direction: column;
	gap: 16px;

	& > * {
		${atom};
	}
	${nthStagger};
`
const HeroCards = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, 1fr);
	}
	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}

	& > * {
		${atom};
	}
	${nthStagger};
`

/* Time-off style: icon chip on the left, label + big mono value on
 * the right. Neutral tint, no colored rail. */
const HeroCard = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 16px;
	padding: 16px 18px;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	min-width: 0;
`

const HeroIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 46px;
	height: 46px;
	border-radius: 12px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 26px;
	}
`

const HeroBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const HeroLabel = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.55px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const HeroValue = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
	font-size: 30px;
	font-weight: 700;
	color: ${T.textStrong};
	line-height: 1.05;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.7px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`
const Mono = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	color: ${T.textStrong};
	white-space: nowrap;
`
/* Pills sized to match the notifications SevTag — bigger than the
 * previous tiny defaults so they read clearly in the row. */
const TypePill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	color: ${T.textStrong};
	white-space: nowrap;
`
const StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	white-space: nowrap;
	background: ${(p) =>
		p.$status === 'SUCCEEDED' || p.$status === 'VERIFIED'
			? 'rgba(5, 150, 105, 0.1)'
			: p.$status === 'FAILED'
				? 'rgba(220, 38, 38, 0.1)'
				: 'rgba(217, 119, 6, 0.12)'};
	color: ${(p) =>
		p.$status === 'SUCCEEDED' || p.$status === 'VERIFIED'
			? '#047857'
			: p.$status === 'FAILED'
				? '#c2410c'
				: '#b45309'};
`
