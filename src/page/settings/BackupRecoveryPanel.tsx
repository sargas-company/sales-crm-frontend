import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { atom, nthStagger } from './_shared/stagger'
import { useNavigate } from 'react-router-dom'
import {
	BackupOutlined,
	CheckCircleOutlined,
	ErrorOutlineOutlined,
	PlayCircleFilled,
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
import ConfirmModal from '../../components/_shared/ConfirmModal'
import PermissionGate from '../../components/auth/PermissionGate'
import { useToast } from '../../context/toast/ToastContext'
import {
	useListBackupsQuery,
	useTriggerBackupMutation,
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
	const [confirmOpen, setConfirmOpen] = useState(false)
	/* While a trigger is live, this holds the ISO timestamp returned by
	 * POST /backups/trigger. Any MANUAL run with triggeredBy='manual-ui'
	 * and startedAt >= this value is "ours"; the polling below watches
	 * that row's status. Null means idle. */
	const [triggeredAt, setTriggeredAt] = useState<string | null>(null)
	/* Protects against double-finishing the same in-flight run (e.g. a
	 * terminal status flashing by for a few ticks). */
	const terminalFiredRef = useRef<string | null>(null)
	const { showToast } = useToast()
	const [triggerBackup, { isLoading: isTriggering }] = useTriggerBackupMutation()

	const polling = triggeredAt !== null
	const { data, isLoading } = useListBackupsQuery(
		{ page, limit: PAGE_SIZE },
		{ pollingInterval: polling ? 2500 : 0 }
	)
	const { data: allData } = useListBackupsQuery({
		page: 1,
		limit: STATS_WINDOW,
	})
	const navigate = useNavigate()

	const runs = data?.data ?? []
	const total = data?.total ?? 0

	/* Find "our" in-flight row: newest MANUAL/manual-ui row with
	 * startedAt >= triggeredAt. Falls back to null in the brief window
	 * between POST success and the row appearing in the list. */
	const liveRun = useMemo<BackupRun | null>(() => {
		if (!triggeredAt) return null
		const since = new Date(triggeredAt).getTime()
		for (const r of runs) {
			if (r.type !== 'MANUAL') continue
			if (r.triggeredBy !== 'manual-ui') continue
			if (new Date(r.startedAt).getTime() < since - 1000) continue
			return r
		}
		return null
	}, [runs, triggeredAt])

	/* Fire a toast + leave polling mode when the live row reaches a
	 * terminal state. terminalFiredRef guards against the same row
	 * firing twice if the list re-renders. */
	useEffect(() => {
		if (!liveRun) return
		if (liveRun.status === 'RUNNING') return
		if (terminalFiredRef.current === liveRun.id) return
		terminalFiredRef.current = liveRun.id
		if (liveRun.status === 'VERIFIED' || liveRun.status === 'SUCCEEDED') {
			showToast('Backup completed successfully', 'success')
		} else {
			const detail = liveRun.errorMessage
				? `Backup failed: ${liveRun.errorMessage.slice(0, 120)}`
				: 'Backup failed'
			showToast(detail, 'error')
		}
		setTriggeredAt(null)
	}, [liveRun, showToast])

	const buttonBusy = isTriggering || polling

	const handleConfirmRun = async () => {
		try {
			const res = await triggerBackup().unwrap()
			setConfirmOpen(false)
			terminalFiredRef.current = null
			setTriggeredAt(res.triggeredAt)
			showToast('Backup started — this will take a minute or two', 'info')
		} catch (err) {
			const anyErr = err as { data?: { message?: string }; status?: number }
			if (anyErr?.status === 409) {
				showToast('Another backup is already running', 'warning')
				setConfirmOpen(false)
			} else {
				showToast(anyErr?.data?.message ?? 'Could not start backup', 'error')
			}
		}
	}

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
			render: (r) => <Mono>{new Date(r.startedAt).toLocaleString()}</Mono>,
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
			render: (r) => <StatusPill $status={r.status}>{r.status.toLowerCase()}</StatusPill>,
		},
		{
			key: 'size',
			label: 'Size',
			render: (r) =>
				r.size ? <Mono>{(Number(r.size) / 1024 / 1024).toFixed(1)} MB</Mono> : '—',
		},
		{
			key: 'duration',
			label: 'Duration',
			render: (r) => (r.durationMs ? <Mono>{(r.durationMs / 1000).toFixed(1)} s</Mono> : '—'),
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

			<PermissionGate permission='backups:create'>
				<TriggerStrip>
					<RunNowBtn
						type='button'
						onClick={() => setConfirmOpen(true)}
						disabled={buttonBusy}
						aria-busy={buttonBusy || undefined}
					>
						{buttonBusy ? (
							<WaveDots aria-hidden='true'>
								<span />
								<span />
								<span />
							</WaveDots>
						) : (
							<>
								<PlayCircleFilled sx={{ fontSize: 20 }} />
								<span>Run backup now</span>
							</>
						)}
					</RunNowBtn>
					<TriggerHint>
						{polling
							? liveRun
								? `Backup running — ${liveRun.id.slice(0, 8)}…`
								: 'Backup starting…'
							: 'Fires the same backup path as the nightly cron. Discord gets a message either way.'}
					</TriggerHint>
				</TriggerStrip>
			</PermissionGate>

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

			{confirmOpen && (
				<ConfirmModal
					icon={<BackupOutlined />}
					iconTone='orange'
					title='Run backup now?'
					description={
						<>
							This fires an immediate database backup through the same path the 02:00 cron
							uses. It takes <strong>1–2 minutes</strong> and publishes a message to Discord
							either way (success or failure).
						</>
					}
					confirmLabel='Run backup'
					confirmLoadingLabel='Starting…'
					confirmColor='orange'
					isLoading={isTriggering}
					onClose={() => (isTriggering ? undefined : setConfirmOpen(false))}
					onConfirm={handleConfirmRun}
				/>
			)}
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

/* ─── Manual-trigger strip ─────────────────────────────────────── */

const TriggerStrip = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 14px 18px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 14px;

	@media (max-width: 720px) {
		flex-direction: column;
		align-items: stretch;
		gap: 10px;
	}
`

const RunNowBtn = styled.button`
	appearance: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-width: 180px;
	min-height: 42px;
	padding: 10px 20px;
	border: 0;
	border-radius: 10px;
	background: #f97316;
	color: #ffffff;
	font-family: inherit;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.01em;
	cursor: pointer;
	transition:
		background 180ms ease,
		transform 160ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 180ms ease;

	svg {
		font-size: 20px;
		transform-origin: 50% 50%;
		transition: transform 420ms cubic-bezier(0.22, 1.3, 0.36, 1);
	}

	&:hover:not(:disabled) {
		background: #ea580c;
		transform: translateY(-1px);
	}

	/* "Press play" micro-animation: on hover the triangle slides a hair
	 * right while scaling, then settles. Replaces the removed hover
	 * glow as the primary feedback cue. */
	&:hover:not(:disabled) svg {
		transform: scale(1.18) translateX(1px) rotate(-6deg);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:active:not(:disabled) svg {
		transform: scale(1.04) translateX(0) rotate(0deg);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.85;
	}

	@media (prefers-reduced-motion: reduce) {
		transition:
			background 180ms ease,
			opacity 180ms ease;

		svg {
			transition: none;
		}

		&:hover:not(:disabled) svg {
			transform: none;
		}
	}
`

const waveDot = keyframes`
	0%, 60%, 100% { transform: translateY(0); opacity: 0.55; }
	30%           { transform: translateY(-6px); opacity: 1; }
`

const WaveDots = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	height: 1em;

	& > span {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #ffffff;
		display: inline-block;
		animation: ${waveDot} 1.1s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}
	& > span:nth-of-type(2) {
		animation-delay: 0.14s;
	}
	& > span:nth-of-type(3) {
		animation-delay: 0.28s;
	}

	@media (prefers-reduced-motion: reduce) {
		& > span {
			animation: none;
			opacity: 0.8;
		}
	}
`

const TriggerHint = styled.span`
	font-size: 12.5px;
	color: ${T.textSecondary};
	line-height: 1.45;
`
