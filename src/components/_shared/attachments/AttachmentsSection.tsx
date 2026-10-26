import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	AttachFileRounded,
	CheckCircleRounded,
	CloseRounded,
	DeleteOutlineRounded,
	DownloadRounded,
} from '@mui/icons-material'

import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import ConfirmModal from '../ConfirmModal'

/** Shape every attachment list returns — both Employee and Project
 *  backends serialize to this today. Keep in sync with the per-entity
 *  interfaces in the store modules. */
export interface AttachmentItem {
	id: string
	originalName: string
	mimeType: string
	size: number
	createdAt: string
	uploadedBy: {
		id: string
		name: string
		email: string | null
	} | null
}

interface Props {
	items: AttachmentItem[]
	isLoading: boolean
	onUpload: (file: File) => Promise<unknown>
	onDelete: (attachmentId: string) => Promise<unknown>
	fetchDownloadUrl: (
		attachmentId: string,
	) => Promise<{ url: string; fileName: string }>
	/** Hide the "Add more files" trigger. Delete still works. */
	hideAdd?: boolean
	/** Hide the per-file delete button. Read-only surfaces (e.g. the
	 *  client-request preview) pass this so the row only exposes
	 *  Download. `onDelete` is still required by the type but never
	 *  called in that mode. */
	hideDelete?: boolean
}

const MAX_BYTES = 50 * 1024 * 1024

interface PendingUpload {
	id: string
	name: string
	size: number
}

const AttachmentsSection = ({
	items,
	isLoading,
	onUpload,
	onDelete,
	fetchDownloadUrl,
	hideAdd = false,
	hideDelete = false,
}: Props) => {
	const { showToast } = useToast()
	const inputRef = useRef<HTMLInputElement>(null)
	const [dragging, setDragging] = useState(false)
	const [pendingDelete, setPendingDelete] = useState<AttachmentItem | null>(null)
	const [downloadingId, setDownloadingId] = useState<string | null>(null)
	const [pending, setPending] = useState<PendingUpload[]>([])
	const data = items

	const pickFiles = () => inputRef.current?.click()

	const handleFiles = async (files: FileList | null) => {
		if (!files || files.length === 0) return
		const list = Array.from(files)
		const oversized = list.find((f) => f.size > MAX_BYTES)
		if (oversized) {
			showToast(
				`"${oversized.name}" is larger than the 50 MB limit`,
				'error',
			)
			return
		}
		const pendingItems: PendingUpload[] = list.map((f) => ({
			id:
				(typeof crypto !== 'undefined' && 'randomUUID' in crypto
					? crypto.randomUUID()
					: `${Date.now()}-${Math.random()}`),
			name: f.name,
			size: f.size,
		}))
		setPending((prev) => [...prev, ...pendingItems])
		let okCount = 0
		try {
			for (let i = 0; i < list.length; i++) {
				const file = list[i]
				const pid = pendingItems[i].id
				try {
					await onUpload(file)
					okCount++
				} catch (e) {
					showToast(
						parseServerError(e) || `Could not upload "${file.name}"`,
						'error',
					)
				} finally {
					setPending((prev) => prev.filter((p) => p.id !== pid))
				}
			}
			if (okCount > 0) {
				showToast(
					okCount === 1 ? 'File uploaded' : `${okCount} files uploaded`,
					'success',
				)
			}
		} finally {
			if (inputRef.current) inputRef.current.value = ''
		}
	}

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setDragging(false)
		void handleFiles(e.dataTransfer.files)
	}

	const handleDownload = async (att: AttachmentItem) => {
		setDownloadingId(att.id)
		try {
			const { url } = await fetchDownloadUrl(att.id)
			// Backend forces `Content-Disposition: attachment` on the
			// signed URL — browser will download rather than open inline
			// (that matters for HTML/SVG/text, which otherwise render).
			// Signed URL expires in ~60s so a copied link won't be
			// reusable later.
			window.open(url, '_blank', 'noopener,noreferrer')
		} catch (e) {
			showToast(parseServerError(e) || 'Download link failed', 'error')
		} finally {
			setDownloadingId(null)
		}
	}

	const confirmDelete = async () => {
		if (!pendingDelete) return
		try {
			await onDelete(pendingDelete.id)
			showToast('File deleted', 'success')
		} catch (e) {
			showToast(parseServerError(e) || 'Delete failed', 'error')
		} finally {
			setPendingDelete(null)
		}
	}

	const hasFiles = data.length > 0

	return (
		<Wrap>
			<Head>
				<HeadTitle>Attachments</HeadTitle>
				<HeadCount>
					{isLoading ? '…' : `${data.length} file${data.length === 1 ? '' : 's'}`}
				</HeadCount>
			</Head>

			<HiddenInput
				ref={inputRef}
				type='file'
				multiple
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					void handleFiles(e.target.files)
				}
			/>

			{hasFiles || pending.length > 0 ? (
				<>
					<FileList>
						{pending.map((p) => (
							<FileCard key={`pend-${p.id}`} $kind='other'>
								<FileTypeIcon $kind='other'>
									<FileFold />
									<FileExt>{getExt(p.name)}</FileExt>
								</FileTypeIcon>
								<FileBody>
									<FileName>{p.name}</FileName>
									<FileStatus>
										<UploadingLabel>
											<Spinner />
											<FileStatusText $tone='upload'>Uploading</FileStatusText>
										</UploadingLabel>
										<StatusDot />
										<FileStatusText>{formatBytes(p.size)}</FileStatusText>
									</FileStatus>
									<ProgressTrack>
										<ProgressTrackBar />
									</ProgressTrack>
								</FileBody>
								<CloseBtn
									type='button'
									disabled
									title='Uploading…'
									aria-label='Uploading'
								>
									<CloseRounded style={{ fontSize: 16 }} />
								</CloseBtn>
							</FileCard>
						))}
						{data.map((att) => (
							<FileCard key={att.id} $kind={mimeKind(att.mimeType)}>
								<FileTypeIcon $kind={mimeKind(att.mimeType)}>
									<FileFold />
									<FileExt>{getExt(att.originalName)}</FileExt>
								</FileTypeIcon>
								<FileBody>
									<FileName>{att.originalName}</FileName>
									<FileStatus>
										<CheckCircleRounded
											style={{ fontSize: 15, color: '#16a34a' }}
										/>
										<FileStatusText $tone='done'>Completed</FileStatusText>
										<StatusDot />
										<FileStatusText>{formatBytes(att.size)}</FileStatusText>
										<StatusDot />
										<FileStatusText>{formatDate(att.createdAt)}</FileStatusText>
									</FileStatus>
								</FileBody>
								<CardActions>
									<ActBig
										type='button'
										onClick={() => handleDownload(att)}
										disabled={downloadingId === att.id}
									>
										<span className='num'>01</span>
										<span className='lbl-track' aria-hidden='true'>
											<span className='lbl-row'>Download</span>
											<span className='lbl-row'>Download</span>
										</span>
										<span className='sr-only'>Download</span>
									</ActBig>
									{!hideDelete && (
										<ActBig
											type='button'
											$danger
											onClick={() => setPendingDelete(att)}
										>
											<span className='num'>02</span>
											<span className='lbl-track' aria-hidden='true'>
												<span className='lbl-row'>Delete</span>
												<span className='lbl-row'>Delete</span>
											</span>
											<span className='sr-only'>Delete</span>
										</ActBig>
									)}
								</CardActions>
							</FileCard>
						))}
					</FileList>

					{!hideAdd && (
						<AddMoreBtn type='button' onClick={pickFiles}>
							<AttachFileRounded style={{ fontSize: 16 }} />
							Add more files
						</AddMoreBtn>
					)}
				</>
			) : hideAdd ? null : (
				<DropZone
					$dragging={dragging}
					onClick={pickFiles}
					onDragOver={(e) => {
						e.preventDefault()
						setDragging(true)
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={handleDrop}
				>
					<DropIcon>
						<ClipWrap>
							<AttachFileRounded style={{ fontSize: 28 }} />
						</ClipWrap>
					</DropIcon>
					<DropTitle>Attach files</DropTitle>
					<DropHint>
						Click to pick or drop files here. PDF, images, docs — up to
						50&nbsp;MB each.
					</DropHint>
				</DropZone>
			)}


			{pendingDelete && (
				<ConfirmModal
					icon={<DeleteOutlineRounded />}
					iconTone='danger'
					title='Delete this file?'
					description={
						<>
							<strong>{pendingDelete.originalName}</strong> will be removed
							from this record and from storage. This cannot be undone.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onClose={() => setPendingDelete(null)}
					onConfirm={confirmDelete}
				/>
			)}
		</Wrap>
	)
}

export default AttachmentsSection

/* ─── helpers ──────────────────────────────────────────────────── */

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
	if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
	return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
}

type MimeKind = 'pdf' | 'image' | 'doc' | 'other'
function mimeKind(mime: string): MimeKind {
	if (/pdf/i.test(mime)) return 'pdf'
	if (/^image\//i.test(mime)) return 'image'
	if (/word|document|msword|sheet|excel|csv|presentation|powerpoint/i.test(mime))
		return 'doc'
	return 'other'
}

/** Grab the file extension in uppercase form, max 4 chars. "foo.tar.gz" → "GZ". */
function getExt(name: string): string {
	const dot = name.lastIndexOf('.')
	if (dot < 0 || dot === name.length - 1) return 'FILE'
	return name.slice(dot + 1, dot + 5).toUpperCase()
}

/* ─── styles ────────────────────────────────────────────────────── */

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 20px 24px;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`

const Head = styled.div`
	display: flex;
	align-items: baseline;
	gap: 10px;
	justify-content: space-between;
`

const HeadTitle = styled.h3`
	margin: 0;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 16px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.2px;
`

const HeadCount = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: #64748b;
`

const HiddenInput = styled.input`
	display: none;
`

const clipIdleSwing = keyframes`
	0%, 100% { transform: rotate(-4deg); }
	50%      { transform: rotate(4deg); }
`

const clipHoverSwing = keyframes`
	0%   { transform: rotate(0) translateY(0) scale(1); }
	15%  { transform: rotate(-35deg) translateY(-3px) scale(1.12); }
	35%  { transform: rotate(28deg) translateY(2px) scale(1.1); }
	55%  { transform: rotate(-18deg) translateY(-1px) scale(1.06); }
	75%  { transform: rotate(10deg) translateY(0) scale(1.03); }
	100% { transform: rotate(0) translateY(0) scale(1); }
`

const DropZone = styled.div<{ $dragging: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 36px 24px;
	border-radius: 12px;
	border: 2px dashed
		${(p) =>
			p.$dragging ? 'rgba(3, 105, 161, 0.6)' : 'rgba(15, 23, 42, 0.14)'};
	background: ${(p) =>
		p.$dragging ? 'rgba(3, 105, 161, 0.04)' : 'transparent'};
	cursor: pointer;
	transition:
		border-color 160ms ease,
		background 160ms ease;
	&:hover {
		border-color: rgba(3, 105, 161, 0.45);
	}
	&:hover [data-clip-wrap] {
		animation: ${clipHoverSwing} 700ms cubic-bezier(0.36, 0.07, 0.19, 0.97) 1;
	}
	@media (prefers-reduced-motion: reduce) {
		& [data-clip-wrap],
		&:hover [data-clip-wrap],
		& [data-clip-idle] {
			animation: none !important;
		}
	}
`

const DropIcon = styled.span.attrs({ 'data-clip-idle': true })`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: rgba(3, 105, 161, 0.1);
	color: rgba(3, 105, 161, 1);
	transform-origin: 50% 10%;
	animation: ${clipIdleSwing} 2.4s ease-in-out infinite;
`

/* Inner wrapper plays ONLY the hover animation. Keeping hover on its
   own element (not on the SVG itself) means when hover ends the
   element's transform returns cleanly to `none` while the OUTER
   DropIcon keeps its idle swing uninterrupted — no twitch on
   mouseleave. */
const ClipWrap = styled.span.attrs({ 'data-clip-wrap': true })`
	display: inline-flex;
	transform-origin: 50% 10%;
`

const DropTitle = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	font-weight: 700;
	color: #0f172a;
`

const DropHint = styled.div`
	font-size: 12px;
	color: #64748b;
	text-align: center;
`

const FileList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

/* Spinner used in pending-upload rows */
const spinKf = keyframes`
	to { transform: rotate(360deg); }
`
const Spinner = styled.span`
	display: inline-block;
	width: 18px;
	height: 18px;
	border: 2px solid rgba(3, 105, 161, 0.2);
	border-top-color: rgba(3, 105, 161, 1);
	border-radius: 50%;
	animation: ${spinKf} 760ms linear infinite;
`

/* ─── file row ────────────────────────────────────────────────── */
const EXT_COLORS: Record<
	MimeKind,
	{ from: string; to: string; solid: string }
> = {
	pdf: { from: '#f87171', to: '#dc2626', solid: '#dc2626' },
	image: { from: '#60a5fa', to: '#2563eb', solid: '#2563eb' },
	doc: { from: '#4ade80', to: '#16a34a', solid: '#16a34a' },
	other: { from: '#fbbf24', to: '#f59e0b', solid: '#f59e0b' },
}
/* Base row chrome: zero hover shadow / border shift.
   The interest is in the file-type icon — it lifts, tilts, and casts a
   mime-color shadow on hover (nested below). */
const FileCard = styled.li<{ $kind?: MimeKind }>`
	position: relative;
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 16px;
	padding: 14px 16px;
	border-radius: 14px;
	background: #ffffff;
	border: none;
	overflow: hidden;
	transition: transform 220ms cubic-bezier(0.22, 1.35, 0.36, 1);
	&:hover {
		transform: translateX(2px);
	}
	& > :first-child {
		transition:
			transform 240ms cubic-bezier(0.22, 1.35, 0.36, 1),
			box-shadow 240ms ease;
	}
	&:hover > :first-child {
		transform: scale(1.14) rotate(-6deg) translateY(-2px);
		box-shadow:
			0 6px 14px -4px
				${(p) =>
					p.$kind ? EXT_COLORS[p.$kind].solid : 'rgba(99, 102, 241, 1)'}66;
	}
`
const FileTypeIcon = styled.div<{ $kind: MimeKind }>`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: center;
	padding-bottom: 7px;
	width: 44px;
	height: 54px;
	border-radius: 6px;
	background: linear-gradient(
		135deg,
		${(p) => EXT_COLORS[p.$kind].from},
		${(p) => EXT_COLORS[p.$kind].to}
	);
	flex: 0 0 auto;
	box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.15);
`
const FileFold = styled.span`
	position: absolute;
	top: 0;
	right: 0;
	width: 14px;
	height: 14px;
	background:
		linear-gradient(
			225deg,
			rgba(255, 255, 255, 0.5) 0%,
			rgba(255, 255, 255, 0.5) 50%,
			rgba(0, 0, 0, 0.08) 50%,
			rgba(0, 0, 0, 0.08) 100%
		);
	border-radius: 0 6px 0 4px;
`
const FileExt = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 1px;
	color: #ffffff;
`
const FileBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`
const FileName = styled.div`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14.5px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.2px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const FileStatus = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
`
const UploadingLabel = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
`
const FileStatusText = styled.span<{ $tone?: 'done' | 'upload' }>`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 12.5px;
	font-weight: ${(p) => (p.$tone ? 600 : 500)};
	color: ${(p) =>
		p.$tone === 'done'
			? '#16a34a'
			: p.$tone === 'upload'
				? '#6366f1'
				: '#64748b'};
`
const StatusDot = styled.span`
	width: 3px;
	height: 3px;
	border-radius: 50%;
	background: #cbd5e1;
`
const indeterminateSlide = keyframes`
	0%   { transform: translateX(-100%); }
	100% { transform: translateX(400%); }
`
const ProgressTrack = styled.div`
	position: relative;
	height: 4px;
	border-radius: 999px;
	background: rgba(99, 102, 241, 0.14);
	overflow: hidden;
	margin-top: 4px;
`
const ProgressTrackBar = styled.span`
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	width: 30%;
	border-radius: 999px;
	background: linear-gradient(90deg, #818cf8, #6366f1);
	animation: ${indeterminateSlide} 1.3s ease-in-out infinite;
`
const CardActions = styled.div`
	display: inline-flex;
	gap: 18px;
	padding: 0 8px;
`

/* Numbered big-text action button with vertical label swap on hover.
 * Mirrors the FileManager page style. "01 Download" / "02 Delete";
 * on hover each label slides up and is replaced by its own copy
 * (pre-coloured to the hover tint) in a slot-machine beat. */
const ActBig = styled.button<{ $danger?: boolean }>`
	border: none;
	background: transparent;
	padding: 0;
	cursor: pointer;
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
	transition: transform 200ms cubic-bezier(0.22, 1.35, 0.36, 1);

	&:disabled { cursor: not-allowed; opacity: 0.5; }

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.num {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 1.6px;
		color: ${({ $danger }) => ($danger ? '#dc2626' : '#94a3b8')};
		transition: color 180ms ease, letter-spacing 320ms ease;
	}

	.lbl-track {
		display: block;
		height: 1em;
		line-height: 1;
		overflow: hidden;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 15px;
		font-weight: 700;
		letter-spacing: -0.2px;
	}

	.lbl-row {
		display: block;
		line-height: 1;
		transform: translateY(0);
		transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
		color: ${({ $danger }) => ($danger ? '#b91c1c' : '#334155')};
	}
	.lbl-row + .lbl-row {
		color: ${({ $danger }) => ($danger ? '#dc2626' : '#0f172a')};
	}

	&:hover:not(:disabled) {
		transform: translateX(2px);
	}
	&:hover:not(:disabled) .lbl-row {
		transform: translateY(-1em);
	}
	&:hover:not(:disabled) .num {
		color: ${({ $danger }) => ($danger ? '#991b1b' : '#64748b')};
		letter-spacing: 2.2px;
	}
`
const DownloadBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	flex: 0 0 36px;
	width: 36px;
	min-width: 36px;
	max-width: 36px;
	height: 36px;
	min-height: 36px;
	max-height: 36px;
	aspect-ratio: 1 / 1;
	padding: 0;
	margin: 0;
	line-height: 0;
	appearance: none;
	-webkit-appearance: none;
	border: none;
	border-radius: 50%;
	background: rgba(15, 23, 42, 0.05);
	color: #475569;
	cursor: pointer;
	transition:
		background 140ms ease,
		color 140ms ease;
	&:hover:not(:disabled) {
		background: rgba(3, 105, 161, 0.12);
		color: rgba(3, 105, 161, 1);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`
const CloseBtn = styled.button<{ $danger?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	flex: 0 0 36px;
	width: 36px;
	min-width: 36px;
	max-width: 36px;
	height: 36px;
	min-height: 36px;
	max-height: 36px;
	aspect-ratio: 1 / 1;
	padding: 0;
	margin: 0;
	line-height: 0;
	appearance: none;
	-webkit-appearance: none;
	border: none;
	border-radius: 50%;
	background: ${(p) =>
		p.$danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.05)'};
	color: ${(p) => (p.$danger ? '#dc2626' : '#64748b')};
	cursor: pointer;
	transition:
		background 140ms ease,
		color 140ms ease;
	&:hover:not(:disabled) {
		background: ${(p) =>
			p.$danger ? 'rgba(239, 68, 68, 0.18)' : 'rgba(15, 23, 42, 0.1)'};
		color: ${(p) => (p.$danger ? '#b91c1c' : '#0f172a')};
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const AddMoreBtn = styled.button`
	align-self: flex-start;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 10px;
	border: 1.5px dashed rgba(3, 105, 161, 0.35);
	background: transparent;
	color: rgba(3, 105, 161, 1);
	font-family: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition: border-color 160ms ease;
	&:hover {
		border-color: rgba(3, 105, 161, 0.6);
	}
`

