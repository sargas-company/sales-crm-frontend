import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes, css } from 'styled-components'
import {
	CloseRounded,
	CloudUploadOutlined,
	PlayArrowRounded,
	PauseRounded,
	RefreshRounded,
	UnfoldLessRounded,
	ErrorRounded,
	CheckCircleRounded,
} from '@mui/icons-material'

import {
	cancelUpload,
	clearFinished,
	dismissTray,
	hydrateFromIdb,
	pauseUpload,
	removeUpload,
	resumeInterruptedWithFile,
	resumeUpload,
	retryUpload,
	toggleMinimize,
	useUploadQueue,
	type UploadItem,
} from './uploadQueueStore'
import { HashMismatchModal, SizeNameMismatchModal } from './UploadResumeModals'

type MimeKind = 'pdf' | 'image' | 'doc' | 'other'

const mimeKind = (mime: string): MimeKind => {
	if (/pdf/i.test(mime)) return 'pdf'
	if (/^image\//i.test(mime)) return 'image'
	if (/word|document|msword|sheet|excel|csv|presentation|powerpoint/i.test(mime))
		return 'doc'
	return 'other'
}

const EXT_COLORS: Record<
	MimeKind,
	{ from: string; to: string; solid: string }
> = {
	pdf: { from: '#f87171', to: '#dc2626', solid: '#dc2626' },
	image: { from: '#60a5fa', to: '#2563eb', solid: '#2563eb' },
	doc: { from: '#4ade80', to: '#16a34a', solid: '#16a34a' },
	other: { from: '#fbbf24', to: '#f59e0b', solid: '#f59e0b' },
}

const getExt = (name: string): string => {
	const dot = name.lastIndexOf('.')
	if (dot < 0 || dot === name.length - 1) return 'FILE'
	return name.slice(dot + 1, dot + 5).toUpperCase()
}

const fmt = (n: number) => {
	if (n < 1024) return `${n} B`
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
	if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
	return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/** Floating upload tray — "grouped sections" layout.
 *  Big header (52x52 icon + 22px Bricolage title), rows grouped by
 *  status (Active / Completed / Failed / Cancelled), minimised bar
 *  instead of a microscopic pill. Fonts and radii match the rest of
 *  the app (Inter + Bricolage; 10-12px radii; square action buttons,
 *  never oval). */
export const UploadTray = () => {
	const { items, minimized, dismissed } = useUploadQueue()

	/* One-time IDB hydration — pulls persisted paused/interrupted/
	 * error rows and cross-checks the live backend sessions. */
	useEffect(() => {
		void hydrateFromIdb()
	}, [])

	const targetMode: 'open' | 'bar' | 'hidden' =
		items.length === 0 ? 'hidden' : minimized || dismissed ? 'bar' : 'open'
	const [renderMode, setRenderMode] = useState(targetMode)
	const [cardClosing, setCardClosing] = useState(false)
	const [barClosing, setBarClosing] = useState(false)
	const exitTimerRef = useRef<number | null>(null)

	useEffect(() => {
		if (targetMode === renderMode) return
		if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current)
		if (renderMode === 'open') setCardClosing(true)
		if (renderMode === 'bar') setBarClosing(true)
		exitTimerRef.current = window.setTimeout(() => {
			setCardClosing(false)
			setBarClosing(false)
			setRenderMode(targetMode)
			exitTimerRef.current = null
		}, 260)
		return () => {
			if (exitTimerRef.current) {
				window.clearTimeout(exitTimerRef.current)
				exitTimerRef.current = null
			}
		}
	}, [targetMode, renderMode])

	if (renderMode === 'hidden') return null

	if (renderMode === 'bar') {
		return createPortal(
			<MinimizedBarView
				items={items}
				closing={barClosing}
				onExpand={toggleMinimize}
			/>,
			document.body,
		)
	}

	return createPortal(
		<TrayCardView
			items={items}
			closing={cardClosing}
			onMinimize={toggleMinimize}
			onClose={() => {
				clearFinished()
				dismissTray()
			}}
		/>,
		document.body,
	)
}

/* Presentational tray card — pure props, no store access. Reused by
 * the live tray above and by the showcase (which feeds it mock data
 * and sets `inline` to drop the fixed positioning). */
export interface TrayCardViewProps {
	items: UploadItem[]
	closing?: boolean
	inline?: boolean
	onMinimize?: () => void
	onClose?: () => void
}

export const TrayCardView = ({
	items,
	closing = false,
	inline = false,
	onMinimize,
	onClose,
}: TrayCardViewProps) => {
	/* Flat list — owner wants Google-Drive-style behaviour: items
	 *  stay in insertion order and update in place as they progress
	 *  through uploading → done / error / paused. No Active /
	 *  Completed / Failed groups, no cross-group animation. Cancelled
	 *  items are still removed from state ~320 ms after the cancel
	 *  API resolves, so they just disappear from the row list.
	 *  Status is read per-row via the icon / progress bar / inline
	 *  action buttons the Row component already renders. */
	const visibleItems = items.filter((i) => i.status !== 'cancelled')
	const summary = {
		active: items.filter((i) => i.status === 'uploading').length,
		queued: items.filter((i) => i.status === 'queued').length,
		done: items.filter((i) => i.status === 'done').length,
		failed: items.filter((i) => i.status === 'error').length,
	}
	return (
		<Card $closing={closing} $inline={inline}>
			<Head>
				<HeadLeft>
					<HeadIcon>
						<CloudUploadOutlined style={{ fontSize: 22 }} />
					</HeadIcon>
					<div>
						<Title>File transfers</Title>
						<Sub>
							{summary.active + summary.queued} active · {summary.done} done ·{' '}
							{summary.failed} failed
						</Sub>
					</div>
				</HeadLeft>
				<HeadRight>
					{onMinimize && (
						<SquareBtn type='button' onClick={onMinimize} aria-label='Minimize'>
							<UnfoldLessRounded style={{ fontSize: 20 }} />
						</SquareBtn>
					)}
					{onClose && (
						<CloseBtn type='button' onClick={onClose} aria-label='Close'>
							<CloseRounded style={{ fontSize: 20 }} />
						</CloseBtn>
					)}
				</HeadRight>
			</Head>
			<Body>
				{visibleItems.map((i) => (
					<Row key={i.id} item={i} isLastInTray={visibleItems.length === 1} />
				))}
			</Body>
		</Card>
	)
}

/* Minimised view — two circular FABs. Logic:
 *   - all done + no failures → single green "completed" FAB
 *   - any active → violet FAB with conic progress ring + count badge
 *   - any failed → red pulsing FAB with count badge (independent of
 *     active — both can show together)
 * Clicking any FAB re-opens the main card. */
export interface MinimizedBarViewProps {
	items: UploadItem[]
	closing?: boolean
	inline?: boolean
	onExpand?: () => void
}

export const MinimizedBarView = ({
	items,
	closing = false,
	inline = false,
	onExpand,
}: MinimizedBarViewProps) => {
	const active = items.filter(
		(i) =>
			i.status === 'uploading' ||
			i.status === 'queued' ||
			i.status === 'verifying' ||
			i.status === 'initializing' ||
			i.status === 'paused',
	).length
	/* interrupted joins failed in the "needs user attention" red
	 * FAB — both need a re-pick + resume. */
	const failed = items.filter(
		(i) => i.status === 'error' || i.status === 'interrupted',
	).length
	const done = items.filter((i) => i.status === 'done').length
	const activeOnly = items.filter((i) => i.status === 'uploading')
	const totalPct =
		activeOnly.length === 0
			? 0
			: Math.round(
					activeOnly.reduce((acc, i) => acc + i.progress, 0) / activeOnly.length,
				)
	const isAllDone = active === 0 && failed === 0 && done > 0

	return (
		<FabRow $closing={closing} $inline={inline}>
			{isAllDone && (
				<DoneFab type='button' onClick={onExpand} aria-label={`${done} completed`}>
					<CheckCircleRounded style={{ fontSize: 28 }} />
					<FabBadge $tone='done'>{done}</FabBadge>
				</DoneFab>
			)}
			{!isAllDone && active > 0 && (
				<ActiveFab
					type='button'
					onClick={onExpand}
					aria-label={`${active} uploading — expand`}
				>
					<FabRing style={{ ['--pct' as string]: `${totalPct}%` }} />
					<FabIcon>
						<CloudUploadOutlined style={{ fontSize: 24 }} />
					</FabIcon>
					<FabBadge $tone='active'>{active}</FabBadge>
				</ActiveFab>
			)}
			{!isAllDone && failed > 0 && (
				<FailedFab
					type='button'
					onClick={onExpand}
					aria-label={`${failed} failed — expand to retry`}
				>
					<ErrorRounded style={{ fontSize: 28 }} />
					<FabBadge $tone='failed'>{failed}</FabBadge>
				</FailedFab>
			)}
		</FabRow>
	)
}

const Row = ({ item, isLastInTray }: { item: UploadItem; isLastInTray: boolean }) => {
	const kind = mimeKind(item.mimeType || item.file?.type || '')
	const uploaded = (item.size * item.progress) / 100
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [sizeMismatch, setSizeMismatch] = useState<File | null>(null)
	const [hashMismatch, setHashMismatch] = useState(false)
	/* Two-stage cancel UX:
	 *  - cancelling: await backend/B2 cancel while showing a spinner
	 *    inside the X slot (prevents double-clicks, gives feedback).
	 *  - exiting: swap to a smooth collapse+fade transition on the
	 *    row (opacity 1→0, max-height to 0) before removing it from
	 *    state, so the list doesn't jerk. */
	const [cancelling, setCancelling] = useState(false)
	const [exiting, setExiting] = useState(false)

	const needsFilePick = item.status === 'interrupted' || item.status === 'error'

	const handlePick = () => inputRef.current?.click()

	const handleCancelRow = async () => {
		if (cancelling || exiting) return
		setCancelling(true)
		try {
			await cancelUpload(item.id)
		} catch {
			/* ignore — exit anyway so a broken session doesn't trap
			 * the row in the tray forever. */
		}
		setCancelling(false)
		setExiting(true)
		/* Orchestrated close:
		 *   t+0        row-exit transition (opacity + max-height) starts
		 *   t+320 ms   transition finishes
		 *   + beat     "осознание" pause so the tray doesn't jerk the
		 *              shutter closed the instant the row disappears
		 *              (only for the last row — otherwise the gap is
		 *              imperceptible)
		 *   = call removeUpload; items→0; tray's own close effect runs
		 *     its 260 ms slide-out keyframe
		 * For non-last rows there's no extra pause — adjacent rows
		 * just slide up into the freed space naturally. */
		const extraPause = isLastInTray ? 220 : 0
		window.setTimeout(() => removeUpload(item.id), 320 + extraPause)
	}

	const consumeFile = async (f: File) => {
		if (!needsFilePick) {
			resumeUpload(item.id)
			return
		}
		const res = await resumeInterruptedWithFile(item.id, f)
		if (res.ok === true) return
		if (res.reason === 'size-name-mismatch') setSizeMismatch(f)
		else if (res.reason === 'sha1-mismatch') setHashMismatch(true)
		/* 'session-gone' is already handled inside resumeInterruptedWithFile
		 * (either silent re-init or status: error on the row). */
	}

	return (
		<RowWrap $status={item.status} $exiting={exiting}>
			<FileIcon $kind={kind}>
				<FileFold />
				<FileExt>{getExt(item.fileName)}</FileExt>
			</FileIcon>
			<RowBody>
				<RowName title={item.fileName}>{item.fileName}</RowName>
				<RowMeta>
					{item.status === 'uploading' && (
						<RowMetaTxt>
							{item.progress}% · {fmt(uploaded)} / {fmt(item.size)}
						</RowMetaTxt>
					)}
					{item.status === 'verifying' && (
						<RowMetaTxt>Verifying file… {item.progress}%</RowMetaTxt>
					)}
					{item.status === 'initializing' && (
						<RowMetaTxt>Starting upload…</RowMetaTxt>
					)}
					{item.status === 'queued' && <RowMetaTxt>{fmt(item.size)}</RowMetaTxt>}
					{item.status === 'paused' && (
						<RowMetaTxt>
							{item.progress}% · paused · {fmt(item.size)}
						</RowMetaTxt>
					)}
					{item.status === 'interrupted' && (
						<InterruptedLine>
							Interrupted at {item.progress}% · {fmt(item.size)}
						</InterruptedLine>
					)}
					{item.status === 'done' && <RowMetaTxt>{fmt(item.size)}</RowMetaTxt>}
					{item.status === 'error' && (
						<ErrorLine>{item.error ?? 'Upload failed'}</ErrorLine>
					)}
					{item.status === 'cancelled' && <RowMetaTxt>Cancelled</RowMetaTxt>}
				</RowMeta>
				{/* Progress bar lives in a grid-row slot that transitions
				 *  grid-template-rows between 0fr and 1fr — gives the
				 *  bar (and its sibling status text) a smooth height
				 *  collapse/expand instead of a hard pop when the row's
				 *  status flips between queued ↔ uploading ↔ done, so
				 *  the next row glides down with the push instead of
				 *  snapping. The inner div needs min-height:0 +
				 *  overflow:hidden for the collapse to actually clip. */}
				<ProgressSlot
					$open={
						item.status === 'uploading' ||
						item.status === 'paused' ||
						item.status === 'verifying' ||
						item.status === 'interrupted'
					}
				>
					<ProgressSlotInner>
						<Progress>
							<ProgressFill
								style={{ width: `${item.progress}%` }}
								$paused={
									item.status !== 'uploading' &&
									item.status !== 'verifying'
								}
							/>
						</Progress>
					</ProgressSlotInner>
				</ProgressSlot>
			</RowBody>
			<RowActions
				item={item}
				onPickFile={handlePick}
				cancelling={cancelling}
				onCancel={handleCancelRow}
			/>
			<input
				ref={inputRef}
				type='file'
				hidden
				onChange={(e) => {
					const f = e.target.files?.[0]
					e.target.value = ''
					if (f) void consumeFile(f)
				}}
			/>
			{sizeMismatch && (
				<SizeNameMismatchModal
					expectedName={item.fileName}
					expectedSize={item.size}
					pickedName={sizeMismatch.name}
					pickedSize={sizeMismatch.size}
					onCancel={() => setSizeMismatch(null)}
					onRestartAnyway={() => {
						setSizeMismatch(null)
						/* "Start new upload for the picked file" — the current
						 * row is for a different file so we drop it and start
						 * fresh. */
						// eslint-disable-next-line @typescript-eslint/no-floating-promises
						void (async () => {
							await (await import('./uploadQueueStore')).cancelUpload(item.id)
							;(await import('./uploadQueueStore')).enqueueUploads(
								[sizeMismatch],
								item.folderId,
							)
						})()
					}}
				/>
			)}
			{hashMismatch && (
				<HashMismatchModal
					fileName={item.fileName}
					onDiscard={async () => {
						setHashMismatch(false)
						const { cancelUpload } = await import('./uploadQueueStore')
						await cancelUpload(item.id)
					}}
					onRestart={async () => {
						setHashMismatch(false)
						/* "Upload from scratch" — kill the old session, enqueue
						 * the picked file freshly. */
						const picked = inputRef.current?.files?.[0]
						const { cancelUpload, enqueueUploads } = await import(
							'./uploadQueueStore'
						)
						await cancelUpload(item.id)
						if (picked) enqueueUploads([picked], item.folderId)
					}}
				/>
			)}
		</RowWrap>
	)
}

const RowActions = ({
	item,
	onPickFile,
	cancelling,
	onCancel,
}: {
	item: UploadItem
	onPickFile: () => void
	cancelling: boolean
	onCancel: () => void
}) => {
	const canPause = item.status === 'uploading' || item.status === 'queued'
	const canResumeInMemory = item.status === 'paused' && !!item.file
	const needsPick =
		item.status === 'interrupted' ||
		(item.status === 'error' && !item.file) ||
		(item.status === 'paused' && !item.file)
	const canRetryInMemory = item.status === 'error' && !!item.file
	const canCancel =
		item.status === 'uploading' ||
		item.status === 'queued' ||
		item.status === 'paused' ||
		item.status === 'error' ||
		item.status === 'interrupted'
	/* Every button stays mounted all the time; each sits in a
	 *  BtnSlot whose width + opacity + margin transition in sync
	 *  with the $visible flag. Status flips (uploading → paused →
	 *  error → …) now fade/shrink the stale buttons out and
	 *  fade/expand the new ones in over 220 ms — no more
	 *  "molнniyeносно" pop in/out. Width is hardcoded to the
	 *  SquareBtn size (29 px) so the collapse is clean. */
	return (
		<RowActionsWrap>
			<BtnSlot $visible={canRetryInMemory && !cancelling} aria-hidden={!(canRetryInMemory && !cancelling)}>
				<SquareBtn type='button' onClick={() => retryUpload(item.id)} aria-label='Retry' tabIndex={canRetryInMemory && !cancelling ? 0 : -1}>
					<RefreshRounded style={{ fontSize: 20 }} />
				</SquareBtn>
			</BtnSlot>
			<BtnSlot $visible={canPause && !cancelling} aria-hidden={!(canPause && !cancelling)}>
				<SquareBtn type='button' onClick={() => pauseUpload(item.id)} aria-label='Pause' tabIndex={canPause && !cancelling ? 0 : -1}>
					<PauseRounded style={{ fontSize: 20 }} />
				</SquareBtn>
			</BtnSlot>
			<BtnSlot $visible={canResumeInMemory && !cancelling} aria-hidden={!(canResumeInMemory && !cancelling)}>
				<SquareBtn type='button' onClick={() => resumeUpload(item.id)} aria-label='Resume' tabIndex={canResumeInMemory && !cancelling ? 0 : -1}>
					<PlayArrowRounded style={{ fontSize: 20 }} />
				</SquareBtn>
			</BtnSlot>
			<BtnSlot $visible={needsPick && !cancelling} aria-hidden={!(needsPick && !cancelling)}>
				<SquareBtn type='button' onClick={onPickFile} aria-label='Resume (re-select file)' tabIndex={needsPick && !cancelling ? 0 : -1}>
					<PlayArrowRounded style={{ fontSize: 20 }} />
				</SquareBtn>
			</BtnSlot>
			<BtnSlot $visible={canCancel} aria-hidden={!canCancel}>
				<DangerSquareBtn
					type='button'
					onClick={onCancel}
					disabled={cancelling || !canCancel}
					aria-label='Cancel upload'
					aria-busy={cancelling}
					tabIndex={canCancel ? 0 : -1}
				>
					{cancelling ? <Spinner /> : <CloseRounded style={{ fontSize: 18 }} />}
				</DangerSquareBtn>
			</BtnSlot>
		</RowActionsWrap>
	)
}

/* ─── animations ──────────────────────────────────────────────────── */

const slideIn = keyframes`
	from { opacity: 0; transform: translateY(16px) scale(0.98); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`
const slideOut = keyframes`
	from { opacity: 1; transform: translateY(0) scale(1); }
	to   { opacity: 0; transform: translateY(16px) scale(0.98); }
`
const stripeShift = keyframes`
	from { background-position: 0 0; }
	to   { background-position: 24px 0; }
`

/* ─── Shared primitives ───────────────────────────────────────────── */

const SquareBtn = styled.button`
	width: 29px;
	height: 29px;
	border-radius: 8px;
	border: 1px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: #334155;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: background 160ms ease, color 160ms ease,
		border-color 160ms ease, transform 160ms ease;
	svg { font-size: 16px; }
	&:hover {
		background: #0f172a;
		color: #ffffff;
		border-color: transparent;
		transform: translateY(-1px);
	}
	&:active { transform: translateY(0); }
`

/* Red-tinted variant for destructive row actions (cancel upload). */
const DangerSquareBtn = styled.button`
	width: 29px;
	height: 29px;
	border-radius: 8px;
	border: 1px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: #64748b;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: background 160ms ease, color 160ms ease,
		border-color 160ms ease, transform 160ms ease;
	&:hover {
		background: #dc2626;
		color: #ffffff;
		border-color: transparent;
		transform: translateY(-1px);
	}
	&:active { transform: translateY(0); }
`

const CloseBtn = styled(SquareBtn)`
	&:hover {
		background: #dc2626;
		color: #ffffff;
		border-color: transparent;
	}
`

const RowActionsWrap = styled.div`
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	/* No gap: BtnSlot's own margin-left handles spacing so a hidden
	 *  slot can zero its margin and collapse cleanly. */
`

/* Per-button slot that animates in/out. All buttons stay mounted;
 *  flipping $visible transitions width (29 → 0 px), margin and
 *  opacity in sync, so the controls fade and shrink out of the row
 *  instead of popping. 29 px matches SquareBtn's fixed width;
 *  overflow:hidden clips the button during the collapse. */
const BtnSlot = styled.div<{ $visible: boolean }>`
	display: inline-flex;
	align-items: center;
	overflow: hidden;
	width: ${({ $visible }) => ($visible ? '29px' : '0')};
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	margin-left: ${({ $visible }) => ($visible ? '6px' : '0')};
	transform: ${({ $visible }) => ($visible ? 'scale(1)' : 'scale(0.9)')};
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
	transition:
		width 220ms cubic-bezier(0.22, 1, 0.36, 1),
		margin 220ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 180ms ease,
		transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	&:first-child {
		margin-left: 0;
	}
`

const FileIcon = styled.div<{ $kind: MimeKind }>`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: center;
	padding-bottom: 8px;
	width: 48px;
	height: 56px;
	border-radius: 8px;
	background: linear-gradient(
		135deg,
		${(p) => EXT_COLORS[p.$kind].from},
		${(p) => EXT_COLORS[p.$kind].to}
	);
	flex: 0 0 auto;
	box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.2);
`
const FileFold = styled.span`
	position: absolute;
	top: 0;
	right: 0;
	width: 14px;
	height: 14px;
	background: linear-gradient(
		225deg,
		rgba(255, 255, 255, 0.5) 0%,
		rgba(255, 255, 255, 0.5) 50%,
		rgba(0, 0, 0, 0.08) 50%,
		rgba(0, 0, 0, 0.08) 100%
	);
	border-radius: 0 8px 0 6px;
`
const FileExt = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 0.8px;
	color: #ffffff;
`

/* Grid-row collapse slot — animates from 0fr to 1fr over 260 ms
 *  so the progress bar grows/shrinks smoothly as its sibling row
 *  gains/loses the Progress element. Pairs with ProgressSlotInner
 *  (overflow:hidden, min-height:0) so the collapse actually clips
 *  the content box, not just the row size. */
const ProgressSlot = styled.div<{ $open: boolean }>`
	display: grid;
	grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
	transition: grid-template-rows 260ms cubic-bezier(0.22, 1, 0.36, 1);
`
const ProgressSlotInner = styled.div`
	min-height: 0;
	overflow: hidden;
`
const Progress = styled.div`
	margin-top: 6px;
	height: 6px;
	border-radius: 999px;
	background: rgba(99, 102, 241, 0.14);
	overflow: hidden;
`
const ProgressFill = styled.div<{ $paused: boolean }>`
	height: 100%;
	background: ${({ $paused }) =>
		$paused
			? '#94a3b8'
			: 'repeating-linear-gradient(45deg, #6366f1 0 10px, #818cf8 10px 20px)'};
	background-size: 24px 100%;
	border-radius: 999px;
	transition: width 220ms cubic-bezier(0.22, 1, 0.36, 1);
	${({ $paused }) =>
		!$paused &&
		css`
			animation: ${stripeShift} 900ms linear infinite;
		`}
`

const RowMetaTxt = styled.span`
	color: #64748b;
	font-size: 13px;
	font-weight: 500;
	font-variant-numeric: tabular-nums;
`

const ErrorLine = styled.div`
	color: #b91c1c;
	font-size: 12.5px;
	font-weight: 500;
	margin-top: 2px;
`

const InterruptedLine = styled.div`
	color: #c2410c;
	font-size: 12.5px;
	font-weight: 600;
	margin-top: 2px;
`

/* ─── Card ────────────────────────────────────────────────────────── */

const Card = styled.div<{ $closing: boolean; $inline?: boolean }>`
	${({ $inline }) =>
		$inline
			? css`
					position: relative;
					width: 600px;
					max-width: 100%;
				`
			: css`
					position: fixed;
					bottom: 24px;
					right: 24px;
					width: 600px;
					max-width: calc(100vw - 48px);
					z-index: 1500;
				`}
	background: #ffffff;
	border-radius: 22px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.06),
		0 28px 70px -16px rgba(15, 23, 42, 0.45);
	overflow: hidden;
	display: flex;
	flex-direction: column;
	${({ $inline, $closing }) =>
		$inline
			? ''
			: css`
					animation: ${$closing ? slideOut : slideIn}
						${$closing ? '260ms' : '320ms'} cubic-bezier(0.22, 1, 0.36, 1) both;
				`}
`

const Head = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 24px 22px 20px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
`
const HeadLeft = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 16px;
	min-width: 0;
`
const HeadIcon = styled.div`
	width: 47px;
	height: 47px;
	border-radius: 14px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
	color: #ffffff;
	flex: 0 0 auto;
	box-shadow: 0 8px 18px -6px rgba(15, 23, 42, 0.5);
`
const Title = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 20px;
	font-weight: 800;
	color: #0f172a;
	letter-spacing: -0.4px;
`
const Sub = styled.div`
	font-size: 11.5px;
	color: #64748b;
	font-weight: 500;
	margin-top: 3px;
`
const HeadRight = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`

const Body = styled.div`
	max-height: 520px;
	overflow-y: auto;
	padding: 10px 14px 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
`
const RowWrap = styled.div<{ $status: UploadItem['status']; $exiting?: boolean }>`
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 14px;
	align-items: flex-start;
	padding: 12px 8px;
	border-radius: 12px;
	background: transparent;
	/* Plain row: natural height from its content. Previously had a
	 *  max-height:220px + overflow:hidden on the default state (left
	 *  over from an earlier exit-collapse animation) — that clipped
	 *  the status block and let rows visually overlap each other
	 *  when a long filename pushed content past 220 px. Nothing
	 *  caps the height now; the parent Body gets overflow-y:auto. */
	opacity: ${({ $status }) => ($status === 'cancelled' ? 0.6 : 1)};
	pointer-events: ${({ $exiting }) => ($exiting ? 'none' : 'auto')};
	transition: background 160ms ease, opacity 160ms ease;
	&:hover {
		background: rgba(15, 23, 42, 0.03);
	}
`

/* 16×16 CSS spinner that occupies the same slot as the close icon. */
const spin = keyframes`
	to { transform: rotate(360deg); }
`
const Spinner = styled.span`
	display: inline-block;
	width: 16px;
	height: 16px;
	border: 2px solid currentColor;
	border-top-color: transparent;
	border-radius: 50%;
	animation: ${spin} 600ms linear infinite;
`
const RowBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`
const RowName = styled.div`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14.5px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.1px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const RowMeta = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`

/* ─── Minimised view — dual circular FABs ─────────────────────────── */

const spinKf = keyframes`
	from { transform: rotate(0deg); }
	to   { transform: rotate(360deg); }
`
const pulseFailKf = keyframes`
	0%, 100% {
		box-shadow:
			0 0 0 0 rgba(220, 38, 38, 0.5),
			0 14px 32px -10px rgba(15, 23, 42, 0.5);
	}
	50% {
		box-shadow:
			0 0 0 10px rgba(220, 38, 38, 0),
			0 14px 32px -10px rgba(15, 23, 42, 0.5);
	}
`

const FabRow = styled.div<{ $closing: boolean; $inline?: boolean }>`
	${({ $inline }) =>
		$inline
			? css`
					position: relative;
				`
			: css`
					position: fixed;
					bottom: 24px;
					right: 24px;
					z-index: 1500;
				`}
	display: inline-flex;
	align-items: center;
	gap: 14px;
	/* Soft corner glow — a wide radial fade anchored past the
	 * bottom-right of the FAB cluster so the fabs sit on a subtle
	 * dark halo that makes them pop against a light page. Only
	 * applied in the floating (non-inline) mode. */
	${({ $inline }) =>
		!$inline &&
		css`
			&::before {
				content: '';
				position: absolute;
				right: -58px;
				bottom: -58px;
				width: 260px;
				height: 260px;
				border-radius: 50%;
				background: radial-gradient(
					circle at 70% 70%,
					rgba(15, 23, 42, 0.16) 0%,
					rgba(15, 23, 42, 0.072) 40%,
					rgba(15, 23, 42, 0) 70%
				);
				filter: blur(4px);
				pointer-events: none;
				z-index: -1;
			}
		`}
	${({ $inline, $closing }) =>
		$inline
			? ''
			: css`
					animation: ${$closing ? slideOut : slideIn}
						${$closing ? '260ms' : '320ms'} cubic-bezier(0.22, 1, 0.36, 1) both;
				`}
`

const fabBase = css`
	position: relative;
	width: 64px;
	height: 64px;
	border-radius: 50%;
	border: none;
	color: #ffffff;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-shadow:
		0 1px 0 rgba(255, 255, 255, 0.1) inset,
		0 14px 32px -10px rgba(15, 23, 42, 0.5);
	transition: transform 220ms cubic-bezier(0.22, 1.35, 0.36, 1);
	&:hover { transform: translateY(-3px); }
	&:active { transform: translateY(0); }
`

const ActiveFab = styled.button`
	${fabBase}
	background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
`
const FailedFab = styled.button`
	${fabBase}
	background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
	animation: ${pulseFailKf} 1.8s ease-in-out infinite;
`
const DoneFab = styled.button`
	${fabBase}
	background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
`

const FabIcon = styled.span`
	position: relative;
	z-index: 2;
	display: inline-flex;
	align-items: center;
	justify-content: center;
`
const FabRing = styled.span`
	position: absolute;
	inset: 4px;
	border-radius: 50%;
	background: conic-gradient(
		rgba(255, 255, 255, 0.9) var(--pct, 0%),
		rgba(255, 255, 255, 0.18) 0
	);
	mask: radial-gradient(circle, transparent 60%, #000 61%);
	-webkit-mask: radial-gradient(circle, transparent 60%, #000 61%);
	animation: ${spinKf} 8s linear infinite;
`
const FabBadge = styled.span<{ $tone: 'active' | 'failed' | 'done' }>`
	position: absolute;
	top: -2px;
	right: -2px;
	min-width: 22px;
	height: 22px;
	padding: 0 6px;
	border-radius: 999px;
	background: ${({ $tone }) => ($tone === 'failed' ? '#0f172a' : '#ffffff')};
	color: ${({ $tone }) =>
		$tone === 'failed' ? '#ffffff' : $tone === 'done' ? '#15803d' : '#4338ca'};
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 11px;
	font-weight: 800;
	border: 2px solid #ffffff;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.3);
`
