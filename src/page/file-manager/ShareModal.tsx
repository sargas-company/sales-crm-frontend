import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
	ContentCopyRounded,
	DeleteOutlineRounded,
	FolderOutlined,
	InsertDriveFileOutlined,
	LinkRounded,
	PeopleOutlineRounded,
} from '@mui/icons-material'

import ConfirmModal from '../../components/_shared/ConfirmModal'
import { useToast } from '../../context/toast/ToastContext'
import {
	useCreateInviteMutation,
	useCreateShareMutation,
	useListPortalUsersQuery,
	useListSharesOnResourceQuery,
	type ShareBlueprint,
	type ShareResourceType,
} from '../../store/file-manager/fileManagerShareApi'

interface Props {
	/** The resource the admin right-clicked. More can be added via
	 *  [+ Add resource] below. */
	initial: {
		resourceType: ShareResourceType
		resourceId: string
		resourceName: string
	}
	onClose: () => void
}

/* Admin "Share" modal — right-click on a folder/file surfaces this.
 * Two tabs:
 *   1. Share with existing worker (direct, instant grant)
 *   2. Create invite link (bundle of resources + Discord sign-in URL)
 * Below: list of existing shares on the current resource with
 *       Edit / Revoke controls. */
export const ShareModal = ({ initial, onClose }: Props) => {
	const [mode, setMode] = useState<'direct' | 'invite'>('invite')
	const [resources, setResources] = useState<
		Array<ShareBlueprint & { resourceName: string }>
	>([
		{
			resourceType: initial.resourceType,
			resourceId: initial.resourceId,
			resourceName: initial.resourceName,
			recursive: true,
			canDownload: true,
			canUpload: true,
			canCreateSubfolders: true,
		},
	])
	/* Default 7-day expiry — owner-approved: UI knob removed since
	 * one week covers every realistic case; longer windows are rare
	 * enough that admin can regenerate the invite when needed. */
	const expiresInDays = 7
	const [note, setNote] = useState('')
	const [selectedUserId, setSelectedUserId] = useState<string>('')
	const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
	/* Mirrors PortalUserDetailModal: route Done through a local flag
	 * so ConfirmModal plays its exit animation before unmounting. */
	const [closing, setClosing] = useState(false)

	const { showToast } = useToast()
	const { data: portalUsers = [] } = useListPortalUsersQuery(undefined, {
		skip: mode !== 'direct',
	})
	const { data: existingShares = [] } = useListSharesOnResourceQuery({
		resourceType: initial.resourceType,
		resourceId: initial.resourceId,
	})
	const [createInvite, { isLoading: creatingInvite }] = useCreateInviteMutation()
	const [createShare, { isLoading: creatingShare }] = useCreateShareMutation()

	/* Dropdown shows only workers who DON'T already have access to
	 * this resource. The already-shared list is intentionally gone —
	 * shares are managed from the Portal Users admin page instead. */
	const availableWorkers = useMemo(() => {
		const taken = new Set(existingShares.map((s) => s.userId))
		return portalUsers.filter((u) => u.active && !taken.has(u.id))
	}, [portalUsers, existingShares])

	const updateRes = (
		idx: number,
		patch: Partial<ShareBlueprint & { resourceName: string }>,
	) => {
		setResources((rs) =>
			rs.map((r, i) => {
				if (i !== idx) return r
				const merged = { ...r, ...patch }
				/* Create-subfolders only makes sense WITH recursive — a
				 * subfolder created in a non-recursive share is invisible
				 * to the worker (they can see this folder's immediate
				 * children, not deeper). So turning recursive off also
				 * forces canCreateSubfolders off. */
				if (patch.recursive === false) merged.canCreateSubfolders = false
				return merged
			}),
		)
	}
	const removeRes = (idx: number) =>
		setResources((rs) => rs.filter((_, i) => i !== idx))

	const handleCreate = async () => {
		if (mode === 'invite') {
			if (resources.length === 0) return
			try {
				const res = await createInvite({
					shares: resources.map((r) => ({
						resourceType: r.resourceType,
						resourceId: r.resourceId,
						recursive: r.recursive,
						canDownload: r.canDownload,
						canUpload: r.canUpload,
						canCreateSubfolders: r.canCreateSubfolders,
					})),
					expiresInDays,
					note: note || undefined,
				}).unwrap()
				const envPortal = (
					import.meta as unknown as { env?: Record<string, string | undefined> }
				).env?.VITE_PORTAL_URL
				/* Build portal origin by swapping the leftmost subdomain
				 *  with "files": admin.sargas.io → files.sargas.io, and
				 *  bare localhost → files.localhost. Port and protocol
				 *  carry over via the URL object. */
				const toPortalOrigin = (href: string): string => {
					const u = new URL(href)
					const parts = u.hostname.split('.')
					if (parts.length === 1) {
						u.hostname = `files.${parts[0]}`
					} else {
						parts[0] = 'files'
						u.hostname = parts.join('.')
					}
					return u.origin
				}
				const portalBase = envPortal ?? toPortalOrigin(window.location.origin)
				setGeneratedUrl(`${portalBase}/invite/${res.token}`)
				showToast('Invite created', 'success')
			} catch (e) {
				const msg =
					(e as { data?: { message?: string } })?.data?.message ??
					'Failed to create invite'
				showToast(msg, 'error')
			}
		} else {
			if (!selectedUserId) {
				showToast('Pick a worker first', 'error')
				return
			}
			try {
				/* Direct mode shares one resource at a time (the one the
				 * admin opened the modal on). Bundle is invite-only. */
				const r = resources[0]
				await createShare({
					userId: selectedUserId,
					share: {
						resourceType: r.resourceType,
						resourceId: r.resourceId,
						recursive: r.recursive,
						canDownload: r.canDownload,
						canUpload: r.canUpload,
						canCreateSubfolders: r.canCreateSubfolders,
					},
				}).unwrap()
				showToast('Share granted', 'success')
				setClosing(true)
			} catch (e) {
				const msg =
					(e as { data?: { message?: string } })?.data?.message ??
					'Failed to grant share'
				showToast(msg, 'error')
			}
		}
	}

	const copyUrl = () => {
		if (!generatedUrl) return
		navigator.clipboard.writeText(generatedUrl).catch(() => undefined)
		showToast('Copied', 'success')
	}

	return (
		<ConfirmModal
			icon={<PeopleOutlineRounded />}
			iconTone='ink'
			title='Share'
			description={<ModeTabs mode={mode} setMode={setMode} locked={!!generatedUrl} />}
			confirmLabel={
				mode === 'invite'
					? generatedUrl
						? 'Done'
						: 'Create invite'
					: 'Grant access'
			}
			confirmColor='ink'
			cancelLabel='Cancel'
			onConfirm={generatedUrl ? () => setClosing(true) : handleCreate}
			onClose={onClose}
			forceClose={closing}
			maxWidth={620}
			isLoading={creatingInvite || creatingShare}
		>
			<SmoothHeight>
				<BodyInner>
				{/* Hero — dark ink gradient strip with the initial
				 *  resource's mime-color badge + name + type chip. Same
				 *  language as the Portal User detail modal. */}
				<Hero>
					<HeroBg />
					<HeroBadge>
						{initial.resourceType === 'FOLDER' ? (
							<FileBadgeFolder>
								<FileBadgeFold />
								<FileBadgeExt>DIR</FileBadgeExt>
							</FileBadgeFolder>
						) : (
							<FileBadgeFile $kind={fileKind(initial.resourceName)}>
								<FileBadgeFold />
								<FileBadgeExt>{fileExt(initial.resourceName)}</FileBadgeExt>
							</FileBadgeFile>
						)}
					</HeroBadge>
					<HeroInfo>
						<HeroName>{initial.resourceName}</HeroName>
						<HeroType>
							{initial.resourceType === 'FOLDER' ? 'Folder' : 'File'} ·{' '}
							{resources.length === 1
								? 'granting access to this one'
								: `+ ${resources.length - 1} more in bundle`}
						</HeroType>
					</HeroInfo>
				</Hero>
				{/* Stable section order to eliminate reflow jumps:
				 *  Resources is ALWAYS second (right under the Hero), and
				 *  the variable block (Worker in direct / Note in invite)
				 *  is ALWAYS third. Resources never changes position when
				 *  the user flips modes — only the third block swaps and
				 *  plays its fade-in. */}
				{!generatedUrl && (
					<Section>
						<SectionTitle>Resources to grant</SectionTitle>
						{resources.map((r, idx) => (
							<ResourceCardV4
								key={`${r.resourceType}:${r.resourceId}`}
								r={r}
								idx={idx}
								canRemove={idx > 0 && mode === 'invite'}
								onUpdate={updateRes}
								onRemove={removeRes}
							/>
						))}
					</Section>
				)}

				{mode === 'direct' && !generatedUrl && (
					<Section key='worker'>
						<SectionTitle>Worker</SectionTitle>
						<Select
							value={selectedUserId}
							onChange={(e) => setSelectedUserId(e.target.value)}
						>
							<option value=''>Select a worker…</option>
							{availableWorkers.map((u) => (
								<option key={u.id} value={u.id}>
									{u.displayName ?? u.firstName ?? u.email}
								</option>
							))}
						</Select>
						{availableWorkers.length === 0 && (
							<DropdownEmpty>
								{portalUsers.length === 0
									? 'No portal users yet — invite someone first.'
									: 'All active workers already have access to this resource.'}
							</DropdownEmpty>
						)}
					</Section>
				)}

				{!generatedUrl && mode === 'invite' && (
					<Section key='note'>
						<SectionTitle>Note (optional)</SectionTitle>
						<Row>
							<NoteArea
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder='Internal note for yourself'
								rows={3}
							/>
						</Row>
					</Section>
				)}

				{generatedUrl && (
					<Section>
						<InviteSuccessBlock>
							<InviteSuccessHeadRow>
								<InviteSuccessPing>✓</InviteSuccessPing>
								<InviteSuccessHeadText>
									<InviteSuccessTitle>Invite created</InviteSuccessTitle>
									<InviteSuccessSub>
										Single-use · expires in {expiresInDays} days
									</InviteSuccessSub>
								</InviteSuccessHeadText>
							</InviteSuccessHeadRow>
							<InviteUrlRow>
								<LinkRounded style={{ fontSize: 16, color: 'rgba(203,213,225,0.7)' }} />
								<InviteUrlInput value={generatedUrl} readOnly />
								<InviteCopyBtn type='button' onClick={copyUrl}>
									<ContentCopyRounded style={{ fontSize: 15 }} />
									Copy
								</InviteCopyBtn>
							</InviteUrlRow>
							<InviteHint>
								Send this link to the worker — Discord sign-in on open,
								access granted on accept.
							</InviteHint>
						</InviteSuccessBlock>
					</Section>
				)}

				</BodyInner>
			</SmoothHeight>
		</ConfirmModal>
	)
}

/* Adaptive sliding tabs — mirrors the TapePills pattern from
 * src/page/analytics/filters/filters.styled.ts but in ink/dark
 * tone to fit the admin modal. The indicator tracks the active
 * pill's rect so widths adapt to text and the slide is smooth. */
const ModeTabs = ({
	mode,
	setMode,
	locked,
}: {
	mode: 'invite' | 'direct'
	setMode: (m: 'invite' | 'direct') => void
	locked?: boolean
}) => {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const inviteRef = useRef<HTMLButtonElement | null>(null)
	const directRef = useRef<HTMLButtonElement | null>(null)
	const [rect, setRect] = useState<{ left: number; width: number } | null>(null)

	useLayoutEffect(() => {
		const container = containerRef.current
		const active = mode === 'invite' ? inviteRef.current : directRef.current
		if (!container || !active) return
		/* Use offset* instead of getBoundingClientRect to dodge the
		 * ConfirmModal's scale(0.94→1) enter animation returning
		 * transformed (shrunk) rect values. offsetLeft/Width are the
		 * unscaled layout box. */
		const measure = () =>
			setRect({ left: active.offsetLeft, width: active.offsetWidth })
		measure()
		const t = window.setTimeout(measure, 260) // re-measure after enter settles
		return () => window.clearTimeout(t)
	}, [mode])

	const measured = rect !== null && rect.width > 0

	return (
		<TabsBar ref={containerRef} $locked={!!locked}>
			<TabIndicator
				$visible={measured}
				style={{
					transform: `translateX(${rect?.left ?? 0}px)`,
					width: rect?.width ?? 0,
				}}
			/>
			<TabPill
				ref={inviteRef}
				type='button'
				$active={mode === 'invite'}
				$measured={measured}
				disabled={locked}
				onClick={() => !locked && setMode('invite')}
			>
				Create invite link
			</TabPill>
			<TabPill
				ref={directRef}
				type='button'
				$active={mode === 'direct'}
				$measured={measured}
				disabled={locked}
				onClick={() => !locked && setMode('direct')}
			>
				Share with existing worker
			</TabPill>
		</TabsBar>
	)
}

const TabsBar = styled.div<{ $locked?: boolean }>`
	position: relative;
	display: inline-flex;
	gap: 2px;
	padding: 3px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.06);
	align-items: center;
	margin-top: 10px;
	opacity: ${({ $locked }) => ($locked ? 0.5 : 1)};
	transition: opacity 220ms ease;
`
const TabIndicator = styled.span<{ $visible: boolean }>`
	position: absolute;
	top: 3px;
	bottom: 3px;
	left: 0;
	border-radius: 999px;
	background: #0f172a;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transition:
		transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		width 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		opacity 160ms ease;
	pointer-events: none;
	will-change: transform, width;
	@media (prefers-reduced-motion: reduce) {
		transition: transform 0ms, width 0ms, opacity 0ms;
	}
`
/* Text colour depends on BOTH active state AND whether the indicator
 * has been measured. Before measurement the indicator has width 0
 * so "white on nothing" would look blank — fall back to ink until
 * the first measurement arrives, then animate to white. */
const TabPill = styled.button<{ $active: boolean; $measured: boolean }>`
	position: relative;
	z-index: 1;
	padding: 8px 16px;
	border-radius: 999px;
	border: none;
	background: transparent;
	color: ${({ $active, $measured }) =>
		$active && $measured ? '#ffffff' : '#64748b'};
	font: inherit;
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.1px;
	white-space: nowrap;
	cursor: pointer;
	transition: color 240ms cubic-bezier(0.22, 1, 0.36, 1);
	&:hover {
		color: ${({ $active, $measured }) =>
			$active && $measured ? '#fff' : '#0f172a'};
	}
	&:disabled {
		cursor: not-allowed;
	}
	&:disabled:hover {
		color: ${({ $active, $measured }) =>
			$active && $measured ? '#ffffff' : '#64748b'};
	}
`
/* Smooth-height container — animates its own height when child
 * content changes (e.g. tab switch adds/removes a section). We
 * measure the inner wrapper via ResizeObserver and set an explicit
 * pixel height on the outer so the CSS transition on `height` has
 * something to interpolate. On the first paint we fall back to
 * auto to avoid a 0 → N jump animation on mount. */
/* Resource-type helpers for the mime-color badge — same palette and
 * logic as PortalUsersPage. Kept inline so the ShareModal is
 * self-contained. */
const fileKind = (name: string): 'pdf' | 'img' | 'doc' | 'other' => {
	const ext = (name.split('.').pop() ?? '').toLowerCase()
	if (ext === 'pdf') return 'pdf'
	if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'avif'].includes(ext))
		return 'img'
	if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'md', 'txt', 'json'].includes(ext))
		return 'doc'
	return 'other'
}
const fileExt = (name: string): string => {
	const i = name.lastIndexOf('.')
	if (i < 0 || i === name.length - 1) return 'FILE'
	return name.slice(i + 1, i + 5).toUpperCase()
}

const SmoothHeight = ({ children }: { children: ReactNode }) => {
	const innerRef = useRef<HTMLDivElement | null>(null)
	const [h, setH] = useState<number | null>(null)
	useLayoutEffect(() => {
		if (!innerRef.current) return
		const el = innerRef.current
		/* `offsetHeight` returns the unscaled layout height. We use it
		 * instead of `getBoundingClientRect().height` because the
		 * surrounding ConfirmModal plays a `scale(0.94) → 1` enter
		 * animation; GBCR returns transformed (scaled) values during
		 * that window, so the measurement would come in short and the
		 * SmoothHeightOuter would clip the content. */
		const update = () => setH(el.offsetHeight)
		update()
		const ro = new ResizeObserver(update)
		ro.observe(el)
		/* One extra re-measure a tick after mount so we lock in the
		 * final height after the modal's enter animation settles. */
		const t = window.setTimeout(update, 260)
		return () => {
			ro.disconnect()
			window.clearTimeout(t)
		}
	}, [])
	return (
		<SmoothHeightOuter style={{ height: h === null ? 'auto' : `${h}px` }}>
			<div ref={innerRef}>{children}</div>
		</SmoothHeightOuter>
	)
}
const SmoothHeightOuter = styled.div`
	position: relative;
	/* clip during the transition only so focus outlines / drop
	 * shadows aren't permanently hidden; we flip to visible once the
	 * height is set so interactive elements render fully. */
	overflow: clip;
	transition: height 320ms cubic-bezier(0.22, 1, 0.36, 1);
	@media (prefers-reduced-motion: reduce) {
		transition: height 0ms;
	}
`
const BodyInner = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	/* Symmetric vertical padding — top gives the body room to breathe
	 * below the tabs; bottom keeps content from butting against the
	 * SmoothHeightOuter clip edge (textarea resize-grips, focus rings
	 * and section drop-shadows need a few px of room). */
	padding: 14px 2px 18px;
`
/* Section mount animation — synced with SmoothHeight so new blocks
 * (Worker select, Note, Invite link) rise into the growing space
 * instead of popping. Delay lets height expand first; longer
 * duration + larger offset make the motion read as deliberate. */
const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
	animation: fadeInSection 420ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
	@keyframes fadeInSection {
		from { opacity: 0; transform: translateY(-10px); filter: blur(2px); }
		to { opacity: 1; transform: translateY(0); filter: blur(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		animation-duration: 1ms;
		animation-delay: 0ms;
	}
`
const SectionTitle = styled.div`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 11.5px;
	font-weight: 500;
	color: #94a3b8;
	text-transform: uppercase;
	letter-spacing: 0.6px;
`
const Row = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`
const Label = styled.label`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 12.5px;
	font-weight: 600;
	color: #64748b;
	letter-spacing: 0.1px;
`
/* Custom select — kills the OS-native arrow + font, replaces with
 * a thin chevron SVG on the right. Matches the Input visual language
 * so the two don't clash side-by-side. */
const Select = styled.select`
	appearance: none;
	-webkit-appearance: none;
	padding: 11px 40px 11px 14px;
	border: 1px solid rgba(15, 23, 42, 0.12);
	border-radius: 10px;
	background-color: #ffffff;
	background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
	background-repeat: no-repeat;
	background-position: right 12px center;
	background-size: 16px;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	font-weight: 400;
	color: #0f172a;
	line-height: 1.4;
	cursor: pointer;
	transition: border-color 160ms ease;
	&:hover { border-color: rgba(15, 23, 42, 0.25); }
	&:focus {
		outline: 2px solid rgba(15, 23, 42, 0.2);
		outline-offset: -2px;
		border-color: #0f172a;
	}
`
const Input = styled.input`
	padding: 11px 14px;
	border: 1px solid rgba(15, 23, 42, 0.12);
	border-radius: 10px;
	background: #ffffff;
	font: inherit;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	color: #0f172a;
	transition: border-color 160ms ease;
	&::placeholder { color: #94a3b8; }
	&:hover { border-color: rgba(15, 23, 42, 0.25); }
	&:focus { outline: 2px solid rgba(15, 23, 42, 0.2); outline-offset: -2px; border-color: #0f172a; }
`
/* Note field — multi-line, roughly 2× the single-line Input height. */
const NoteArea = styled.textarea`
	padding: 12px 14px;
	border: 1px solid rgba(15, 23, 42, 0.12);
	border-radius: 10px;
	background: #ffffff;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	line-height: 1.5;
	color: #0f172a;
	min-height: 90px;
	resize: vertical;
	transition: border-color 160ms ease;
	&::placeholder { color: #94a3b8; }
	&:hover { border-color: rgba(15, 23, 42, 0.25); }
	&:focus { outline: 2px solid rgba(15, 23, 42, 0.2); outline-offset: -2px; border-color: #0f172a; }
`
/* ─── Resource card variants (temporary showcase) ────────────────── */

interface ResCardProps {
	r: ShareBlueprint & { resourceName: string }
	idx: number
	canRemove: boolean
	onUpdate: (idx: number, patch: Partial<ShareBlueprint & { resourceName: string }>) => void
	onRemove: (idx: number) => void
}

/* Mini permission icons — same as the PortalUserDetail matrix so the
 * two surfaces share the "download / upload / mkdir / recursive"
 * visual vocabulary. 18px, inherits colour via `currentColor`. */
const IconDl = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M12 3v12m0 0l-5-5m5 5l5-5M4 21h16' />
	</svg>
)
const IconUp = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M12 21V9m0 0l-5 5m5-5l5 5M4 3h16' />
	</svg>
)
const IconMkdir = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z' />
		<path d='M12 11v6M9 14h6' />
	</svg>
)
const IconRec = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M17 2.5a7 7 0 0 1 0 10l-3 3a7 7 0 0 1-10-10l1.5-1.5M7 21.5a7 7 0 0 1 0-10l3-3a7 7 0 0 1 10 10l-1.5 1.5' />
	</svg>
)

/* iOS-style toggle switches. Larger, more tactile; each row
 * has a label on the left and a sliding switch on the right. */
const Toggle = ({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) => (
	<ToggleTrack $on={on} $disabled={!!disabled} onClick={() => !disabled && onChange(!on)} role='switch' aria-checked={on}>
		<ToggleThumb $on={on} />
	</ToggleTrack>
)
const ResourceCardV4 = ({ r, idx, canRemove, onUpdate, onRemove }: ResCardProps) => (
	<ResourceCard>
		<ResourceHead>
			{r.resourceType === 'FOLDER' ? (
				<FileBadgeFolder>
					<FileBadgeFold />
					<FileBadgeExt>DIR</FileBadgeExt>
				</FileBadgeFolder>
			) : (
				<FileBadgeFile $kind={fileKind(r.resourceName)}>
					<FileBadgeFold />
					<FileBadgeExt>{fileExt(r.resourceName)}</FileBadgeExt>
				</FileBadgeFile>
			)}
			<ResourceName>{r.resourceName}</ResourceName>
			{canRemove && (
				<RemoveBtn type='button' onClick={() => onRemove(idx)}>
					<DeleteOutlineRounded style={{ fontSize: 16 }} />
				</RemoveBtn>
			)}
		</ResourceHead>
		<ToggleStack>
			<ToggleRow>
				<ToggleLabel>
					<PermGlyph $on={r.canDownload}><IconDl /></PermGlyph>
					Download
				</ToggleLabel>
				<Toggle on={r.canDownload} onChange={(v) => onUpdate(idx, { canDownload: v })} />
			</ToggleRow>
			<ToggleRow>
				<ToggleLabel $muted={r.resourceType === 'FILE'}>
					<PermGlyph $on={r.canUpload}><IconUp /></PermGlyph>
					Upload
				</ToggleLabel>
				<Toggle on={r.canUpload} disabled={r.resourceType === 'FILE'} onChange={(v) => onUpdate(idx, { canUpload: v })} />
			</ToggleRow>
			{r.resourceType === 'FOLDER' && (
				<>
					<ToggleRow>
						<ToggleLabel>
							<PermGlyph $on={r.recursive}><IconRec /></PermGlyph>
							Recursive
						</ToggleLabel>
						<Toggle on={r.recursive} onChange={(v) => onUpdate(idx, { recursive: v })} />
					</ToggleRow>
					<ToggleRow>
						<ToggleLabel $muted={!r.recursive}>
							<PermGlyph $on={r.canCreateSubfolders}><IconMkdir /></PermGlyph>
							Create subfolders
							{!r.recursive && <DepHint>— needs Recursive</DepHint>}
						</ToggleLabel>
						<Toggle on={r.canCreateSubfolders} disabled={!r.recursive} onChange={(v) => onUpdate(idx, { canCreateSubfolders: v })} />
					</ToggleRow>
				</>
			)}
		</ToggleStack>
	</ResourceCard>
)

/* ─── Toggle switches styled ──────────────────────────────────── */

const ToggleStack = styled.div`
	display: flex;
	flex-direction: column;
`
const ToggleRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 0;
	border-bottom: 1px solid rgba(15, 23, 42, 0.05);
	&:last-child { border-bottom: none; }
`
const ToggleLabel = styled.div<{ $muted?: boolean }>`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 13.5px;
	font-weight: 400;
	color: ${({ $muted }) => ($muted ? '#94a3b8' : '#334155')};
	display: inline-flex;
	align-items: center;
	gap: 10px;
`

/* Permission glyph capsule — ink circle with white icon when the
 * perm is on, light-slate pill with faded icon when off. Keeps the
 * same vocabulary as the PortalUserDetail matrix. */
const PermGlyph = styled.span<{ $on: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	background: ${({ $on }) => ($on ? '#0f172a' : 'rgba(15, 23, 42, 0.05)')};
	color: ${({ $on }) => ($on ? '#ffffff' : 'rgba(15, 23, 42, 0.3)')};
	transition: background 220ms ease, color 220ms ease;
	flex: 0 0 auto;
`
const ToggleTrack = styled.div<{ $on: boolean; $disabled: boolean }>`
	position: relative;
	width: 40px;
	height: 24px;
	border-radius: 999px;
	background: ${({ $on, $disabled }) =>
		$disabled
			? 'rgba(15, 23, 42, 0.08)'
			: $on
				? '#0f172a'
				: 'rgba(15, 23, 42, 0.18)'};
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
	transition: background 200ms ease;
	flex: 0 0 auto;
`
const ToggleThumb = styled.div<{ $on: boolean }>`
	position: absolute;
	top: 2px;
	left: ${({ $on }) => ($on ? '18px' : '2px')};
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: #ffffff;
	box-shadow: 0 2px 4px rgba(15, 23, 42, 0.2);
	transition: left 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
`

/* ─── Hero + resource badge (same aesthetic as PortalUserDetail) ── */
const Hero = styled.div`
	position: relative;
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 14px;
	align-items: center;
	padding: 16px 18px;
	border-radius: 14px;
	overflow: hidden;
`
const HeroBg = styled.div`
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
const HeroBadge = styled.div`
	position: relative;
	z-index: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
`
const HeroInfo = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`
const HeroName = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 17px;
	font-weight: 800;
	color: #ffffff;
	letter-spacing: -0.3px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const HeroType = styled.div`
	font-size: 12px;
	color: rgba(203, 213, 225, 0.85);
`

/* Mime-color badges — same shape as PortalUsersPage so the two
 * modals share the resource visual language. */
const FileBadgeFolder = styled.div`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding-bottom: 4px;
	width: 36px;
	height: 42px;
	border-radius: 6px;
	background: linear-gradient(135deg, #475569, #334155);
	box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.4);
`
const FileBadgeFile = styled.div<{ $kind: 'pdf' | 'img' | 'doc' | 'other' }>`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding-bottom: 4px;
	width: 36px;
	height: 42px;
	border-radius: 6px;
	background: ${({ $kind }) =>
		$kind === 'pdf'
			? 'linear-gradient(135deg, #f87171, #dc2626)'
			: $kind === 'img'
				? 'linear-gradient(135deg, #60a5fa, #2563eb)'
				: $kind === 'doc'
					? 'linear-gradient(135deg, #4ade80, #16a34a)'
					: 'linear-gradient(135deg, #fbbf24, #f59e0b)'};
	box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.3);
`
const FileBadgeFold = styled.span`
	position: absolute;
	top: 0;
	right: 0;
	width: 12px;
	height: 12px;
	background: linear-gradient(
		225deg,
		rgba(255, 255, 255, 0.5) 0%,
		rgba(255, 255, 255, 0.5) 50%,
		rgba(0, 0, 0, 0.08) 50%,
		rgba(0, 0, 0, 0.08) 100%
	);
	border-radius: 0 6px 0 5px;
`
const FileBadgeExt = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 9px;
	font-weight: 800;
	letter-spacing: 0.6px;
	color: #ffffff;
`

const ResourceCard = styled.div`
	background: #f8fafc;
	border: 1px solid rgba(15, 23, 42, 0.06);
	border-radius: 12px;
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
`
const ResourceHead = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`
const ResourceIcon = styled.span`
	width: 28px;
	height: 28px;
	border-radius: 8px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.06);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #334155;
`
const ResourceName = styled.span`
	flex: 1;
	font-size: 13.5px;
	font-weight: 500;
	color: #0f172a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const RemoveBtn = styled.button`
	width: 28px;
	height: 28px;
	border-radius: 8px;
	border: none;
	background: transparent;
	color: #94a3b8;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	&:hover { background: rgba(220, 38, 38, 0.08); color: #dc2626; }
`
const DepHint = styled.span`
	margin-left: 2px;
	font-size: 11.5px;
	font-weight: 500;
	color: #94a3b8;
	font-style: italic;
`
/* ─── Invite created — dark hero-style success block ─────────────── */
const InviteSuccessBlock = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px 18px;
	border-radius: 14px;
	background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%);
	overflow: hidden;
	&::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -10%;
		width: 240px;
		height: 240px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(74, 222, 128, 0.18), transparent 70%);
		pointer-events: none;
	}
	& > * { position: relative; z-index: 1; }
`
const InviteSuccessHeadRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 12px;
`
const InviteSuccessPing = styled.div`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: rgba(74, 222, 128, 0.2);
	color: #86efac;
	font-size: 16px;
	font-weight: 800;
	border: 1.5px solid rgba(74, 222, 128, 0.4);
`
const InviteSuccessHeadText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`
const InviteSuccessTitle = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	font-weight: 800;
	color: #ffffff;
	letter-spacing: -0.2px;
`
const InviteSuccessSub = styled.div`
	font-size: 11.5px;
	color: rgba(203, 213, 225, 0.75);
`
const InviteUrlRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.08);
`
const InviteUrlInput = styled.input`
	flex: 1;
	border: none;
	background: transparent;
	font-family: 'JetBrains Mono', 'Inter', monospace;
	font-size: 12.5px;
	color: #e2e8f0;
	outline: none;
	min-width: 0;
`
const InviteCopyBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 8px;
	border: none;
	background: rgba(255, 255, 255, 0.14);
	color: #ffffff;
	font: inherit;
	font-size: 11.5px;
	font-weight: 700;
	cursor: pointer;
	transition: background 160ms ease;
	&:hover { background: rgba(255, 255, 255, 0.22); }
`
const InviteHint = styled.div`
	font-size: 11.5px;
	color: rgba(203, 213, 225, 0.65);
	line-height: 1.5;
`

const UrlRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	border-radius: 10px;
	background: #f8fafc;
	border: 1px solid rgba(15, 23, 42, 0.08);
`
const UrlInput = styled.input`
	flex: 1;
	border: none;
	background: transparent;
	font-family: 'JetBrains Mono', 'Inter', monospace;
	font-size: 12.5px;
	color: #0f172a;
	outline: none;
`
const CopyBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 10px;
	border-radius: 8px;
	border: none;
	background: #0f172a;
	color: #ffffff;
	font: inherit;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
`
const Hint = styled.p`
	font-size: 12px;
	color: #64748b;
	margin: 0;
	line-height: 1.5;
`
const DropdownEmpty = styled.div`
	margin-top: 8px;
	font-size: 12px;
	color: #94a3b8;
	line-height: 1.5;
`
