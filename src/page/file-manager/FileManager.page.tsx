import {
	DragEvent,
	Fragment,
	cloneElement,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type ReactElement,
	type ReactNode,
} from 'react'
import { createPortal, flushSync } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import styled, { css, keyframes } from 'styled-components'
import {
	FolderOutlined,
	FolderRounded,
	AddRounded,
	CloudUploadOutlined,
	ArrowBackIosNewRounded,
	DriveFileRenameOutlineOutlined,
	DownloadRounded,
	DeleteOutlineRounded,
	PeopleOutlineRounded,
	HomeOutlined,
	ChevronRightRounded,
	KeyboardArrowDownRounded,
	CloseRounded,
	DriveFileMoveOutlined,
} from '@mui/icons-material'

import { useGetMeQuery } from '../../store/auth/authApi'
import axiosInstance from '../../api/axiosInstance'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import { useToast } from '../../context/toast/ToastContext'
import { FilePreview } from './FilePreview'
import { ShareModal } from './ShareModal'
import { UploadModal } from './UploadModal'
import { enqueueUploads } from './uploadQueueStore'
import { Folder3D } from '../../components/file-manager/Folder3D'
import {
	type FileManagerFile,
	type FileManagerFolder,
	type FileManagerTreeNode,
	useCreateFolderMutation,
	useDeleteFileMutation,
	useDeleteFolderMutation,
	useBulkDeleteMutation,
	useBulkMoveMutation,
	useGetStatsQuery,
	useGetTreeQuery,
	useLazyGetFileDownloadUrlQuery,
	useLazyGetFilePreviewUrlQuery,
	useListFolderQuery,
	useRenameFileMutation,
	useRenameFolderMutation,
} from '../../store/file-manager/fileManagerApi'

type CtxMenuItem = {
	label: string
	icon: ReactNode
	onClick: () => void
	danger?: boolean
}

/** Right-click context menu portalled to <body> so it can escape any
 *  overflow:hidden ancestor. Soft fade+scale in; closes on outside
 *  click, Escape, or any menu item click. Position is clamped to the
 *  viewport so a menu at the edge of the screen stays fully visible. */
const ContextMenu = ({
	x,
	y,
	items,
	onClose,
}: {
	x: number
	y: number
	items: CtxMenuItem[]
	onClose: () => void
}) => {
	const [closing, setClosing] = useState(false)
	const [pos, setPos] = useState({ left: x, top: y })
	const rootRef = useRef<HTMLDivElement | null>(null)

	const close = () => {
		if (closing) return
		setClosing(true)
		window.setTimeout(onClose, 140)
	}

	useLayoutEffect(() => {
		const el = rootRef.current
		if (!el) return
		const r = el.getBoundingClientRect()
		const vw = window.innerWidth
		const vh = window.innerHeight
		const pad = 8
		const left = Math.min(x, vw - r.width - pad)
		const top = Math.min(y, vh - r.height - pad)
		setPos({ left: Math.max(pad, left), top: Math.max(pad, top) })
	}, [x, y])

	useEffect(() => {
		const onDown = (e: MouseEvent) => {
			if (rootRef.current?.contains(e.target as Node)) return
			close()
		}
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close()
		}
		const onScroll = () => close()
		window.addEventListener('mousedown', onDown)
		window.addEventListener('contextmenu', onDown)
		window.addEventListener('keydown', onEsc)
		window.addEventListener('scroll', onScroll, true)
		return () => {
			window.removeEventListener('mousedown', onDown)
			window.removeEventListener('contextmenu', onDown)
			window.removeEventListener('keydown', onEsc)
			window.removeEventListener('scroll', onScroll, true)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return createPortal(
		<CtxRoot
			ref={rootRef}
			style={{ left: pos.left, top: pos.top }}
			$closing={closing}
			onContextMenu={(e) => e.preventDefault()}
		>
			{items.map((it) => (
				<CtxItem
					key={it.label}
					type='button'
					$danger={!!it.danger}
					onClick={() => {
						it.onClick()
						close()
					}}
				>
					<span className='ctx-icon'>{it.icon}</span>
					<span>{it.label}</span>
				</CtxItem>
			))}
		</CtxRoot>,
		document.body,
	)
}

type Filter = 'all' | 'images' | 'docs' | 'videos' | 'audio' | 'archives' | 'other'

const fmtBytes = (n: number) => {
	if (n < 1024) return `${n} B`
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
	if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
	return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const kindOf = (mime: string, name: string): Filter => {
	const m = mime.toLowerCase()
	const ext = name.split('.').pop()?.toLowerCase() ?? ''
	if (m.startsWith('image/')) return 'images'
	if (m.startsWith('video/')) return 'videos'
	if (m.startsWith('audio/')) return 'audio'
	if (/pdf|word|excel|spreadsheet|presentation|document|text/.test(m)) return 'docs'
	if (/zip|tar|rar|7z|gzip|archive/.test(m)) return 'archives'
	if (['zip', '7z', 'rar', 'tar', 'gz'].includes(ext)) return 'archives'
	if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext)) return 'docs'
	return 'other'
}

/** Lightweight tooltip for the sidebar tree. Portalled to <body>
 *  with position:fixed so it escapes every overflow:hidden ancestor
 *  and always paints on top of the UI. Opens 300ms after hover,
 *  fades out instantly on leave. Position is recomputed on scroll
 *  to track the row. */
const TreeTooltip = ({
	label,
	children,
}: {
	label: string
	children: ReactElement<{
		ref?: React.Ref<HTMLDivElement>
		onMouseEnter?: (e: React.MouseEvent) => void
		onMouseLeave?: (e: React.MouseEvent) => void
	}>
}) => {
	const [open, setOpen] = useState(false)
	const [closing, setClosing] = useState(false)
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
	const anchorRef = useRef<HTMLDivElement | null>(null)
	const openTimerRef = useRef<number | null>(null)
	const closeTimerRef = useRef<number | null>(null)

	const place = () => {
		const el = anchorRef.current
		if (!el) return
		const r = el.getBoundingClientRect()
		setPos({ top: r.bottom + 6, left: r.left + 10 })
	}

	useEffect(() => {
		if (!open) return
		place()
		const onScroll = () => place()
		window.addEventListener('scroll', onScroll, true)
		window.addEventListener('resize', onScroll)
		return () => {
			window.removeEventListener('scroll', onScroll, true)
			window.removeEventListener('resize', onScroll)
		}
	}, [open])

	/* Only show the tooltip when the label is actually truncated —
	 * if the full name fits in the visible area, a redundant tooltip
	 * is noise. Checks the first `[data-truncate]` descendant of the
	 * anchor (TreeName gets that attribute) and compares scrollWidth
	 * to clientWidth. */
	const isTruncated = () => {
		const el = anchorRef.current?.querySelector<HTMLElement>('[data-truncate]')
		if (!el) return false
		return el.scrollWidth > el.clientWidth + 1
	}

	/* Debounced open — the tooltip only appears if the cursor stays
	 * still for ~1s. Long enough that casual browsing (hovering
	 * rows while deciding where to click) never triggers it; short
	 * enough that an intentional pause reliably surfaces the name. */
	const DWELL_MS = 1000

	const rearm = () => {
		if (closeTimerRef.current) {
			window.clearTimeout(closeTimerRef.current)
			closeTimerRef.current = null
		}
		if (open) {
			setClosing(false)
			return
		}
		if (!isTruncated()) return
		if (openTimerRef.current) window.clearTimeout(openTimerRef.current)
		openTimerRef.current = window.setTimeout(() => {
			setClosing(false)
			setOpen(true)
		}, DWELL_MS)
	}

	const show = () => rearm()

	const hide = () => {
		if (openTimerRef.current) {
			window.clearTimeout(openTimerRef.current)
			openTimerRef.current = null
		}
		if (!open) return
		setClosing(true)
		closeTimerRef.current = window.setTimeout(() => {
			setOpen(false)
			setClosing(false)
			setPos(null)
			closeTimerRef.current = null
		}, 160)
	}

	const clone = cloneElement(
		children as ReactElement<{
			ref?: React.Ref<HTMLDivElement>
			onMouseEnter?: (e: React.MouseEvent) => void
			onMouseLeave?: (e: React.MouseEvent) => void
			onMouseMove?: (e: React.MouseEvent) => void
		}>,
		{
			ref: (node: HTMLDivElement) => {
				anchorRef.current = node
			},
			onMouseEnter: (e: React.MouseEvent) => {
				show()
				children.props.onMouseEnter?.(e)
			},
			onMouseMove: (e: React.MouseEvent) => {
				/* While the cursor is still moving inside the row, keep
				 * resetting the dwell timer — tooltip only fires once
				 * the cursor sits still for DWELL_MS. */
				rearm()
				;(children.props as { onMouseMove?: (e: React.MouseEvent) => void })
					.onMouseMove?.(e)
			},
			onMouseLeave: (e: React.MouseEvent) => {
				hide()
				children.props.onMouseLeave?.(e)
			},
		},
	)

	return (
		<>
			{clone}
			{open && pos
				? createPortal(
						<TreeTooltipPop
							$closing={closing}
							style={{ top: pos.top, left: pos.left }}
						>
							{label}
						</TreeTooltipPop>,
						document.body,
					)
				: null}
		</>
	)
}

/** Recursive sidebar branch — a row + its collapsible children.
 *  Toggle state is local so expand/collapse never fires a re-render
 *  of unrelated branches. Children render inside a height-animated
 *  wrapper so expand/collapse glides open instead of popping. */
const TreeBranch = ({
	node,
	depth,
	activeId,
	onPick,
}: {
	node: FileManagerTreeNode
	depth: number
	activeId: string | null
	onPick: (id: string) => void
}) => {
	const [open, setOpen] = useState(depth === 1)
	const hasChildren = node.children.length > 0
	const childrenRef = useRef<HTMLDivElement | null>(null)

	/* Height animation on expand/collapse — identical pattern to
	 * NavGroup: snap to measured scrollHeight, let CSS transition
	 * do the rest, then release to `auto` so inner changes don't
	 * get clipped. Supports arbitrary nesting depth; the horizontal
	 * scroll on the parent handles cases where a path is too long
	 * to fit the sidebar width. */
	useEffect(() => {
		const el = childrenRef.current
		if (!el) return
		const target = el.scrollHeight
		if (open) {
			el.style.height = '0px'
			requestAnimationFrame(() => {
				el.style.height = `${target}px`
			})
			const onEnd = (e: TransitionEvent) => {
				if (e.propertyName !== 'height') return
				el.style.height = 'auto'
				el.removeEventListener('transitionend', onEnd)
			}
			el.addEventListener('transitionend', onEnd)
			return () => el.removeEventListener('transitionend', onEnd)
		}
		el.style.height = `${el.scrollHeight}px`
		requestAnimationFrame(() => {
			el.style.height = '0px'
		})
	}, [open])

	return (
		<>
			<TreeTooltip label={node.name}>
			<TreeRow
				$active={activeId === node.id}
				$depth={depth}
				onClick={() => onPick(node.id)}
			>
				<TreeTwist
					$open={open}
					onClick={(e: React.MouseEvent) => {
						e.stopPropagation()
						if (hasChildren) setOpen(!open)
					}}
					$visible={hasChildren}
				>
					<ChevronRightRounded style={{ fontSize: 16 }} />
				</TreeTwist>
				<FolderRounded style={{ fontSize: 16, color: '#64748b', flexShrink: 0 }} />
				<TreeName data-truncate>{node.name}</TreeName>
				{node.fileCount > 0 && <TreeCount>{node.fileCount}</TreeCount>}
			</TreeRow>
			</TreeTooltip>
			<TreeChildren ref={childrenRef}>
				{node.children.map((child) => (
					<TreeBranch
						key={child.id}
						node={child}
						depth={depth + 1}
						activeId={activeId}
						onPick={onPick}
					/>
				))}
			</TreeChildren>
		</>
	)
}

/* ─── File-row actions ──────────────────────────────────────────── */

const FileActions = ({
	onDownload,
	onDelete,
	showDelete = true,
}: {
	onDownload: () => void
	onDelete: () => void
	/** Hide the inline Delete pill. Portal workers pass false for
	 *  any row that isn't their own upload — the context-menu
	 *  Delete already honours the same rule, and the inline button
	 *  was slipping past both checks until now. */
	showDelete?: boolean
}) => (
	<ActBigWrap>
		<ActBig type='button' onClick={onDownload}>
			<span className='num'>01</span>
			<span className='lbl-track' aria-hidden='true'>
				<span className='lbl-row'>Download</span>
				<span className='lbl-row'>Download</span>
			</span>
			<span className='sr-only'>Download</span>
		</ActBig>
		{showDelete && (
			<ActBig type='button' $danger onClick={onDelete}>
				<span className='num'>02</span>
				<span className='lbl-track' aria-hidden='true'>
					<span className='lbl-row'>Delete</span>
					<span className='lbl-row'>Delete</span>
				</span>
				<span className='sr-only'>Delete</span>
			</ActBig>
		)}
	</ActBigWrap>
)

/* ─── File-row (attachment-style) helpers ────────────────────────── */

/** True when the FilePreview component would use a JS fetch() to
 *  parse the file bytes (docx-preview, xlsx, marked, highlight.js).
 *  Those fail against B2 presigned URLs due to CORS, so the preview
 *  flow routes them through the backend `/content` proxy and wraps
 *  the result as a same-origin blob URL. Everything else — image,
 *  pdf, text (iframe), video, audio — uses the signed URL directly
 *  via native tags where CORS does not apply. */
const PROXY_CODE_EXTS = new Set([
	'json', 'xml', 'yaml', 'yml', 'js', 'ts', 'tsx', 'jsx', 'css', 'scss',
	'less', 'html', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'sh', 'bash',
	'sql', 'php', 'swift', 'c', 'cpp', 'cs',
])
const previewNeedsBackendProxy = (mime: string, name: string): boolean => {
	const dot = name.lastIndexOf('.')
	const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
	if (
		ext === 'docx' || ext === 'doc' ||
		mime.includes('wordprocessingml') || mime === 'application/msword'
	) return true
	if (
		ext === 'xlsx' || ext === 'xls' ||
		mime.includes('spreadsheetml') || mime === 'application/vnd.ms-excel'
	) return true
	if (ext === 'md' || ext === 'markdown' || mime === 'text/markdown') return true
	if (PROXY_CODE_EXTS.has(ext)) return true
	return false
}

type MimeKind = 'pdf' | 'image' | 'doc' | 'other'

const mimeKind = (mime: string): MimeKind => {
	if (/pdf/i.test(mime)) return 'pdf'
	if (/^image\//i.test(mime)) return 'image'
	if (/word|document|msword|sheet|excel|csv|presentation|powerpoint/i.test(mime))
		return 'doc'
	return 'other'
}

/** Uppercase file extension, capped at 4 chars. */
const getExt = (name: string): string => {
	const dot = name.lastIndexOf('.')
	if (dot < 0 || dot === name.length - 1) return 'FILE'
	return name.slice(dot + 1, dot + 5).toUpperCase()
}

const formatAttachDate = (iso: string): string =>
	new Date(iso).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})

/* Recursively count every folder in the tree so the Storage hero
 * can show both "N files" and "M folders" at a glance. */
const countAllFolders = (nodes?: FileManagerTreeNode[]): number => {
	if (!nodes) return 0
	return nodes.reduce((acc, n) => acc + 1 + countAllFolders(n.children), 0)
}

const FILTERS: Array<{ v: Filter; label: string }> = [
	{ v: 'all', label: 'All files' },
	{ v: 'images', label: 'Images' },
	{ v: 'docs', label: 'Docs' },
	{ v: 'videos', label: 'Videos' },
	{ v: 'audio', label: 'Audio' },
	{ v: 'archives', label: 'Archives' },
	{ v: 'other', label: 'Other' },
]

const FileManagerPage = () => {
	const navigate = useNavigate()
	/* Portal workers see a stripped-down header — no storage usage,
	 * file / folder counts. One source of truth for the check. */
	const isPortalHost =
		typeof window !== 'undefined' &&
		window.location.hostname.toLowerCase().startsWith('files.')
	const { showToast } = useToast()
	const { folderId: paramFolderId } = useParams<{ folderId?: string }>()
	const folderId = paramFolderId ?? null

	const { data, isLoading, isError, refetch } = useListFolderQuery(folderId)
	/* Portal workers need their own user id to decide which rows get
	 *  a Delete affordance. Ownership only — no time window; the UI
	 *  check mirrors the backend check 1-to-1 so a visible Delete
	 *  button is a Delete button that works. */
	const { data: me } = useGetMeQuery()
	const myId = me?.id ?? null
	const canPortalDeleteFolder = (f: FileManagerFolder) =>
		isPortalHost && !!myId && f.createdById === myId
	const canPortalDeleteFile = (f: FileManagerFile) =>
		isPortalHost && !!myId && f.uploadedBy?.id === myId
	const { data: treeData } = useGetTreeQuery()
	const { data: stats } = useGetStatsQuery()
	const [createFolder, { isLoading: creatingFolder }] = useCreateFolderMutation()
	/* Legacy single-shot upload is still exported from fileManagerApi
	 * for ad-hoc callers, but FileManager page now routes every upload
	 * through the resumable chunked path (enqueueUploads below). */
	const [deleteFolder] = useDeleteFolderMutation()
	const [bulkDelete, { isLoading: isBulkDeleting }] = useBulkDeleteMutation()
	const [bulkMove, { isLoading: isBulkMoving }] = useBulkMoveMutation()
	const [deleteFile] = useDeleteFileMutation()
	const [renameFolder] = useRenameFolderMutation()
	const [renameFile] = useRenameFileMutation()
	const [getDownloadUrl] = useLazyGetFileDownloadUrlQuery()
	const [getPreviewUrl] = useLazyGetFilePreviewUrlQuery()

	const [filter, setFilter] = useState<Filter>('all')
	const [uploadModalOpen, setUploadModalOpen] = useState(false)
	const closeNewFolder = () => {
		setNewFolderOpen(false)
		setNewFolderName('')
	}
	const filtersRef = useRef<HTMLDivElement | null>(null)
	const filesSectionRef = useRef<HTMLElement | null>(null)
	const lastFilesTopRef = useRef<number | null>(null)
	const [filterIndicator, setFilterIndicator] = useState<{
		left: number
		width: number
		opacity: number
	}>({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		if (!filtersRef.current) return
		const active = filtersRef.current.querySelector<HTMLButtonElement>(
			'[data-active="true"]',
		)
		if (active) {
			setFilterIndicator({
				left: active.offsetLeft,
				width: active.offsetWidth,
				opacity: 1,
			})
		}
	}, [filter])

	/* FLIP animation for the FilterRow when the viewport changes
	 * width enough to push it from the same line as breadcrumbs to a
	 * new line (or back). CSS can't animate flex-wrap position
	 * jumps on its own; we measure the row's position via
	 * ResizeObserver on the parent toolbar, apply an inverse
	 * translate instantly on jump, then transition back to 0 so the
	 * element appears to glide to its new slot. */
	useEffect(() => {
		const el = filtersRef.current
		if (!el) return
		const toolbar = el.parentElement
		if (!toolbar) return
		let lastTop = el.offsetTop
		let lastLeft = el.offsetLeft
		let frame: number | null = null
		const measure = () => {
			const target = filtersRef.current
			if (!target) return
			const newTop = target.offsetTop
			const newLeft = target.offsetLeft
			const dy = lastTop - newTop
			const dx = lastLeft - newLeft
			if (dy !== 0 || dx !== 0) {
				target.style.transition = 'none'
				target.style.transform = `translate(${dx}px, ${dy}px)`
				if (frame) cancelAnimationFrame(frame)
				frame = requestAnimationFrame(() => {
					target.style.transition =
						'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)'
					target.style.transform = 'translate(0, 0)'
				})
			}
			lastTop = newTop
			lastLeft = newLeft
		}
		const ro = new ResizeObserver(measure)
		ro.observe(toolbar)
		return () => {
			ro.disconnect()
			if (frame) cancelAnimationFrame(frame)
		}
	}, [])
	const [openingFolderId, setOpeningFolderId] = useState<string | null>(null)
	const [newFolderOpen, setNewFolderOpen] = useState(false)
	/* Multi-select — bulk delete / move. Set holds ids regardless of
	 *  type (uuid is unique across folders+files). lastClickType +
	 *  lastClickId are the shift-click anchor. */
	const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())
	const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
	const [lastClick, setLastClick] = useState<
		{ kind: 'folder' | 'file'; id: string } | null
	>(null)
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
	const [moveModalOpen, setMoveModalOpen] = useState(false)
	const [moveModalClosing, setMoveModalClosing] = useState(false)
	/* Ids currently playing their exit animation. The card renders
	 *  with $deleting styles (opacity 0 + scale 0.9) and only after
	 *  the 280 ms transition we fire the actual bulkDelete API +
	 *  tag invalidation — so the list collapses smoothly instead of
	 *  pop-dropping rows. */
	const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set())
	/* Items optimistically removed from the rendered listing after
	 *  the 320 ms exit animation finished — set inside a View
	 *  Transition so the browser smoothly animates sibling cells
	 *  reflowing into the freed slot (grid-template-columns with
	 *  minmax(160px, 1fr) can't shrink a slot via max-width, so
	 *  without this the neighbours still snapped). Cleaned up when
	 *  the refetched data arrives without the id, same as
	 *  pendingDeleteIds. */
	const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
	/* Garbage-collect ids that no longer exist in the listing — they
	 *  belong to rows the refetch already unmounted. Keeps both sets
	 *  from growing unboundedly across a long session. */
	useEffect(() => {
		if ((pendingDeleteIds.size === 0 && hiddenIds.size === 0) || !data) return
		const live = new Set<string>([
			...data.folders.map((x) => x.id),
			...data.files.map((x) => x.id),
		])
		const stalePending = Array.from(pendingDeleteIds).filter((id) => !live.has(id))
		const staleHidden = Array.from(hiddenIds).filter((id) => !live.has(id))
		if (stalePending.length) {
			setPendingDeleteIds((prev) => {
				const next = new Set(prev)
				for (const id of stalePending) next.delete(id)
				return next
			})
		}
		if (staleHidden.length) {
			setHiddenIds((prev) => {
				const next = new Set(prev)
				for (const id of staleHidden) next.delete(id)
				return next
			})
		}
	}, [data, pendingDeleteIds, hiddenIds])

	/* Helper: optimistically hide an id inside a View Transition.
	 *  Tags EVERY grid card (folders + files) with its own
	 *  view-transition-name right before the VT fires, so the browser
	 *  gives each one its own position-morph animation. Siblings
	 *  thus glide smoothly into the freed slot instead of either
	 *  shimmering (default root crossfade) or snapping (with the
	 *  index.css root-anim override). Names are stripped in
	 *  `.finished.finally` so the next unrelated VT doesn't see
	 *  stale participants. */
	const hideWithTransition = (id: string) => {
		const canVT =
			typeof document !== 'undefined' &&
			typeof (document as unknown as { startViewTransition?: unknown })
				.startViewTransition === 'function'
		if (!canVT) {
			setHiddenIds((s) => new Set([...s, id]))
			return
		}
		const tagAll = () => {
			document
				.querySelectorAll<HTMLElement>('[data-fm-folder], [data-fm-file]')
				.forEach((el) => {
					const folderId = el.getAttribute('data-fm-folder')
					const fileId = el.getAttribute('data-fm-file')
					const kind = folderId ? 'folder' : 'file'
					const raw = folderId ?? fileId ?? ''
					if (!raw) return
					el.style.setProperty(
						'view-transition-name',
						`fm-${kind}-${raw.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
					)
				})
		}
		const cleanAll = () => {
			document
				.querySelectorAll<HTMLElement>('[data-fm-folder], [data-fm-file]')
				.forEach((el) => el.style.removeProperty('view-transition-name'))
		}
		tagAll()
		;(
			document as unknown as {
				startViewTransition: (cb: () => void) => {
					finished: Promise<void>
				}
			}
		)
			.startViewTransition(() => {
				flushSync(() => setHiddenIds((s) => new Set([...s, id])))
				/* Re-tag because the hiddenIds filter removed the
				 *  leaving card from the render pass — the remaining
				 *  cards may have new DOM nodes (grid reflow is
				 *  layout-only, same nodes typically, but tag anyway
				 *  so new neighbours in the destination position are
				 *  covered). */
				tagAll()
			})
			.finished.finally(cleanAll)
	}
	const closeMoveModal = () => {
		/* Trigger ConfirmModal's exit animation first, then unmount
		 *  after the 240 ms close transition settles. */
		setMoveModalClosing(true)
		window.setTimeout(() => {
			setMoveModalOpen(false)
			setMoveModalClosing(false)
		}, 260)
	}
	const [newFolderName, setNewFolderName] = useState('')
	const [toDeleteFolder, setToDeleteFolder] = useState<FileManagerFolder | null>(null)
	const [toDeleteFile, setToDeleteFile] = useState<FileManagerFile | null>(null)
	const [shareTarget, setShareTarget] = useState<{
		resourceType: 'FOLDER' | 'FILE'
		resourceId: string
		resourceName: string
	} | null>(null)
	const [preview, setPreview] = useState<{
		url: string
		name: string
		mime: string
		/** Set when `url` is a blob URL built from a backend-proxied
		 *  fetch — must be URL.revokeObjectURL'd on close/replace. */
		revoke?: boolean
	} | null>(null)
	const [ctxMenu, setCtxMenu] = useState<
		{ x: number; y: number; items: CtxMenuItem[] } | null
	>(null)
	const [renameTarget, setRenameTarget] = useState<
		| { kind: 'folder'; folder: FileManagerFolder }
		| { kind: 'file'; file: FileManagerFile }
		| null
	>(null)
	const [renameValue, setRenameValue] = useState('')
	const closeRename = () => {
		setRenameTarget(null)
		setRenameValue('')
	}
	const [dragging, setDragging] = useState(false)
	const dropRef = useRef<HTMLDivElement | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const filteredFiles = useMemo(() => {
		const files = (data?.files ?? []).filter((f) => !hiddenIds.has(f.id))
		if (filter === 'all') return files
		return files.filter((f) => kindOf(f.mimeType, f.originalName) === filter)
	}, [data?.files, filter, hiddenIds])
	const visibleFolders = useMemo(
		() => (data?.folders ?? []).filter((f) => !hiddenIds.has(f.id)),
		[data?.folders, hiddenIds],
	)

	/* ── Selection helpers ─────────────────────────────────────── */
	const selectionCount = selectedFolderIds.size + selectedFileIds.size
	/* For portal workers, Delete only applies to rows they created
	 *  within the 24 h window. Hiding the BulkBar Delete button when
	 *  any selected item fails that check means no "pressed Delete,
	 *  got silent skip" surprise. */
	const canBulkDeleteSelection = (() => {
		if (!isPortalHost) return true
		if (selectionCount === 0) return false
		const folderMap = new Map((data?.folders ?? []).map((f) => [f.id, f]))
		const fileMap = new Map((data?.files ?? []).map((f) => [f.id, f]))
		for (const id of selectedFolderIds) {
			const f = folderMap.get(id)
			if (!f || !canPortalDeleteFolder(f)) return false
		}
		for (const id of selectedFileIds) {
			const f = fileMap.get(id)
			if (!f || !canPortalDeleteFile(f)) return false
		}
		return true
	})()
	const clearSelection = () => {
		setSelectedFolderIds(new Set())
		setSelectedFileIds(new Set())
		setLastClick(null)
	}
	const toggleId = (set: Set<string>, id: string): Set<string> => {
		const next = new Set(set)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		return next
	}
	const handleItemClick = (
		kind: 'folder' | 'file',
		id: string,
		e: React.MouseEvent,
	) => {
		if (e.metaKey || e.ctrlKey) {
			if (kind === 'folder') setSelectedFolderIds((s) => toggleId(s, id))
			else setSelectedFileIds((s) => toggleId(s, id))
			setLastClick({ kind, id })
			return 'selected'
		}
		if (e.shiftKey && lastClick) {
			/* Range select — collect ids between anchor and current in
			 * the visible [folders..., files...] sequence. */
			const folderIds = (data?.folders ?? []).map((f) => f.id)
			const fileIds = filteredFiles.map((f) => f.id)
			const flat = [
				...folderIds.map((fid) => ({ kind: 'folder' as const, id: fid })),
				...fileIds.map((fid) => ({ kind: 'file' as const, id: fid })),
			]
			const a = flat.findIndex(
				(x) => x.kind === lastClick.kind && x.id === lastClick.id,
			)
			const b = flat.findIndex((x) => x.kind === kind && x.id === id)
			if (a >= 0 && b >= 0) {
				const [lo, hi] = a < b ? [a, b] : [b, a]
				const nextFolders = new Set(selectedFolderIds)
				const nextFiles = new Set(selectedFileIds)
				for (let i = lo; i <= hi; i++) {
					if (flat[i].kind === 'folder') nextFolders.add(flat[i].id)
					else nextFiles.add(flat[i].id)
				}
				setSelectedFolderIds(nextFolders)
				setSelectedFileIds(nextFiles)
				return 'selected'
			}
		}
		if (selectionCount > 0) {
			/* Plain click with an active selection = clear selection
			 * AND treat the click as the open action. */
			clearSelection()
		}
		return 'passthrough'
	}

	const openFolder = (id: string) => {
		/* Snap-pulse the clicked folder (scale + glow ring via the
		 * `$opening` prop on FolderCard) and navigate quickly —
		 * long pre-open animations read as "folder disappeared";
		 * a short beat + fast nav feels responsive. */
		setOpeningFolderId(id)
		window.setTimeout(() => {
			navigate(`/file-manager/folder/${id}`)
		}, 180)
	}

	/* Reset the "opening" overlay whenever we land on a new folder —
	 * otherwise the clicked-folder id lingers and all siblings in
	 * the newly-rendered folder stay dimmed (blur + desaturate). */
	useEffect(() => {
		setOpeningFolderId(null)
	}, [folderId])

	const handleCreateFolder = async () => {
		const name = newFolderName.trim()
		if (!name) return
		try {
			await createFolder({ name, parentId: folderId }).unwrap()
			closeNewFolder()
			showToast(`Folder "${name}" created`, 'success')
		} catch (err) {
			const msg =
				(err as { data?: { message?: string } })?.data?.message ??
				'Failed to create folder'
			showToast(msg, 'error')
		}
	}

	const handleUpload = (files: FileList | File[]) => {
		/* All uploads go through the resumable chunked path now
		 * (uploadQueueStore -> B2 large-file multipart). Progress,
		 * pause/resume, retry, interrupted-recovery and persistence
		 * are tray-side; this call just enqueues. */
		enqueueUploads(Array.from(files), folderId)
	}

	const onDragEnter = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragging(true)
	}
	const onDragLeave = (e: DragEvent) => {
		if (e.target !== dropRef.current) return
		setDragging(false)
	}
	const onDragOver = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}
	const onDrop = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragging(false)
		/* Portal workers on the root view can't upload to root — bail
		 *  silently rather than firing an unavoidable 403. Inside a
		 *  shared folder the drop proceeds normally. */
		if (isPortalHost && folderId === null) return
		if (e.dataTransfer?.files?.length) {
			void handleUpload(e.dataTransfer.files)
		}
	}

	const handleDownload = async (file: FileManagerFile) => {
		try {
			const { url } = await getDownloadUrl(file.id).unwrap()
			const a = document.createElement('a')
			a.href = url
			a.download = file.originalName
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
		} catch {
			showToast('Could not generate download link', 'error')
		}
	}

	/* Preview everything — the <FilePreview> component dispatches to a
	 * viewer by mime (image/pdf/video/audio/docx/xlsx/md/text/code) or
	 * falls back to a Download CTA for genuinely non-previewable types
	 * (pptx, archives, binaries). */
	const [previewFile, setPreviewFile] = useState<FileManagerFile | null>(null)
	const [previewClosing, setPreviewClosing] = useState(false)
	const closePreview = () => {
		if (previewClosing) return
		setPreviewClosing(true)
		/* Mirrors the credentials RevealDrawer timing: body collapses
		 * first (320ms), panel scales out with a 320ms delay, scrim
		 * fades last. 720ms total before unmount. */
		window.setTimeout(() => {
			if (preview?.revoke) URL.revokeObjectURL(preview.url)
			setPreview(null)
			setPreviewFile(null)
			setPreviewClosing(false)
		}, 720)
	}
	const openPreview = async (file: FileManagerFile) => {
		try {
			/* Proxy only the renderers that actually do a cross-origin
			 *  JS fetch of the file bytes — docx-preview, xlsx-library,
			 *  marked, highlight.js. Native tags (<img>, <iframe> for
			 *  PDF, <video>, <audio>) load B2 URLs fine, no CORS, so
			 *  leave those alone. Plain text uses an iframe too (see
			 *  FilePreview `kind === 'text'`). */
			if (previewNeedsBackendProxy(file.mimeType, file.originalName)) {
				const res = await axiosInstance.get(
					`/file-manager/files/${file.id}/content`,
					{ responseType: 'blob' },
				)
				const blobUrl = URL.createObjectURL(res.data as Blob)
				setPreview({
					url: blobUrl,
					name: file.originalName,
					mime: file.mimeType,
					revoke: true,
				})
			} else {
				const { url, mimeType } = await getPreviewUrl(file.id).unwrap()
				setPreview({
					url,
					name: file.originalName,
					mime: mimeType ?? file.mimeType,
				})
			}
			setPreviewFile(file)
		} catch (e) {
			/* Surface what actually failed so a 404 (backend not
			 *  deployed), 403 (portal access denied) and a 500
			 *  (storage error) each read differently in the toast. */
			const err = e as {
				response?: { status?: number; data?: { message?: string } }
				message?: string
			}
			const status = err?.response?.status
			const serverMsg = err?.response?.data?.message
			const msg =
				serverMsg ??
				(status
					? `Preview failed (${status})`
					: (err?.message ?? 'Could not open preview'))
			showToast(msg, 'error')
		}
	}

	const openFolderCtx = (e: React.MouseEvent, f: FileManagerFolder) => {
		e.preventDefault()
		e.stopPropagation()
		/* Portal workers see a stripped menu. Base is empty (no Share /
		 *  Rename / Move — all 403 on the backend). Delete is added
		 *  only when the row is their own and within the 24 h window;
		 *  mirrors the backend ownership check so there's no silent
		 *  skip surprise. */
		const items = isPortalHost
			? canPortalDeleteFolder(f)
				? [
						{
							label: 'Delete',
							icon: <DeleteOutlineRounded style={{ fontSize: 16 }} />,
							danger: true,
							onClick: () => setToDeleteFolder(f),
						},
					]
				: []
			: [
					{
						label: 'Share',
						icon: <PeopleOutlineRounded style={{ fontSize: 16 }} />,
						onClick: () =>
							setShareTarget({
								resourceType: 'FOLDER',
								resourceId: f.id,
								resourceName: f.name,
							}),
					},
					{
						label: 'Rename',
						icon: <DriveFileRenameOutlineOutlined style={{ fontSize: 16 }} />,
						onClick: () => {
							setRenameTarget({ kind: 'folder', folder: f })
							setRenameValue(f.name)
						},
					},
					{
						label: 'Move',
						icon: <DriveFileMoveOutlined style={{ fontSize: 16 }} />,
						onClick: () => {
							/* Preseed the bulk selection with just this one
							 *  folder, then reuse the existing MoveModal flow
							 *  so there's one code path for both single-item
							 *  (context menu) and multi-item (toolbar) moves. */
							setSelectedFolderIds(new Set([f.id]))
							setSelectedFileIds(new Set())
							setMoveModalOpen(true)
						},
					},
					{
						label: 'Delete',
						icon: <DeleteOutlineRounded style={{ fontSize: 16 }} />,
						danger: true,
						onClick: () => setToDeleteFolder(f),
					},
				]
		if (items.length === 0) return
		setCtxMenu({ x: e.clientX, y: e.clientY, items })
	}

	const openFileCtx = (e: React.MouseEvent, f: FileManagerFile) => {
		e.preventDefault()
		e.stopPropagation()
		/* Portal workers: Download always; Delete when the row is their
		 *  own upload within the 24 h window (matches the backend
		 *  ownership rule for deleteFile). Share / Rename / Move stay
		 *  admin-only (403 on the backend). */
		const items = isPortalHost
			? [
					{
						label: 'Download',
						icon: <DownloadRounded style={{ fontSize: 16 }} />,
						onClick: () => void handleDownload(f),
					},
					...(canPortalDeleteFile(f)
						? [
								{
									label: 'Delete',
									icon: <DeleteOutlineRounded style={{ fontSize: 16 }} />,
									danger: true,
									onClick: () => setToDeleteFile(f),
								},
							]
						: []),
				]
			: [
					{
						label: 'Share',
						icon: <PeopleOutlineRounded style={{ fontSize: 16 }} />,
						onClick: () =>
							setShareTarget({
								resourceType: 'FILE',
								resourceId: f.id,
								resourceName: f.originalName,
							}),
					},
					{
						label: 'Rename',
						icon: <DriveFileRenameOutlineOutlined style={{ fontSize: 16 }} />,
						onClick: () => {
							setRenameTarget({ kind: 'file', file: f })
							setRenameValue(f.originalName)
						},
					},
					{
						label: 'Move',
						icon: <DriveFileMoveOutlined style={{ fontSize: 16 }} />,
						onClick: () => {
							setSelectedFolderIds(new Set())
							setSelectedFileIds(new Set([f.id]))
							setMoveModalOpen(true)
						},
					},
					{
						label: 'Download',
						icon: <DownloadRounded style={{ fontSize: 16 }} />,
						onClick: () => void handleDownload(f),
					},
					{
						label: 'Delete',
						icon: <DeleteOutlineRounded style={{ fontSize: 16 }} />,
						danger: true,
						onClick: () => setToDeleteFile(f),
					},
				]
		setCtxMenu({ x: e.clientX, y: e.clientY, items })
	}

	const submitRename = async () => {
		if (!renameTarget) return
		const trimmed = renameValue.trim()
		if (!trimmed) return
		try {
			if (renameTarget.kind === 'folder') {
				await renameFolder({
					id: renameTarget.folder.id,
					name: trimmed,
					parentId: renameTarget.folder.parentId,
				}).unwrap()
				showToast('Folder renamed', 'success')
			} else {
				await renameFile({
					id: renameTarget.file.id,
					name: trimmed,
					folderId: renameTarget.file.folderId,
				}).unwrap()
				showToast('File renamed', 'success')
			}
			closeRename()
		} catch (err) {
			const msg =
				(err as { data?: { message?: string } })?.data?.message ??
				'Rename failed'
			showToast(msg, 'error')
		}
	}

	const confirmDeleteFolder = async () => {
		if (!toDeleteFolder) return
		const target = toDeleteFolder
		/* Mark the card for exit animation + close the confirm modal
		 *  immediately so the row visibly collapses rather than
		 *  flashing in place until the API returns. */
		setPendingDeleteIds((s) => new Set([...s, target.id]))
		setToDeleteFolder(null)
		await new Promise((r) => window.setTimeout(r, 320))
		/* Fade finished — now hand off to the browser's View
		 *  Transition so the grid cell is removed from layout smoothly
		 *  (siblings slide into the gap, not snap). */
		hideWithTransition(target.id)
		try {
			await deleteFolder({
				id: target.id,
				parentId: target.parentId,
			}).unwrap()
			showToast(`Folder "${target.name}" deleted`, 'success')
			/* DO NOT clear pendingDeleteIds here — the card is still
			 *  in the DOM (fade-out already finished at this point)
			 *  but the tag-invalidation refetch hasn't landed yet.
			 *  Clearing now would reset $deleting styles and the row
			 *  would snap back to visible for a flash before refetch
			 *  unmounts it. Let the item vanish naturally when the
			 *  fresh data arrives; the stale id in the set is
			 *  harmless because nothing renders it anymore. */
		} catch {
			showToast('Failed to delete folder', 'error')
			/* On failure, roll back BOTH the fade state and the
			 *  optimistic hide — otherwise the row stays invisible
			 *  until a page refresh (hideWithTransition filtered it
			 *  out of the rendered list via hiddenIds, which the
			 *  success path left to be garbage-collected by the
			 *  refetch; on error there is no refetch). */
			setPendingDeleteIds((s) => {
				const next = new Set(s)
				next.delete(target.id)
				return next
			})
			setHiddenIds((s) => {
				const next = new Set(s)
				next.delete(target.id)
				return next
			})
		}
	}
	const confirmDeleteFile = async () => {
		if (!toDeleteFile) return
		const target = toDeleteFile
		setPendingDeleteIds((s) => new Set([...s, target.id]))
		setToDeleteFile(null)
		await new Promise((r) => window.setTimeout(r, 320))
		hideWithTransition(target.id)
		try {
			await deleteFile({
				id: target.id,
				folderId: target.folderId,
			}).unwrap()
			showToast(`"${target.originalName}" deleted`, 'success')
			/* Do not clear pendingDeleteIds here — see note in
			 *  confirmDeleteFolder; the stale id is harmless once the
			 *  refetched data no longer contains the item. */
		} catch {
			showToast('Failed to delete file', 'error')
			setPendingDeleteIds((s) => {
				const next = new Set(s)
				next.delete(target.id)
				return next
			})
			setHiddenIds((s) => {
				const next = new Set(s)
				next.delete(target.id)
				return next
			})
		}
	}

	const breadcrumbs = data?.breadcrumbs ?? []
	const folderCount = data?.folders.length ?? 0

	/* FLIP for the Files section: when the user navigates between
	 * folders, the Folders grid above may shrink or vanish entirely,
	 * which would jerk the Files section upward on the next render.
	 * We measure the section's old top before the DOM reflow and the
	 * new top after; if it moved, we apply an inverse translate
	 * instantly, then animate it back to 0 so it appears to glide
	 * into place. */
	useLayoutEffect(() => {
		const el = filesSectionRef.current
		if (!el) return
		const newTop = el.offsetTop
		if (lastFilesTopRef.current !== null) {
			const dy = lastFilesTopRef.current - newTop
			if (dy !== 0) {
				el.style.transition = 'none'
				el.style.transform = `translateY(${dy}px)`
				requestAnimationFrame(() => {
					el.style.transition =
						'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
					el.style.transform = 'translateY(0)'
				})
			}
		}
		lastFilesTopRef.current = newTop
	}, [folderId, folderCount, filteredFiles.length])

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'File Manager', current: true }]}
				icon={<FolderOutlined />}
				iconTone={isPortalHost ? 'ink' : 'primary'}
				title='File Manager'
				subtitle='Corporate file space — folders, uploads, nothing tied to other modules.'
				middle={
					<HeaderHint aria-hidden='true'>
						<span className='w'>drop</span>
						<span className='amber'>
							<span className='a'>anything</span>
							<svg
								className='squiggle'
								viewBox='0 0 120 12'
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
						<span className='w'>here</span>
						<svg
							className='star'
							viewBox='0 0 24 24'
							width='14'
							height='14'
							fill='currentColor'
						>
							<path d='M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.9l-6.2 4.4 2.4-7.4L2 9.4h7.6z' />
						</svg>
					</HeaderHint>
				}
				action={
					<HeaderBtns>
						{/* Upload + New folder: hidden for portal workers on
						 *  the root view — they can only upload / create
						 *  inside shared folders anyway, so showing a CTA
						 *  that always 403s is just a bad surprise. Inside
						 *  a folder they get the buttons; if the specific
						 *  permission isn't on that share, the backend
						 *  will toast an actionable error. */}
						{(!isPortalHost || folderId !== null) && (
							<UploadBtnWrap>
								<UploadBtn type='button' onClick={() => setUploadModalOpen(true)}>
									<span className='glow' aria-hidden='true' />
									<span className='highlight' aria-hidden='true' />
									<CloudUploadOutlined style={{ fontSize: 18 }} />
									<span>Upload</span>
								</UploadBtn>
							</UploadBtnWrap>
						)}
						{(!isPortalHost || folderId !== null) && (
							<NewFolderBtn type='button' onClick={() => setNewFolderOpen(true)}>
								<span className='new-folder-icon'>
									<AddRounded style={{ fontSize: 18 }} />
								</span>
								New folder
							</NewFolderBtn>
						)}
						<input
							ref={fileInputRef}
							type='file'
							multiple
							hidden
							onChange={(e) => {
								if (e.target.files) {
									void handleUpload(e.target.files)
									e.target.value = ''
								}
							}}
						/>
					</HeaderBtns>
				}
			>
				<PageLayout>
					<Sidebar>
						<SideSection>
							<SideHead>Folders</SideHead>
							<TreeList>
								<TreeRow
									$active={!folderId}
									$depth={0}
									onClick={() => navigate('/file-manager')}
								>
									<TreeTwist $open={true}>
										<KeyboardArrowDownRounded style={{ fontSize: 16 }} />
									</TreeTwist>
									<FolderRounded style={{ fontSize: 16, color: '#64748b', flexShrink: 0 }} />
									<TreeName>Root</TreeName>
									<TreeCount>{treeData?.rootFileCount ?? 0}</TreeCount>
								</TreeRow>
								{(treeData?.roots ?? []).map((node) => (
									<TreeBranch
										key={node.id}
										node={node}
										depth={1}
										activeId={folderId}
										onPick={(id) => navigate(`/file-manager/folder/${id}`)}
									/>
								))}
							</TreeList>
						</SideSection>

						<StorageCard>
							{!isPortalHost && (
								<>
									<HeroEyebrow>USED STORAGE</HeroEyebrow>
									<HeroNumber>{fmtBytes(stats?.total ?? 0)}</HeroNumber>
									<HeroMeta>
										<HeroMetaCount>
											{stats?.count ?? 0} <span>files</span>
										</HeroMetaCount>
										<HeroMetaSep>·</HeroMetaSep>
										<HeroMetaCount>
											{countAllFolders(treeData?.roots)} <span>folders</span>
										</HeroMetaCount>
									</HeroMeta>
								</>
							)}

							<HeroAccent aria-hidden='true' $noDivider={isPortalHost}>
								<HeroAccentHead>
									<span className='orange'>backblaze</span>
									<span className='black'>b2</span>
								</HeroAccentHead>
							</HeroAccent>
						</StorageCard>
					</Sidebar>

					<MainCol>
				<Toolbar>
					<Breadcrumbs>
						<CrumbBtn
							type='button'
							onClick={() => navigate('/file-manager')}
							$current={!folderId}
						>
							<HomeOutlined style={{ fontSize: 16 }} />
							Root
						</CrumbBtn>
						{breadcrumbs.map((c, i) => (
							<Fragment key={c.id}>
								<CrumbSep>/</CrumbSep>
								<CrumbBtn
									type='button'
									onClick={() => navigate(`/file-manager/folder/${c.id}`)}
									$current={i === breadcrumbs.length - 1}
								>
									{c.name}
								</CrumbBtn>
							</Fragment>
						))}
						{folderId && (
							<BackBtn
								type='button'
								onClick={() => {
									const parent = breadcrumbs[breadcrumbs.length - 2]
									if (parent) navigate(`/file-manager/folder/${parent.id}`)
									else navigate('/file-manager')
								}}
							>
								<ArrowBackIosNewRounded style={{ fontSize: 12 }} />
								Up
							</BackBtn>
						)}
					</Breadcrumbs>
					{/* BulkBar always mounted — visibility controlled via
					 *  $visible so it fades + width-collapses in place
					 *  without pushing surrounding elements around. */}
					<BulkBar $visible={selectionCount > 0}>
						<BulkCount>{selectionCount} selected</BulkCount>
						{/* Move stays admin-only — single moveFile /
						 *  moveFolder are 403 for portal and bulk-move
						 *  requires upload rights on destination which is a
						 *  per-folder concern. Delete, on the other hand,
						 *  works for portal: the backend pre-filters to
						 *  only the items the actor created in the last
						 *  24 h and reports the rest in failed[]. */}
						{!isPortalHost && (
							<BulkBtn
								type='button'
								onClick={() => setMoveModalOpen(true)}
							>
								<DriveFileMoveOutlined style={{ fontSize: 14 }} />
								Move
							</BulkBtn>
						)}
						{canBulkDeleteSelection && (
							<BulkBtn
								type='button'
								$danger
								onClick={() => setBulkDeleteOpen(true)}
							>
								<DeleteOutlineRounded style={{ fontSize: 14 }} />
								Delete
							</BulkBtn>
						)}
						<BulkClear type='button' onClick={clearSelection} aria-label='Clear selection'>
							<CloseRounded style={{ fontSize: 14 }} />
						</BulkClear>
					</BulkBar>
				</Toolbar>

				<DropZone
					ref={dropRef}
					onDragEnter={onDragEnter}
					onDragLeave={onDragLeave}
					onDragOver={onDragOver}
					onDrop={onDrop}
					$dragging={dragging}
				>
					{dragging && (
						<DropOverlay>
							<CloudUploadOutlined style={{ fontSize: 44 }} />
							Drop files here to upload
						</DropOverlay>
					)}

					{isLoading && <LoadingBlock>Loading…</LoadingBlock>}

					{isError && (
						<ErrorBlock>
							Failed to load folder.{' '}
							<button type='button' onClick={() => refetch()}>Retry</button>
						</ErrorBlock>
					)}

					{!isLoading && !isError && folderCount > 0 && (
						<Section>
							<SectionHead>
								<span>Folders</span>
								<small>{folderCount}</small>
							</SectionHead>
							<FolderGrid>
								{visibleFolders.map((f, i) => {
									const isOpening = openingFolderId === f.id
									const isDimmed =
										openingFolderId !== null && openingFolderId !== f.id
									const isSelected = selectedFolderIds.has(f.id)
									const isDeleting = pendingDeleteIds.has(f.id)
									return (
										<FolderCard
											key={f.id}
											onClick={(e) => {
												const res = handleItemClick('folder', f.id, e)
												if (res === 'passthrough') openFolder(f.id)
											}}
											onContextMenu={(e) => openFolderCtx(e, f)}
											role='button'
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault()
													openFolder(f.id)
												}
											}}
											/* data-fm-folder marks the DOM node so
											 *  hideWithTransition can tag ONLY the deleting
											 *  card with view-transition-name at the moment
											 *  the VT fires. A static name on every card
											 *  made every unrelated transition (e.g. an
											 *  upload tray cross-group move) snapshot every
											 *  grid cell as its own ::view-transition-group,
											 *  flashing them visibility:hidden mid-flight —
											 *  that's what made the tray rows look like they
											 *  were leaping out of the panel. */
											data-fm-folder={f.id}
											$index={i}
											$opening={isOpening}
											$dimmed={isDimmed}
											$selected={isSelected}
											$deleting={isDeleting}
										>
											<Folder3D
												size={110}
												fileCount={f.fileCount}
											/>
											<FolderMeta>
												<FolderName>{f.name}</FolderName>
												<FolderSub>
													{f.fileCount} file{f.fileCount === 1 ? '' : 's'}
													{f.childFolderCount > 0 &&
														` · ${f.childFolderCount} folder${
															f.childFolderCount === 1 ? '' : 's'
														}`}
												</FolderSub>
											</FolderMeta>
										</FolderCard>
									)
								})}
							</FolderGrid>
						</Section>
					)}

					{!isLoading && !isError && (
						<Section ref={filesSectionRef}>
							<SectionHead>
								<span>Files</span>
								<small>{filteredFiles.length}</small>
							</SectionHead>
							{filteredFiles.length === 0 ? (
								<EmptyState>
									<EmptyGlyph aria-hidden='true'>
										<svg
											viewBox='0 0 120 100'
											width='120'
											height='100'
											fill='none'
										>
											<path
												d='M14 24a8 8 0 0 1 8-8h22l10 10h44a8 8 0 0 1 8 8v46a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V24Z'
												stroke='currentColor'
												strokeWidth='2.5'
												strokeLinejoin='round'
												strokeDasharray='6 5'
											/>
										</svg>
									</EmptyGlyph>
									<EmptyTitle>No files here yet</EmptyTitle>
									<EmptyHint>
										Drop files anywhere on this page, or hit <strong>Upload</strong> above.
									</EmptyHint>
								</EmptyState>
							) : (
								<AttachList>
									{filteredFiles.map((f, i) => {
										const kind = mimeKind(f.mimeType)
										const isSelected = selectedFileIds.has(f.id)
										const isDeleting = pendingDeleteIds.has(f.id)
										return (
											<AttachCard
												key={f.id}
												$kind={kind}
												$selected={isSelected}
												$deleting={isDeleting}
												onContextMenu={(e) => openFileCtx(e, f)}
												onClick={(e) => {
													const res = handleItemClick('file', f.id, e)
													if (res === 'passthrough') openPreview(f)
												}}
												style={{
													animationDelay: `${Math.min(i, 20) * 35}ms`,
												}}
												data-fm-file={f.id}
											>
												<AttachTypeIcon $kind={kind}>
													<AttachFold />
													<AttachExt>{getExt(f.originalName)}</AttachExt>
												</AttachTypeIcon>
												<AttachBody>
													<AttachName>{f.originalName}</AttachName>
													<AttachStatus>
														<AttachStatusText>{fmtBytes(f.size)}</AttachStatusText>
														<AttachDot />
														<AttachStatusText>
															{formatAttachDate(f.createdAt)}
														</AttachStatusText>
														{f.uploadedBy?.name && (
															<>
																<AttachDot />
																<AttachStatusText>
																	{f.uploadedBy.name}
																</AttachStatusText>
															</>
														)}
													</AttachStatus>
												</AttachBody>
												<AttachActions onClick={(e) => e.stopPropagation()}>
													<FileActions
														onDownload={() => handleDownload(f)}
														onDelete={() => setToDeleteFile(f)}
														showDelete={!isPortalHost || canPortalDeleteFile(f)}
													/>
												</AttachActions>
											</AttachCard>
										)
									})}
								</AttachList>
							)}
						</Section>
					)}
				</DropZone>
					</MainCol>
				</PageLayout>
			</ListPageShell>

			{newFolderOpen && (
				<ConfirmModal
					icon={<AddRounded />}
					iconTone='ink'
					title='New folder'
					description='Choose a name for the new folder. It will be created in the current location.'
					confirmLabel='Create'
					confirmLoadingLabel='Creating…'
					confirmColor='ink'
					isLoading={creatingFolder}
					confirmDisabled={!newFolderName.trim()}
					onConfirm={handleCreateFolder}
					onClose={closeNewFolder}
				>
					<ModalInput
						autoFocus
						value={newFolderName}
						onChange={(e) => setNewFolderName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && newFolderName.trim())
								void handleCreateFolder()
							if (e.key === 'Escape') closeNewFolder()
						}}
						placeholder='Folder name'
					/>
				</ConfirmModal>
			)}

			{toDeleteFolder && (
				<ConfirmModal
					icon={<DeleteOutlineRounded />}
					iconTone='danger'
					title='Delete folder?'
					description={
						<>
							This will delete <strong>{toDeleteFolder.name}</strong> and
							everything inside it. This cannot be undone.
						</>
					}
					confirmLabel='Delete'
					onConfirm={confirmDeleteFolder}
					onClose={() => setToDeleteFolder(null)}
				/>
			)}

			{toDeleteFile && (
				<ConfirmModal
					icon={<DeleteOutlineRounded />}
					iconTone='danger'
					title='Delete file?'
					description={
						<>
							This will permanently delete <strong>{toDeleteFile.originalName}</strong>.
						</>
					}
					confirmLabel='Delete'
					onConfirm={confirmDeleteFile}
					onClose={() => setToDeleteFile(null)}
				/>
			)}

			{ctxMenu && (
				<ContextMenu
					x={ctxMenu.x}
					y={ctxMenu.y}
					items={ctxMenu.items}
					onClose={() => setCtxMenu(null)}
				/>
			)}

			{renameTarget && (
				<ConfirmModal
					icon={<DriveFileRenameOutlineOutlined />}
					iconTone='ink'
					title={`Rename ${renameTarget.kind === 'folder' ? 'folder' : 'file'}`}
					description={
						<>
							Enter a new name for{' '}
							<strong>
								{renameTarget.kind === 'folder'
									? renameTarget.folder.name
									: renameTarget.file.originalName}
							</strong>
							.
						</>
					}
					confirmLabel='Rename'
					confirmColor='ink'
					confirmDisabled={!renameValue.trim()}
					onConfirm={submitRename}
					onClose={closeRename}
				>
					<ModalInput
						autoFocus
						value={renameValue}
						onChange={(e) => setRenameValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && renameValue.trim()) void submitRename()
							if (e.key === 'Escape') closeRename()
						}}
						placeholder='Name'
					/>
				</ConfirmModal>
			)}

			{bulkDeleteOpen && (
				<ConfirmModal
					icon={<DeleteOutlineRounded />}
					iconTone='danger'
					title={`Delete ${selectionCount} ${selectionCount === 1 ? 'item' : 'items'}?`}
					description={
						<>
							{selectedFolderIds.size > 0 && (
								<>
									{selectedFolderIds.size} folder{selectedFolderIds.size === 1 ? '' : 's'}
									{selectedFileIds.size > 0 && ' and '}
								</>
							)}
							{selectedFileIds.size > 0 && (
								<>
									{selectedFileIds.size} file{selectedFileIds.size === 1 ? '' : 's'}
								</>
							)}
							{' '}will be permanently removed. This cannot be undone.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					isLoading={isBulkDeleting}
					onConfirm={async () => {
						/* Phase 1 — mark cards for exit animation; close the
						 *  confirmation modal immediately so the user sees
						 *  the list collapse, not a hanging dialog. */
						const ids = new Set<string>([
							...Array.from(selectedFolderIds),
							...Array.from(selectedFileIds),
						])
						setPendingDeleteIds(ids)
						setBulkDeleteOpen(false)
						/* Phase 2 — wait for the fade+collapse (320 ms) to
						 *  settle, then fire the real delete. Tag invalidation
						 *  will then re-render without the rows. */
						await new Promise((r) => window.setTimeout(r, 320))
						/* Hand off to View Transitions for the actual grid
						 *  reflow — same pattern as single-item delete. */
						const canVT =
							typeof document !== 'undefined' &&
							typeof (document as unknown as { startViewTransition?: unknown })
								.startViewTransition === 'function'
						if (canVT) {
							;(
								document as unknown as {
									startViewTransition: (cb: () => void) => unknown
								}
							).startViewTransition(() => {
								flushSync(() => setHiddenIds((s) => new Set([...s, ...ids])))
							})
						} else {
							setHiddenIds((s) => new Set([...s, ...ids]))
						}
						try {
							const res = await bulkDelete({
								folderIds: Array.from(selectedFolderIds),
								fileIds: Array.from(selectedFileIds),
								folderId: folderId ?? null,
							}).unwrap()
							showToast(
								`Deleted ${res.deletedFolders} folder(s), ${res.deletedFiles} file(s)` +
									(res.failed.length ? ` · ${res.failed.length} failed` : ''),
								res.failed.length ? 'warning' : 'success',
							)
							clearSelection()
							/* No pendingDeleteIds reset on success — the
							 *  cards are mid-collapse and the refetch is
							 *  about to arrive. Clearing here would reset
							 *  $deleting styles and the rows would snap
							 *  back visible for a flash before unmount. */
						} catch (e) {
							const msg =
								(e as { data?: { message?: string } })?.data?.message ??
								'Delete failed'
							showToast(msg, 'error')
							/* Roll back both sets: pending-delete so the
							 *  cards unfreeze visually, and hidden so the
							 *  optimistically-removed rows reappear
							 *  instead of staying ghosts until refresh. */
							setPendingDeleteIds(new Set())
							setHiddenIds((s) => {
								const next = new Set(s)
								for (const id of ids) next.delete(id)
								return next
							})
						}
					}}
					onClose={() => setBulkDeleteOpen(false)}
				/>
			)}

			{moveModalOpen && (
				<MoveModal
					count={selectionCount}
					sourceFolderIds={Array.from(selectedFolderIds)}
					currentFolderId={folderId ?? null}
					tree={treeData?.roots ?? []}
					isLoading={isBulkMoving}
					closing={moveModalClosing}
					onCancel={closeMoveModal}
					onMove={async (dest) => {
						try {
							const res = await bulkMove({
								folderIds: Array.from(selectedFolderIds),
								fileIds: Array.from(selectedFileIds),
								destinationFolderId: dest,
								sourceFolderId: folderId ?? null,
							}).unwrap()
							showToast(
								`Moved ${res.movedFolders + res.movedFiles} item(s)` +
									(res.failed.length ? ` · ${res.failed.length} failed` : ''),
								res.failed.length ? 'warning' : 'success',
							)
							clearSelection()
							closeMoveModal()
						} catch (e) {
							const msg =
								(e as { data?: { message?: string } })?.data?.message ??
								'Move failed'
							showToast(msg, 'error')
						}
					}}
				/>
			)}

			{preview && (
				<PreviewBackdrop onClick={closePreview} $closing={previewClosing}>
					<PreviewFrame
						onClick={(e) => e.stopPropagation()}
						$closing={previewClosing}
					>
						<PreviewHead>
							<PreviewTitle>
								<PreviewTitleName>{preview.name}</PreviewTitleName>
								{previewFile && (
									<PreviewTitleMeta>{fmtBytes(previewFile.size)}</PreviewTitleMeta>
								)}
							</PreviewTitle>
							<PreviewHeadActions>
								<PreviewCloseBtn
									type='button'
									onClick={closePreview}
									aria-label='Close'
									title='Close'
								>
									<CloseRounded style={{ fontSize: 18 }} />
								</PreviewCloseBtn>
							</PreviewHeadActions>
						</PreviewHead>
						<PreviewCollapse $closing={previewClosing}>
							<PreviewCollapseInner>
								<PreviewBody>
									<FilePreview
										url={preview.url}
										name={preview.name}
										mime={preview.mime}
									/>
								</PreviewBody>
							</PreviewCollapseInner>
						</PreviewCollapse>
					</PreviewFrame>
				</PreviewBackdrop>
			)}

			{uploadModalOpen && (
				<UploadModal
					folderId={folderId}
					onClose={() => setUploadModalOpen(false)}
				/>
			)}

			{shareTarget && (
				<ShareModal
					initial={shareTarget}
					onClose={() => setShareTarget(null)}
				/>
			)}
		</>
	)
}

/* ─── Move modal ───────────────────────────────────────────────── */
const MoveModal = ({
	count,
	sourceFolderIds,
	currentFolderId,
	tree,
	isLoading,
	closing,
	onCancel,
	onMove,
}: {
	count: number
	sourceFolderIds: string[]
	currentFolderId: string | null
	tree: FileManagerTreeNode[]
	isLoading: boolean
	closing: boolean
	onCancel: () => void
	onMove: (destinationFolderId: string | null) => void
}) => {
	/* Disable the entire subtree of any folder being moved — can't
	 *  move a folder into itself or its own descendant. */
	const forbidden = useMemo(() => {
		const banned = new Set<string>(sourceFolderIds)
		const walk = (nodes: FileManagerTreeNode[], inBanned: boolean) => {
			for (const n of nodes) {
				const self = inBanned || banned.has(n.id)
				if (self) banned.add(n.id)
				if (n.children?.length) walk(n.children, self)
			}
		}
		walk(tree, false)
		return banned
	}, [sourceFolderIds, tree])

	return (
		<ConfirmModal
			icon={<DriveFileMoveOutlined />}
			iconTone='ink'
			title={`Move ${count} ${count === 1 ? 'item' : 'items'} to…`}
			description='Pick a destination folder. The source items will keep their names.'
			/* Only one footer button — a solid ink Cancel that fills
			 *  the row. Done via hideCancel so the confirm slot plays
			 *  the role of a dismiss. */
			confirmLabel='Cancel'
			confirmColor='ink'
			hideCancel
			onConfirm={onCancel}
			onClose={onCancel}
			forceClose={closing}
			isLoading={isLoading}
		>
			<MoveList>
				<MoveRow
					$current={currentFolderId === null}
					$disabled={forbidden.has('__root__' as never)}
				>
					<FolderRounded style={{ fontSize: 16, color: '#64748b', flexShrink: 0 }} />
					<MoveName>Root</MoveName>
					<MoveHereBtn
						type='button'
						onClick={() => onMove(null)}
						disabled={isLoading}
					>
						Move here
					</MoveHereBtn>
				</MoveRow>
				<MoveTree
					nodes={tree}
					forbidden={forbidden}
					depth={1}
					currentFolderId={currentFolderId}
					isLoading={isLoading}
					onMove={onMove}
				/>
			</MoveList>
		</ConfirmModal>
	)
}

const MoveTree = ({
	nodes,
	forbidden,
	depth,
	currentFolderId,
	isLoading,
	onMove,
}: {
	nodes: FileManagerTreeNode[]
	forbidden: Set<string>
	depth: number
	currentFolderId: string | null
	isLoading: boolean
	onMove: (id: string) => void
}) => {
	return (
		<>
			{nodes.map((n) => {
				const disabled = forbidden.has(n.id)
				return (
					<Fragment key={n.id}>
						<MoveRow
							$current={currentFolderId === n.id}
							$disabled={disabled}
							style={{ paddingLeft: `${12 + depth * 16}px` }}
						>
							<FolderRounded style={{ fontSize: 16, color: '#64748b', flexShrink: 0 }} />
							<MoveName>{n.name}</MoveName>
							<MoveHereBtn
								type='button'
								onClick={() => onMove(n.id)}
								disabled={disabled || isLoading}
							>
								{disabled ? '—' : 'Move here'}
							</MoveHereBtn>
						</MoveRow>
						{n.children?.length ? (
							<MoveTree
								nodes={n.children}
								forbidden={forbidden}
								depth={depth + 1}
								currentFolderId={currentFolderId}
								isLoading={isLoading}
								onMove={onMove}
							/>
						) : null}
					</Fragment>
				)
			})}
		</>
	)
}

const MoveList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	max-height: 360px;
	overflow-y: auto;
	padding: 4px 2px;
	background: rgba(15, 23, 42, 0.02);
	border-radius: 10px;
`
const MoveRow = styled.div<{ $current?: boolean; $disabled?: boolean }>`
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	border-radius: 10px;
	color: ${({ $disabled }) => ($disabled ? '#94a3b8' : '#0f172a')};
	background: ${({ $current }) => ($current ? 'rgba(15, 23, 42, 0.04)' : 'transparent')};
	transition: background 160ms ease;
	&:hover {
		background: ${({ $disabled }) => ($disabled ? 'transparent' : 'rgba(15, 23, 42, 0.04)')};
	}
	&:hover > button {
		opacity: 1;
		visibility: visible;
	}
`
const MoveName = styled.span`
	font-size: 13.5px;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const MoveHereBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	padding: 7px 14px;
	border-radius: 999px;
	border: none;
	background: linear-gradient(135deg, #0f172a, #1e293b);
	color: #ffffff;
	font-family: inherit;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.2px;
	cursor: pointer;
	box-shadow: 0 4px 10px -4px rgba(15, 23, 42, 0.4);
	transition: transform 220ms cubic-bezier(0.22, 1.4, 0.36, 1),
		box-shadow 220ms ease, filter 220ms ease;
	opacity: 0;
	visibility: hidden;
	&::before {
		content: '↳';
		font-size: 13px;
		line-height: 1;
	}
	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.5);
		filter: brightness(1.08);
	}
	&:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
`

export default FileManagerPage

/* ─── Styled ─────────────────────────────────────────────────────── */

const HeaderBtns = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`

/* Handwritten orange+black hint sitting in the empty strip between
 * the "File Manager" title and the action buttons. Pattern cribbed
 * from Sales Analytics' "hunting upwork signals" treatment — same
 * script face, orange squiggle under the accent word, muted star. */
const headerHintIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to   { opacity: 1; transform: translateY(0); }
`

const HeaderHint = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	pointer-events: none;
	color: #0f172a;
	animation: ${headerHintIn} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: 180ms;

	.w {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-weight: 700;
		font-size: 28px;
		line-height: 1;
		letter-spacing: 0.2px;
		color: #0f172a;
	}

	.amber {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		padding-bottom: 4px;
	}

	.amber .a {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-weight: 700;
		font-size: 32px;
		line-height: 1;
		letter-spacing: 0.3px;
		color: #e85d2f;
	}

	.amber .squiggle {
		display: block;
		width: 100%;
		max-width: 130px;
		height: 10px;
		margin-top: 2px;
		color: #e85d2f;
	}

	.star {
		color: #e85d2f;
		margin-left: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const GhostBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 9px 14px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.12);
	background: #ffffff;
	color: #0f172a;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 160ms ease;
	&:hover { border-color: #0f172a; }
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`

/* Upload icon lifts up on hover and settles back down smoothly on
 * mouseout. Using a plain transition (not an infinite keyframe
 * loop) means the return motion is interpolated instead of
 * snapping back from whatever frame the loop was at. */
/* Primary Upload CTA — bold pillowy multi-colour gradient pill
 * (orange→pink→violet→blue) wrapped in a soft outer rim. Pillowy
 * outer frame, inner highlight across the top, white bold text.
 * The outer wrap gives the floating-on-paper feel; the inner
 * gradient is where the eye lands. */
const gradientShift = keyframes`
	0%, 100% { background-position: 0% 50%; }
	50%      { background-position: 100% 50%; }
`
const UploadBtnWrap = styled.div`
	display: inline-flex;
	padding: 6px;
	border-radius: 999px;
	background: #ffffff;
	box-shadow:
		0 1px 0 rgba(255, 255, 255, 0.9) inset,
		0 10px 24px -6px rgba(109, 72, 215, 0.25),
		0 2px 6px rgba(15, 23, 42, 0.08);
`
const UploadBtn = styled.button`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 11px 24px;
	border-radius: 999px;
	border: none;
	background: linear-gradient(
		110deg,
		#ff8a4c 0%,
		#ff6a7d 28%,
		#9966ff 62%,
		#4a7cff 100%
	);
	background-size: 180% 180%;
	color: #ffffff;
	font: inherit;
	font-size: 13.5px;
	font-weight: 700;
	letter-spacing: 0.1px;
	cursor: pointer;
	isolation: isolate;
	overflow: hidden;
	text-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.4),
		inset 0 -3px 8px rgba(80, 40, 160, 0.3),
		0 6px 16px -4px rgba(130, 85, 220, 0.5),
		0 2px 4px rgba(15, 23, 42, 0.15);
	animation: ${gradientShift} 8s ease-in-out infinite;
	transition:
		transform 220ms cubic-bezier(0.22, 1.35, 0.36, 1),
		box-shadow 220ms ease,
		filter 160ms ease;

	.highlight {
		position: absolute;
		top: 1px;
		left: 10%;
		right: 10%;
		height: 40%;
		border-radius: 999px;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.35),
			rgba(255, 255, 255, 0) 100%
		);
		pointer-events: none;
		z-index: 1;
	}
	.glow {
		position: absolute;
		inset: -8px;
		border-radius: 999px;
		background: radial-gradient(
			ellipse at center,
			rgba(255, 138, 76, 0.3),
			rgba(149, 102, 255, 0.2) 60%,
			transparent 80%
		);
		filter: blur(10px);
		z-index: -1;
		opacity: 0;
		transition: opacity 300ms ease;
		pointer-events: none;
	}

	svg, span:not(.highlight):not(.glow) {
		position: relative;
		z-index: 2;
	}

	&:hover {
		transform: translateY(-2px);
		filter: brightness(1.05);
	}
	&:hover .glow { opacity: 1; }
	&:active { transform: scale(0.97); }
`


const SolidBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 11px 18px;
	border-radius: 12px;
	border: none;
	background: #0f172a;
	color: #ffffff;
	font: inherit;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.01em;
	cursor: pointer;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
	transition: transform 120ms ease, box-shadow 160ms ease, background 160ms ease;
	svg { font-size: 18px; }
	&:hover {
		transform: translateY(-1px);
		background: #1e293b;
		box-shadow: 0 6px 16px rgba(15, 23, 42, 0.28);
	}
	&:active { transform: translateY(0); }
	&:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`

/* "+" icon spins half a turn and comes back on hover — hints the
 * next action without being overbearing. Bidirectional transition
 * so mouseout eases back to zero, no snap. */
const NewFolderBtn = styled(SolidBtn)`
	.new-folder-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transform: rotate(0deg);
		transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover .new-folder-icon {
		transform: rotate(180deg);
	}
`

/* ─── Bulk toolbar ─────────────────────────────────────────────── */
const BulkBar = styled.div<{ $visible: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 12px 14px 12px 18px;
	border-radius: 999px;
	background: linear-gradient(135deg, #0f172a, #1e293b);
	color: #ffffff;
	box-shadow: 0 10px 24px -10px rgba(15, 23, 42, 0.4);
	overflow: hidden;
	white-space: nowrap;
	/* Collapse into zero footprint when hidden so sibling elements
	 *  (filter row) don't jump: max-width → 0, padding → 0, opacity
	 *  → 0. Transition on all three for a smooth slide-away. */
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	max-width: ${({ $visible }) => ($visible ? '600px' : '0')};
	padding-left: ${({ $visible }) => ($visible ? '18px' : '0')};
	padding-right: ${({ $visible }) => ($visible ? '14px' : '0')};
	padding-top: ${({ $visible }) => ($visible ? '12px' : '0')};
	padding-bottom: ${({ $visible }) => ($visible ? '12px' : '0')};
	margin-right: ${({ $visible }) => ($visible ? '0' : '-10px')};
	transform: ${({ $visible }) =>
		$visible ? 'translateY(0)' : 'translateY(-4px)'};
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
	transition:
		opacity 240ms ease,
		max-width 340ms cubic-bezier(0.4, 0, 0.2, 1),
		padding 300ms cubic-bezier(0.4, 0, 0.2, 1),
		transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
		margin 300ms cubic-bezier(0.4, 0, 0.2, 1);
`
const BulkCount = styled.span`
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.1px;
	padding-right: 4px;
`
const BulkBtn = styled.button<{ $danger?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	padding: 6px 12px;
	border-radius: 999px;
	border: none;
	background: ${({ $danger }) =>
		$danger ? 'rgba(220, 38, 38, 0.9)' : 'rgba(255, 255, 255, 0.12)'};
	color: #ffffff;
	font-family: inherit;
	font-size: 11.5px;
	font-weight: 700;
	cursor: pointer;
	transition: background 160ms ease, transform 160ms ease;
	& > svg {
		transition: transform 220ms cubic-bezier(0.22, 1.4, 0.36, 1);
	}
	&:hover {
		background: ${({ $danger }) =>
			$danger ? '#dc2626' : 'rgba(255, 255, 255, 0.2)'};
		transform: translateY(-1px);
	}
	&:hover > svg {
		transform: scale(1.2) rotate(-6deg);
	}
`
const BulkClear = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	min-width: 0;
	padding: 0;
	border-radius: 50%;
	aspect-ratio: 1 / 1;
	border: none;
	background: rgba(255, 255, 255, 0.08);
	color: #ffffff;
	cursor: pointer;
	transition: background 160ms ease, transform 160ms ease;
	& > svg {
		transition: transform 220ms cubic-bezier(0.22, 1.4, 0.36, 1);
	}
	&:hover {
		background: rgba(255, 255, 255, 0.18);
		transform: scale(1.08);
	}
	&:hover > svg {
		transform: rotate(90deg);
	}
`

const Toolbar = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	/* Separate axis gaps: tight horizontally so breadcrumbs sit
	 * next to the filter row on one line, but generous vertically
	 * so when the breadcrumbs grow long and push the filter row to
	 * a new line, the two bands get real breathing room. */
	column-gap: 14px;
	row-gap: 20px;
	flex-wrap: wrap;
	padding: 6px 2px 14px;
`

/* Breadcrumbs — uniform rhythm: 8px gap between every element
 * (crumb, separator, next crumb, etc). The wrapping <Fragment>
 * on the item side means separators and crumbs are siblings of
 * the Breadcrumbs flex container, so the `gap` applies evenly
 * on both sides of each separator instead of lopsidedly. */
const Breadcrumbs = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	flex-wrap: wrap;
`

const CrumbBtn = styled.button<{ $current?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	/* Hug the content as tight as possible — a single-char label
	 * ("3") should look like a chip of its own size, not a padded
	 * placeholder. MUI's global button {min-width:64px} was blowing
	 * tiny crumbs out — explicitly reset. */
	min-width: 0;
	padding: 2px 6px;
	border-radius: 7px;
	border: none;
	background: ${({ $current }) => ($current ? 'rgba(15, 23, 42, 0.08)' : 'transparent')};
	color: ${({ $current }) => ($current ? '#0f172a' : '#64748b')};
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background 140ms ease, color 140ms ease;
	&:hover { background: rgba(15, 23, 42, 0.05); color: #0f172a; }
`

const CrumbSep = styled.span`
	color: #cbd5e1;
	font-weight: 400;
	line-height: 1;
	/* Padding stripped — breathing room comes from the parent's
	 * flex gap, keeping spacing identical on both sides. */
	padding: 0;
	user-select: none;
`

const BackBtn = styled.button`
	margin-left: 10px;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	min-width: 0;
	padding: 5px 10px;
	border-radius: 999px;
	border: 1px dashed rgba(15, 23, 42, 0.18);
	background: transparent;
	color: #64748b;
	font: inherit;
	font-size: 11px;
	font-weight: 600;
	cursor: pointer;
	&:hover { color: #0f172a; border-color: #0f172a; }
`

const FilterRow = styled.div`
	position: relative;
	display: inline-flex;
	gap: 2px;
	padding: 3px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	align-items: center;
`

/* Sliding black pill — same mechanic as the Sales Analytics orange
 * tape indicator, retuned to a cool/neutral palette. Transforms are
 * composed in the component (translateX + width) so the slide eases
 * on both axes with a spring curve. */
const FilterIndicator = styled.span`
	position: absolute;
	top: 3px;
	bottom: 3px;
	left: 0;
	border-radius: 999px;
	background: linear-gradient(135deg, #0f172a, #1e293b);
	box-shadow:
		0 2px 0 rgba(15, 23, 42, 0.14),
		0 4px 12px rgba(15, 23, 42, 0.28);
	transition:
		transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		width 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		opacity 200ms ease;
	pointer-events: none;
	will-change: transform, width;

	@media (prefers-reduced-motion: reduce) {
		transition: transform 0ms, width 0ms, opacity 0ms;
	}
`

const FilterPill = styled.button<{ $active: boolean }>`
	position: relative;
	z-index: 1;
	padding: 6px 14px;
	border-radius: 999px;
	border: none;
	background: transparent;
	color: ${({ $active }) => ($active ? '#ffffff' : '#64748b')};
	font: inherit;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: color 220ms cubic-bezier(0.22, 1, 0.36, 1);
	&:hover { color: ${({ $active }) => ($active ? '#ffffff' : '#0f172a')}; }
`

const DropZone = styled.div<{ $dragging: boolean }>`
	position: relative;
	min-height: 400px;
	border-radius: 18px;
	padding: 20px;
	background: #ffffff;
	border: 2px dashed
		${({ $dragging }) =>
			$dragging ? 'rgba(15, 23, 42, 0.55)' : 'rgba(15, 23, 42, 0.06)'};
	transition: border-color 180ms ease;
`

const dropIn = keyframes`
	from { opacity: 0; transform: scale(0.96); }
	to   { opacity: 1; transform: scale(1); }
`

const DropOverlay = styled.div`
	position: absolute;
	inset: 10px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	/* Ink-black, very transparent — matches the page's accent neutral
	 * so the overlay reads as a focus state, not a brand-colored ad. */
	background: rgba(15, 23, 42, 0.05);
	color: #0f172a;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	font-weight: 700;
	border-radius: 14px;
	pointer-events: none;
	animation: ${dropIn} 160ms ease-out;
	z-index: 10;
`

const LoadingBlock = styled.div`
	padding: 60px 20px;
	text-align: center;
	color: #64748b;
`

const ErrorBlock = styled.div`
	padding: 60px 20px;
	text-align: center;
	color: #b91c1c;
	button {
		margin-left: 8px;
		padding: 4px 10px;
		border-radius: 8px;
		border: 1px solid #b91c1c;
		background: transparent;
		color: #b91c1c;
		font: inherit;
		cursor: pointer;
	}
`

const Section = styled.section`
	& + & { margin-top: 24px; }
`

const SectionHead = styled.div`
	display: flex;
	align-items: baseline;
	gap: 10px;
	padding: 0 4px 12px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: #64748b;
	small {
		font-size: 11px;
		font-weight: 600;
		color: #94a3b8;
		text-transform: none;
		letter-spacing: 0;
	}
`

const FolderGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	gap: 12px;
`

const folderCardIn = keyframes`
	0%   { opacity: 0; transform: translateY(10px) scale(0.96); }
	100% { opacity: 1; transform: translateY(0) scale(1); }
`
/* Open-pulse. Deliberately omits the 0% keyframe: when the user
 *  clicks a folder mid-entry (first click right after page load,
 *  while the staggered folderCardIn is still interpolating from
 *  scale(0.96)), an explicit `0% { transform: scale(1) }` makes
 *  the browser snap the transform from the current ~0.97 value to
 *  1.0 before pulsing — reads as a double "bam". Without a 0%,
 *  the browser uses the element's current rendered transform as
 *  the implicit start, and the pulse glides from wherever we are
 *  up to 1.04 and back. Single clean beat regardless of timing. */
const folderPulseOut = keyframes`
	60%  { transform: scale(1.04); }
	100% { transform: scale(1); }
`

const FolderCard = styled.div<{
	$selected?: boolean
	$deleting?: boolean
	$index: number
	$opening: boolean
	$dimmed: boolean
}>`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 14px 10px 12px;
	border-radius: 14px;
	border: 1px solid rgba(15, 23, 42, 0.06);
	background: #ffffff;
	cursor: pointer;
	font: inherit;
	text-align: center;
	/* Baseline opacity: 1 so if a later rule (like the $opening
	 * pulse) replaces the entry animation, the card stays visible.
	 * folderCardIn uses backwards-fill to apply its "from" state
	 * before the animation runs — gives the stagger-in without
	 * leaving the card at 0 if its animation ever gets overridden. */
	opacity: 1;
	animation: ${folderCardIn} 440ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
	animation-delay: ${({ $index }) => Math.min($index, 20) * 50}ms;
	transition: border-color 180ms ease, opacity 220ms ease, filter 220ms ease,
		box-shadow 220ms ease;

	&:hover {
		border-color: rgba(15, 23, 42, 0.14);
	}

	${({ $selected }) =>
		$selected &&
		css`
			background: rgba(15, 23, 42, 0.04);
			&::after {
				content: '';
				position: absolute;
				top: 8px;
				right: 8px;
				width: 20px;
				height: 20px;
				border-radius: 50%;
				background: #0f172a
					url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>")
					center / 14px no-repeat;
			}
		`}

	${({ $dimmed }) =>
		$dimmed &&
		`opacity: 0.3; filter: blur(1px) saturate(0.6);`}

	${({ $deleting }) =>
		$deleting &&
		css`
			/* Fade + scale out, AND physically collapse to zero size
			 *  WITH a negative margin equal to the grid gap (12 px) —
			 *  this absorbs the parent's row/column gap-slot so when
			 *  the row is finally unmounted after refetch, grid
			 *  neighbours are already in their final position and
			 *  don't visibly shift by one gap. No end-of-animation
			 *  jerk. */
			opacity: 0;
			transform: scale(0.85) translateX(20px);
			max-width: 0;
			max-height: 0;
			margin: -6px;
			padding: 0;
			overflow: hidden;
			pointer-events: none;
			transition:
				opacity 220ms ease,
				transform 300ms cubic-bezier(0.4, 0, 1, 1),
				max-width 320ms cubic-bezier(0.4, 0, 0.2, 1),
				max-height 320ms cubic-bezier(0.4, 0, 0.2, 1),
				margin 320ms cubic-bezier(0.4, 0, 0.2, 1),
				padding 320ms cubic-bezier(0.4, 0, 0.2, 1);
		`}

	${({ $opening }) =>
		$opening &&
		css`
			z-index: 2;
			animation: ${folderPulseOut} 420ms ease-out forwards;
		`}
`

const FolderMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	width: 100%;
`

const FolderName = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 13px;
	font-weight: 700;
	color: #0f172a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const FolderSub = styled.div`
	font-size: 11px;
	font-weight: 500;
	color: #94a3b8;
`

/* Context-menu root — portalled to body. Glassy card with a soft
 * drop shadow; subtle in/out so the menu feels snappy. */
const ctxIn = keyframes`
	from { opacity: 0; transform: translateY(-4px) scale(0.96); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`
const ctxOut = keyframes`
	from { opacity: 1; transform: translateY(0) scale(1); }
	to   { opacity: 0; transform: translateY(-2px) scale(0.98); }
`

const CtxRoot = styled.div<{ $closing: boolean }>`
	position: fixed;
	z-index: 1400;
	min-width: 140px;
	padding: 5px;
	border-radius: 12px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.06);
	box-shadow:
		0 20px 40px -12px rgba(15, 23, 42, 0.25),
		0 2px 6px rgba(15, 23, 42, 0.06);
	transform-origin: top left;
	animation: ${({ $closing }) => ($closing ? ctxOut : ctxIn)}
		${({ $closing }) => ($closing ? 140 : 160)}ms
		cubic-bezier(0.22, 1, 0.36, 1) forwards;
`

const CtxItem = styled.button<{ $danger: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 7px 10px;
	border-radius: 8px;
	border: none;
	background: transparent;
	color: ${({ $danger }) => ($danger ? '#b91c1c' : '#0f172a')};
	font: inherit;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	text-align: left;
	transition: background 140ms ease;
	.ctx-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: ${({ $danger }) => ($danger ? '#b91c1c' : '#64748b')};
	}
	&:hover {
		background: ${({ $danger }) =>
			$danger ? 'rgba(185, 28, 28, 0.08)' : 'rgba(15, 23, 42, 0.05)'};
	}
`

const fileRowIn = keyframes`
	0%   { opacity: 0; transform: translateX(-14px) translateY(4px); }
	100% { opacity: 1; transform: translateX(0) translateY(0); }
`

/* ─── Attachment-style file rows (borrowed from
 *     components/_shared/attachments/AttachmentsSection.tsx) ──────── */

const ATTACH_COLORS: Record<
	MimeKind,
	{ from: string; to: string; solid: string }
> = {
	pdf: { from: '#f87171', to: '#dc2626', solid: '#dc2626' },
	image: { from: '#60a5fa', to: '#2563eb', solid: '#2563eb' },
	doc: { from: '#4ade80', to: '#16a34a', solid: '#16a34a' },
	other: { from: '#fbbf24', to: '#f59e0b', solid: '#f59e0b' },
}

const AttachList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

/* Row card: zero hover shadow / border shift. The interest lives on
 * the file-type icon — it lifts, tilts, and casts a mime-color
 * shadow when the row is hovered. Staggered in with a slide-in. */
const AttachCard = styled.li<{
	$kind: MimeKind
	$selected?: boolean
	$deleting?: boolean
}>`
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
	cursor: pointer;
	opacity: 0;
	animation: ${fileRowIn} 420ms cubic-bezier(0.22, 1.2, 0.36, 1) both;

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
		box-shadow: 0 6px 14px -4px
			${(p) => ATTACH_COLORS[p.$kind].solid}66;
	}

	${({ $selected }) =>
		$selected &&
		css`
			background: rgba(15, 23, 42, 0.04);
			&::after {
				content: '';
				position: absolute;
				top: 10px;
				right: 10px;
				width: 20px;
				height: 20px;
				border-radius: 50%;
				background: #0f172a
					url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>")
					center / 14px no-repeat;
			}
		`}

	${({ $deleting }) =>
		$deleting &&
		css`
			/* Same trick as FolderCard: negative margin equal to the
			 *  AttachList gap (8 px) absorbs the parent flex-gap for
			 *  this row, so the final unmount after refetch doesn't
			 *  cause neighbours to jump up by one gap. */
			opacity: 0;
			transform: translateX(24px) scale(0.98);
			max-height: 0;
			margin: -4px 0;
			padding: 0 16px;
			overflow: hidden;
			pointer-events: none;
			transition:
				opacity 220ms ease,
				transform 280ms cubic-bezier(0.4, 0, 1, 1),
				max-height 320ms cubic-bezier(0.4, 0, 0.2, 1),
				margin 320ms cubic-bezier(0.4, 0, 0.2, 1),
				padding 320ms cubic-bezier(0.4, 0, 0.2, 1);
		`}
`

const AttachTypeIcon = styled.div<{ $kind: MimeKind }>`
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
		${(p) => ATTACH_COLORS[p.$kind].from},
		${(p) => ATTACH_COLORS[p.$kind].to}
	);
	flex: 0 0 auto;
	box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.15);
`

const AttachFold = styled.span`
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
	border-radius: 0 6px 0 4px;
`

const AttachExt = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 1px;
	color: #ffffff;
`

const AttachBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const AttachName = styled.div`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14.5px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.2px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const AttachStatus = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
`

const AttachStatusText = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 12.5px;
	font-weight: 500;
	color: #64748b;
`

const AttachDot = styled.span`
	width: 3px;
	height: 3px;
	border-radius: 50%;
	background: #cbd5e1;
`

const AttachActions = styled.div`
	display: inline-flex;
	gap: 4px;
`

const AttachBtn = styled.button<{ $danger?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	flex: 0 0 36px;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	border: none;
	background: transparent;
	color: ${({ $danger }) => ($danger ? '#b91c1c' : '#64748b')};
	cursor: pointer;
	transition: background 160ms ease, color 160ms ease;
	&:hover {
		background: ${({ $danger }) =>
			$danger ? 'rgba(185, 28, 28, 0.08)' : 'rgba(15, 23, 42, 0.06)'};
		color: ${({ $danger }) => ($danger ? '#b91c1c' : '#0f172a')};
	}
`

/* Numbered big-text action with vertical label swap.
 *
 * Each action is numbered ("01" / "02") in small muted mono caps,
 * with the label in oversized Bricolage below.
 *
 * Label animation: the text sits in a 1-line-tall viewport that
 * contains TWO stacked copies of the word; on hover the stack
 * slides UP by one line so the top copy exits upward and the
 * second copy enters from below. Classic slot-machine / Linear-
 * button text-swap, feels polished and intentional. The bottom
 * copy inherits the hover color (orange for destructive, deep
 * ink for benign) so the swap doubles as a color-change beat.
 *
 * sr-only span carries the real label for assistive tech since
 * the animated spans are aria-hidden. */
const ActBigWrap = styled.div`
	display: inline-flex;
	gap: 18px;
	padding: 0 8px;
`

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
		/* The second copy pre-colors to the hover tint, so when it
		 * slides up into view the color-change happens naturally. */
		color: ${({ $danger }) => ($danger ? '#dc2626' : '#0f172a')};
	}

	&:hover {
		transform: translateX(2px);
	}
	&:hover .lbl-row {
		transform: translateY(-1em);
	}
	&:hover .num {
		color: ${({ $danger }) => ($danger ? '#991b1b' : '#64748b')};
		letter-spacing: 2.2px;
	}
`

/* Smoother entry for the empty-state block:
 *  - The whole block fades in with a slight translateY (600ms) so it
 *    settles after the layout has shifted (prevents the "pop" when
 *    nav lands on a folder with 0 files).
 *  - Children stagger inside the already-faded wrapper (icon → title
 *    → hint) for a bit of extra polish. */
const emptyBlockIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to   { opacity: 1; transform: translateY(0); }
`
const emptyChildIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	padding: 60px 20px 40px;
	text-align: center;
	opacity: 0;
	animation: ${emptyBlockIn} 600ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
	& > * {
		opacity: 0;
		animation: ${emptyChildIn} 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	& > *:nth-child(1) { animation-delay: 180ms; }
	& > *:nth-child(2) { animation-delay: 260ms; }
	& > *:nth-child(3) { animation-delay: 340ms; }
`

/* Dashed-outline ghost folder — intentionally different from the
 * real Folder3D icons so the empty state reads as "this is a status
 * marker", not a mis-rendered folder. Muted ink on the sidebar's
 * background. */
const EmptyGlyph = styled.div`
	color: #cbd5e1;
	line-height: 0;
	svg {
		display: block;
	}
`

const EmptyTitle = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-weight: 700;
	font-size: 15px;
	color: #0f172a;
`

const EmptyHint = styled.div`
	font-size: 13px;
	color: #64748b;
	max-width: 320px;
`

const backdropOut = keyframes`
	from { opacity: 1; }
	to   { opacity: 0; }
`

const modalCardIn = keyframes`
	from { opacity: 0; transform: translateY(12px) scale(0.96); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const modalCardOut = keyframes`
	from { opacity: 1; transform: translateY(0) scale(1); }
	to   { opacity: 0; transform: translateY(8px) scale(0.98); }
`

const ModalBackdrop = styled.div<{ $closing: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1200;
	animation: ${({ $closing }) =>
			$closing ? backdropOut : dropIn}
		180ms ease-out forwards;
`

const ModalCard = styled.div<{ $closing: boolean }>`
	background: #ffffff;
	border-radius: 16px;
	min-width: 360px;
	max-width: 480px;
	box-shadow: 0 30px 60px -20px rgba(15, 23, 42, 0.4);
	overflow: hidden;
	animation: ${({ $closing }) =>
			$closing ? modalCardOut : modalCardIn}
		180ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
`

const ModalTitle = styled.div`
	padding: 18px 22px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-weight: 700;
	font-size: 16px;
	color: #0f172a;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
`

const ModalBody = styled.div`
	padding: 18px 22px;
`

const ModalInput = styled.input`
	width: 100%;
	padding: 10px 12px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.12);
	font: inherit;
	font-size: 14px;
	transition: border-color 160ms ease;
	&:focus {
		outline: none;
		border-color: #0f172a;
	}
`

const ModalFoot = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	padding: 14px 22px 18px;
	background: #f8fafc;
`

/* Two-phase enter/exit mirroring the credentials RevealDrawer:
 *   open → scrim fade (220ms), panel scale-in (240ms)
 *   close → body collapses first (320ms), THEN panel scales out
 *          (400ms, delay 320ms), scrim fades last (400ms, delay 320ms)
 * Total close = ~720ms. The multi-step unmount makes the modal feel
 * like it's "zipping up" rather than just blinking away. */
const previewScrimIn = keyframes`
	from { opacity: 0; }
	to   { opacity: 1; }
`
const previewScrimOut = keyframes`
	from { opacity: 1; }
	to   { opacity: 0; }
`
const previewPanelIn = keyframes`
	from { opacity: 0; transform: scale(0.94) translateY(10px); }
	to   { opacity: 1; transform: scale(1) translateY(0); }
`
const previewPanelOut = keyframes`
	0%   { opacity: 1; transform: scale(1) translateY(0); }
	50%  { opacity: 0.95; transform: scale(0.99) translateY(2px); }
	80%  { opacity: 0.5; transform: scale(0.95) translateY(10px); }
	100% { opacity: 0; transform: scale(0.9) translateY(18px); }
`

const PreviewBackdrop = styled.div<{ $closing: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1300;
	animation: ${({ $closing }) =>
			$closing ? previewScrimOut : previewScrimIn}
		${({ $closing }) => ($closing ? '400ms' : '220ms')}
		cubic-bezier(0.4, 0, 0.2, 1)
		${({ $closing }) => ($closing ? '320ms' : '0ms')}
		forwards;
`

const PreviewFrame = styled.div<{ $closing: boolean }>`
	background: #ffffff;
	border-radius: 16px;
	width: min(1100px, 94vw);
	max-height: 92vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 30px 60px -20px rgba(15, 23, 42, 0.5);
	animation: ${({ $closing }) =>
			$closing ? previewPanelOut : previewPanelIn}
		${({ $closing }) => ($closing ? '400ms' : '240ms')}
		${({ $closing }) =>
			$closing
				? 'cubic-bezier(0.65, 0, 0.35, 1)'
				: 'cubic-bezier(0.4, 0, 0.2, 1)'}
		${({ $closing }) => ($closing ? '320ms' : '0ms')}
		forwards;
`

/* Grid-row trick: 1fr → 0fr collapses the inner wrapper's height
 * smoothly. The inner element must have `overflow: hidden; min-height: 0`
 * for the collapse to actually clip, hence PreviewCollapseInner. */
const PreviewCollapse = styled.div<{ $closing: boolean }>`
	display: grid;
	grid-template-rows: ${({ $closing }) => ($closing ? '0fr' : '1fr')};
	opacity: ${({ $closing }) => ($closing ? 0 : 1)};
	min-height: 0;
	flex: 1;
	transition:
		grid-template-rows 320ms cubic-bezier(0.4, 0, 0.2, 1),
		opacity 260ms cubic-bezier(0.4, 0, 0.2, 1);
`

const PreviewCollapseInner = styled.div`
	overflow: hidden;
	min-height: 0;
	display: flex;
	flex-direction: column;
`

const PreviewHead = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	padding: 14px 20px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.08);
`

const PreviewTitle = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const PreviewTitleName = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-weight: 700;
	font-size: 15px;
	color: #0f172a;
	letter-spacing: -0.1px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const PreviewTitleMeta = styled.div`
	font-size: 11.5px;
	font-weight: 500;
	color: #94a3b8;
`

const PreviewHeadActions = styled.div`
	display: inline-flex;
	gap: 8px;
	flex-shrink: 0;
`

const PreviewBody = styled.div`
	flex: 1;
	min-height: 0;
	overflow: auto;
	/* Off-white stage so centred media (images, PDFs, video posters)
	 *  reads as "framed" rather than wall-to-wall. Padding gives
	 *  breathing room on all four sides. */
	background: #f7f8fa;
	padding: 28px 32px;
	display: flex;
	flex-direction: column;
`

/* Preview close affordance — the ONLY header action now.
 *  - Keeps its 1 px border at all times.
 *  - No background change on hover (owner hates the translucent
 *    wash). The hover effect is purely on the glyph: it rotates
 *    90° and darkens from slate to ink. */
const PreviewCloseBtn = styled.button`
	appearance: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0;
	width: 38px;
	height: 38px;
	border-radius: 11px;
	border: 1px solid rgba(15, 23, 42, 0.14);
	background: transparent;
	color: #64748b;
	cursor: pointer;
	transition:
		color 220ms ease,
		border-color 220ms ease;

	& > svg {
		transition: transform 320ms cubic-bezier(0.65, 0, 0.35, 1);
	}

	&:hover {
		color: #0f172a;
		border-color: rgba(15, 23, 42, 0.28);
	}
	&:hover > svg {
		transform: rotate(90deg);
	}
	&:active > svg {
		transform: rotate(90deg) scale(0.9);
	}
	&:focus-visible {
		outline: 2px solid #0f172a;
		outline-offset: 2px;
	}
`

/* ─── Sidebar + Storage card ─────────────────────────────────────── */

const PageLayout = styled.div`
	display: grid;
	grid-template-columns: 280px minmax(0, 1fr);
	gap: 18px;
	align-items: start;
	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`

const Sidebar = styled.aside`
	display: flex;
	flex-direction: column;
	gap: 16px;
	position: sticky;
	top: 12px;
	@media (max-width: 900px) {
		position: static;
	}
`

const SideSection = styled.div`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.06);
	border-radius: 16px;
	padding: 14px 10px;
`

const SideHead = styled.div`
	padding: 4px 10px 12px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: #94a3b8;
`

const TreeList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
	/* Keep tree rows within sidebar width — long folder names
	 * truncate with an ellipsis instead of pushing a horizontal
	 * scrollbar. The native title attribute on each row shows
	 * the full name on hover. */
	min-width: 0;
`

/* Depth-aware indent: generous for the first few levels (visually
 * clear), compressed from depth 4+ (so deeply-nested trees stay
 * readable inside the sidebar instead of running off-screen). */
const indentFor = (depth: number) => {
	if (depth <= 3) return 10 + depth * 16
	return 10 + 3 * 16 + (depth - 3) * 8
}

const treeTooltipIn = keyframes`
	from { opacity: 0; transform: translateY(-4px); }
	to   { opacity: 1; transform: translateY(0); }
`
const treeTooltipOut = keyframes`
	from { opacity: 1; transform: translateY(0); }
	to   { opacity: 0; transform: translateY(-3px); }
`

const TreeTooltipPop = styled.div<{ $closing: boolean }>`
	position: fixed;
	z-index: 10000;
	padding: 6px 10px;
	border-radius: 7px;
	background: #0f172a;
	color: #ffffff;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 11.5px;
	font-weight: 500;
	letter-spacing: 0.1px;
	line-height: 1.3;
	/* Single line, hugs content width — no wrapping, no max-width. */
	white-space: nowrap;
	pointer-events: none;
	box-shadow: 0 10px 24px -8px rgba(15, 23, 42, 0.4),
		0 2px 4px rgba(15, 23, 42, 0.15);
	animation: ${({ $closing }) => ($closing ? treeTooltipOut : treeTooltipIn)}
		${({ $closing }) => ($closing ? '160ms' : '180ms')}
		cubic-bezier(0.22, 1, 0.36, 1) both;
`

const TreeRow = styled.div<{ $active: boolean; $depth: number }>`
	position: relative;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 10px 8px ${({ $depth }) => indentFor($depth)}px;
	border-radius: 8px;
	cursor: pointer;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 14px;
	font-weight: ${({ $active }) => ($active ? 600 : 500)};
	color: ${({ $active }) => ($active ? '#0f172a' : '#334155')};
	background: ${({ $active }) =>
		$active ? 'rgba(15, 23, 42, 0.06)' : 'transparent'};
	min-width: 0;
	transition: background 140ms ease, color 140ms ease;
	&:hover {
		background: rgba(15, 23, 42, 0.04);
	}
`

/* Height-animated container for a branch's children — opens from 0
 * to measured scrollHeight and back, 240ms soft easing. Overflow
 * hidden only during the transition; released to visible once
 * expanded so hover shadows don't get clipped. */
const TreeChildren = styled.div`
	overflow: hidden;
	height: 0;
	transition: height 240ms cubic-bezier(0.22, 1, 0.36, 1);
`

const TreeTwist = styled.span<{ $open: boolean; $visible?: boolean }>`
	width: 16px;
	height: 16px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #94a3b8;
	visibility: ${({ $visible }) => ($visible === false ? 'hidden' : 'visible')};
	transition: transform 160ms ease;
	transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
`

const TreeName = styled.span`
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const TreeCount = styled.span`
	font-size: 11px;
	font-weight: 600;
	color: #94a3b8;
	padding: 2px 8px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	min-width: 22px;
	text-align: center;
`

const MainCol = styled.div`
	min-width: 0;
`

const StorageCard = styled.div`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.06);
	border-radius: 16px;
	padding: 16px 14px;
`


/* ─── Storage hero (big number + playful accent) ─────────────────── */

const HeroEyebrow = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 1.2px;
	text-transform: uppercase;
	color: #94a3b8;
	padding-bottom: 6px;
`

const HeroNumber = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 30px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -1px;
	line-height: 1;
`

const HeroMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding-top: 10px;
	padding-bottom: 20px;
`

const HeroMetaCount = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 13px;
	font-weight: 700;
	color: #0f172a;
	font-variant-numeric: tabular-nums;
	span {
		font-weight: 500;
		color: #94a3b8;
		margin-left: 4px;
	}
`

const HeroMetaSep = styled.span`
	color: #cbd5e1;
	font-weight: 500;
`

/* Full-width signature composition — no pill, three vertical rows.
 * Eyebrow caps up top, then a big display word anchor with an
 * orange squiggle underline on the "b2" syllable, then a muted
 * tail with pulsing dot + status copy. */
const HeroAccent = styled.div<{ $noDivider?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding-top: ${({ $noDivider }) => ($noDivider ? '0' : '16px')};
	border-top: ${({ $noDivider }) =>
		$noDivider ? 'none' : '1px solid rgba(15, 23, 42, 0.08)'};
`

const HeroAccentHead = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 28px;
	font-weight: 800;
	letter-spacing: -0.8px;
	line-height: 1.1;
	.orange { color: #e85d2f; }
	.black { color: #0f172a; }
`
