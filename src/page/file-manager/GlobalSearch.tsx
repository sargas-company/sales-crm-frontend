import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	CloseRounded,
	FolderOutlined,
	KeyboardArrowDown,
	KeyboardArrowUp,
	KeyboardReturn,
	SearchOffOutlined,
	SearchOutlined,
	TravelExploreOutlined,
} from '@mui/icons-material'
import { useSearchFileManagerQuery } from '../../store/file-manager/fileManagerApi'
import { SearchPill } from '../../components/_shared/filters/freshPaperFilters'

const EXIT_MS = 160

interface FlatRow {
	kind: 'folder' | 'file'
	id: string
	name: string
	folderId: string | null
	breadcrumbs: Array<{ id: string; name: string }>
}

const GlobalSearch = () => {
	const navigate = useNavigate()
	const [raw, setRaw] = useState('')
	const [debounced, setDebounced] = useState('')
	const [open, setOpen] = useState(false)
	const [exiting, setExiting] = useState(false)
	const [highlightIdx, setHighlightIdx] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const listRef = useRef<HTMLDivElement>(null)
	/* Ref mirrors `open` so the outside-click listener (bound once on
	 * mount) can read the current state — otherwise it closes over
	 * the first render and never sees the dropdown as open. */
	const openRef = useRef(false)
	useEffect(() => {
		openRef.current = open
	}, [open])

	useEffect(() => {
		const t = window.setTimeout(() => setDebounced(raw.trim()), 300)
		return () => window.clearTimeout(t)
	}, [raw])

	useEffect(() => {
		const onDown = (e: MouseEvent) => {
			if (!openRef.current) return
			if (!containerRef.current) return
			if (!containerRef.current.contains(e.target as Node)) closeDropdown()
		}
		document.addEventListener('mousedown', onDown)
		return () => document.removeEventListener('mousedown', onDown)
	}, [])

	const enabled = debounced.length >= 2
	const { data, isFetching } = useSearchFileManagerQuery(debounced, {
		skip: !enabled,
	})

	/* 3-dot wave loader with an 800 ms minimum visibility window.
	 * Fires on every search; keeps spinning briefly even if the
	 * response is nearly instant, so results don't flash in. The
	 * previous (stale) rows stay hidden while the loader is up. */
	const [loaderVisible, setLoaderVisible] = useState(false)
	const loaderStartedRef = useRef<number | null>(null)
	useEffect(() => {
		if (!enabled) {
			setLoaderVisible(false)
			loaderStartedRef.current = null
			return
		}
		if (isFetching) {
			if (!loaderVisible) {
				setLoaderVisible(true)
				loaderStartedRef.current = performance.now()
			}
			return
		}
		if (!loaderVisible) return
		const started = loaderStartedRef.current ?? performance.now()
		const elapsed = performance.now() - started
		const remaining = Math.max(0, 800 - elapsed)
		const t = window.setTimeout(() => {
			setLoaderVisible(false)
			loaderStartedRef.current = null
		}, remaining)
		return () => window.clearTimeout(t)
	}, [enabled, isFetching, loaderVisible])

	const folderHits = data?.folders ?? []
	const fileHits = data?.files ?? []
	const nothing =
		enabled &&
		!loaderVisible &&
		folderHits.length === 0 &&
		fileHits.length === 0

	/* Flat row list drives keyboard navigation — index into this
	 * array corresponds to the visual order of hits (folders first,
	 * then files). Section heads are not focusable. */
	const flatRows = useMemo<FlatRow[]>(() => {
		return [
			...folderHits.map((f) => ({
				kind: 'folder' as const,
				id: f.id,
				name: f.name,
				folderId: f.id,
				breadcrumbs: f.breadcrumbs,
			})),
			...fileHits.map((f) => ({
				kind: 'file' as const,
				id: f.id,
				name: f.originalName,
				folderId: f.folderId,
				breadcrumbs: f.breadcrumbs,
			})),
		]
	}, [folderHits, fileHits])

	useEffect(() => {
		setHighlightIdx(0)
	}, [debounced])

	useEffect(() => {
		if (!open || flatRows.length === 0) return
		const el = listRef.current?.querySelector<HTMLButtonElement>(
			`[data-row-idx="${highlightIdx}"]`,
		)
		el?.scrollIntoView({ block: 'nearest' })
	}, [highlightIdx, open, flatRows.length])

	const closeDropdown = () => {
		if (!openRef.current) return
		setExiting(true)
		window.setTimeout(() => {
			setOpen(false)
			setExiting(false)
		}, EXIT_MS)
	}

	const openDropdown = () => {
		setOpen(true)
		setExiting(false)
	}

	const goRow = (row: FlatRow) => {
		if (row.kind === 'folder') navigate(`/file-manager/folder/${row.id}`)
		else navigate(row.folderId ? `/file-manager/folder/${row.folderId}` : '/file-manager')
		closeDropdown()
	}

	const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			if (raw) {
				setRaw('')
				setDebounced('')
			} else {
				closeDropdown()
				inputRef.current?.blur()
			}
			return
		}
		if (!open) return
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			if (flatRows.length === 0) return
			setHighlightIdx((i) => (i + 1) % flatRows.length)
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			if (flatRows.length === 0) return
			setHighlightIdx((i) => (i - 1 + flatRows.length) % flatRows.length)
		} else if (e.key === 'Enter') {
			e.preventDefault()
			const row = flatRows[highlightIdx]
			if (row) goRow(row)
		}
	}

	const breadcrumbText = (
		crumbs: Array<{ id: string; name: string }>,
	): string =>
		crumbs.length === 0 ? 'Root' : crumbs.map((c) => c.name).join(' / ')

	return (
		<Wrap ref={containerRef}>
			<Hint aria-hidden='true'>
				<HintText>find anything</HintText>
			</Hint>
			<ExpandingPill>
				<SearchOutlined className='ico' />
				<input
					ref={inputRef}
					type='text'
					placeholder='Start typing…'
					value={raw}
					onChange={(e) => {
						setRaw(e.target.value)
						if (!open) openDropdown()
					}}
					onFocus={openDropdown}
					onKeyDown={onKey}
					aria-label='Search file manager'
				/>
				<ClearBtn
					type='button'
					$visible={open || raw.length > 0}
					tabIndex={open || raw.length > 0 ? 0 : -1}
					aria-label='Clear search'
					onClick={() => {
						setRaw('')
						setDebounced('')
						inputRef.current?.focus()
					}}
				>
					<CloseRounded style={{ fontSize: 17 }} />
				</ClearBtn>
			</ExpandingPill>

			{open && (
				<Dropdown $exiting={exiting} role='listbox'>
					<ListBody ref={listRef}>
						{!loaderVisible && !enabled && (
							<StateHero>
								<HeroIcon>
									<TravelExploreOutlined />
								</HeroIcon>
								<HeroTitle>Start typing to search</HeroTitle>
								<HeroSub>
									Looks across every folder you have access to. Minimum
									2 characters.
								</HeroSub>
							</StateHero>
						)}

						{loaderVisible && (
							<LoaderBox>
								<Dot />
								<Dot />
								<Dot />
							</LoaderBox>
						)}

						{nothing && (
							<StateHero>
								<HeroIcon $tone='muted'>
									<SearchOffOutlined />
								</HeroIcon>
								<HeroTitle>No matches</HeroTitle>
								<HeroSub>
									Nothing matches <strong>“{debounced}”</strong>. Try a
									shorter or different query.
								</HeroSub>
							</StateHero>
						)}

						{enabled && !loaderVisible && folderHits.length > 0 && (
							<Section>
								<SectionHead>Folders</SectionHead>
								{folderHits.map((f, idx) => {
									const flatIdx = idx
									return (
										<Row
											key={`folder-${f.id}`}
											data-row-idx={flatIdx}
											$active={flatIdx === highlightIdx}
											$delay={idx * 20}
											onMouseEnter={() => setHighlightIdx(flatIdx)}
											onClick={() => goRow(flatRows[flatIdx])}
										>
											<FolderIcoWrap>
												<FolderOutlined />
											</FolderIcoWrap>
											<div className='body'>
												<span className='name'>
													{highlight(f.name, debounced)}
												</span>
												<span
													className='path'
													title={breadcrumbText(f.breadcrumbs)}
												>
													{breadcrumbText(f.breadcrumbs)}
												</span>
											</div>
											<DateCell title={`Created ${fmtDate(f.createdAt)}`}>
												{fmtDate(f.createdAt)}
											</DateCell>
										</Row>
									)
								})}
							</Section>
						)}

						{enabled && !loaderVisible && fileHits.length > 0 && (
							<Section>
								<SectionHead>Files</SectionHead>
								{fileHits.map((f, idx) => {
									const flatIdx = folderHits.length + idx
									return (
										<Row
											key={`file-${f.id}`}
											data-row-idx={flatIdx}
											$active={flatIdx === highlightIdx}
											$delay={flatIdx * 20}
											onMouseEnter={() => setHighlightIdx(flatIdx)}
											onClick={() => goRow(flatRows[flatIdx])}
										>
											<FileTypeIcon $kind={mimeKind(f.mimeType)}>
												<AttachFold />
												<AttachExt>
													{getExt(f.originalName)}
												</AttachExt>
											</FileTypeIcon>
											<div className='body'>
												<span className='name'>
													{highlight(f.originalName, debounced)}
												</span>
												<span
													className='path'
													title={breadcrumbText(f.breadcrumbs)}
												>
													{breadcrumbText(f.breadcrumbs)}
												</span>
											</div>
											<DateCell title={`Uploaded ${fmtDate(f.createdAt)}`}>
												{fmtDate(f.createdAt)}
											</DateCell>
										</Row>
									)
								})}
							</Section>
						)}
					</ListBody>

					<Hotkeys>
						<Hotkey>
							<kbd>
								<KeyboardArrowUp style={{ fontSize: 17 }} />
							</kbd>
							<kbd>
								<KeyboardArrowDown style={{ fontSize: 17 }} />
							</kbd>
							<span>Move</span>
						</Hotkey>
						<Hotkey>
							<kbd>
								<KeyboardReturn style={{ fontSize: 17 }} />
							</kbd>
							<span>Open</span>
						</Hotkey>
						<Hotkey>
							<kbd className='wide'>Esc</kbd>
							<span>Close</span>
						</Hotkey>
					</Hotkeys>
				</Dropdown>
			)}
		</Wrap>
	)
}

export default GlobalSearch

/* Highlight occurrences of `query` inside `text` with a soft chip.
 * Case-insensitive, splits on every match. */
function highlight(text: string, query: string): ReactNode {
	if (!query) return text
	const parts: ReactNode[] = []
	const lower = text.toLowerCase()
	const q = query.toLowerCase()
	let i = 0
	let cursor = 0
	while (cursor < text.length) {
		const found = lower.indexOf(q, cursor)
		if (found === -1) {
			parts.push(text.slice(cursor))
			break
		}
		if (found > cursor) parts.push(text.slice(cursor, found))
		parts.push(
			<Mark key={`m-${i++}`}>{text.slice(found, found + q.length)}</Mark>,
		)
		cursor = found + q.length
	}
	return parts
}

/* ─── Animations ──────────────────────────────────────────────────── */

const dropIn = keyframes`
	from { opacity: 0; transform: translateY(-6px) scale(0.98); }
	to   { opacity: 1; transform: translateY(0)    scale(1); }
`
const dropOut = keyframes`
	from { opacity: 1; transform: translateY(0)    scale(1); }
	to   { opacity: 0; transform: translateY(-4px) scale(0.98); }
`
const rowIn = keyframes`
	from { opacity: 0; transform: translateX(-4px); }
	to   { opacity: 1; transform: translateX(0); }
`
const stateFade = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`
const heroFloat = keyframes`
	0%, 100% { transform: translateY(0); }
	50%      { transform: translateY(-4px); }
`

/* ─── Shell ───────────────────────────────────────────────────────── */

const Wrap = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 20px;
`

const handDraw = keyframes`
	from { opacity: 0; transform: translate(6px, 2px) rotate(-6deg); }
	to   { opacity: 1; transform: translate(0, 0)    rotate(-6deg); }
`
const Hint = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 2px;
	color: #0369a1;
	flex-shrink: 0;
	user-select: none;
	pointer-events: none;

	@media (max-width: 1180px) {
		display: none;
	}
`

const HintText = styled.span`
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-size: 26px;
	font-weight: 700;
	line-height: 1;
	letter-spacing: 0.2px;
	margin-top: -12px;
	transform: rotate(-6deg);
	transform-origin: right center;
	text-shadow: 0 4px 14px rgba(2, 132, 199, 0.22);
	animation: ${handDraw} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
	white-space: nowrap;
`


/* Expanding search field. Default width is small; grows ~15% on
 * focus (via :focus-within on the pill wrapper). */
const ExpandingPill = styled(SearchPill)`
	input {
		width: 140px;
		transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:focus-within input {
		width: 182px;
	}
`

/* Always rendered — reserves a fixed slot so the pill never resizes
 * as the user types. Fades in/out; the inner X rotates on hover. */
const ClearBtn = styled.button<{ $visible: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border: none;
	background: transparent;
	color: #94a3b8;
	cursor: pointer;
	border-radius: 50%;
	flex: 0 0 auto;
	padding: 0;
	margin-left: 10px;
	margin-right: -14px;
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	pointer-events: ${(p) => (p.$visible ? 'auto' : 'none')};
	transition: opacity 180ms ease;

	svg {
		transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover svg {
		transform: rotate(90deg);
		color: #475569;
	}
	&:focus-visible {
		outline: 2px solid rgba(148, 163, 184, 0.5);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		svg {
			transition: none;
		}
	}
`

/* ─── Dropdown ────────────────────────────────────────────────────── */

const Dropdown = styled.div<{ $exiting: boolean }>`
	position: absolute;
	top: calc(100% + 10px);
	right: 0;
	left: auto;
	width: 560px;
	min-width: 560px;
	max-width: 560px;
	height: 440px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 16px;
	box-shadow:
		0 2px 4px rgba(15, 23, 42, 0.03),
		0 28px 72px rgba(15, 23, 42, 0.12);
	z-index: 50;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	transform-origin: top right;
	animation: ${(p) => (p.$exiting ? dropOut : dropIn)}
		${(p) => (p.$exiting ? '160ms' : '220ms')}
		cubic-bezier(0.22, 1, 0.36, 1) both;
	will-change: transform, opacity;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const ListBody = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 6px 0;
	display: flex;
	flex-direction: column;
	min-height: 0;
`

const Section = styled.div`
	padding: 8px 0 6px;
	animation: ${stateFade} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;

	& + & {
		border-top: 1px solid #f1f5f9;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const SectionHead = styled.div`
	font-size: 12.5px;
	font-weight: 500;
	color: #94a3b8;
	padding: 2px 20px 8px;
	letter-spacing: -0.1px;
`

const Row = styled.button<{ $active: boolean; $delay: number }>`
	display: flex;
	align-items: center;
	gap: 14px;
	width: 100%;
	padding: 10px 20px;
	border: none;
	background: ${(p) => (p.$active ? '#f8fafc' : 'transparent')};
	text-align: left;
	cursor: pointer;
	transition:
		background 120ms ease,
		transform 120ms ease;
	animation: ${rowIn} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${(p) => p.$delay}ms;

	&:active {
		transform: translateY(0.5px);
	}

	.ico {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 11px;
		background: #f1f5f9;
		color: #64748b;
		flex-shrink: 0;
		transition:
			background 160ms ease,
			color 160ms ease;
		svg {
			font-size: 22px;
		}
	}
	${(p) =>
		p.$active &&
		`.ico { background: #e2e8f0; color: #0f172a; }`}

	.body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		flex: 1;
	}
	.name {
		font-size: 13.5px;
		font-weight: 600;
		color: #0f172a;
		letter-spacing: -0.1px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.path {
		font-size: 11.5px;
		color: #94a3b8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const DateCell = styled.span`
	flex: 0 0 auto;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	font-weight: 500;
	color: #94a3b8;
	white-space: nowrap;
	margin-left: 10px;
	letter-spacing: -0.2px;
`

const Mark = styled.mark`
	background: rgba(187, 247, 208, 0.6);
	color: #166534;
	padding: 1px 3px;
	border-radius: 4px;
	font-weight: 700;
`

/* ─── Hotkeys bar ─────────────────────────────────────────────────── */

const Hotkeys = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 10px 20px;
	background: #f8fafc;
	border-top: 1px solid #f1f5f9;
`

const Hotkey = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	color: #475569;
	font-weight: 500;

	kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 26px;
		height: 26px;
		padding: 0 6px;
		background: #ffffff;
		border: none;
		border-radius: 6px;
		font-family: inherit;
		font-size: 12.5px;
		color: #334155;
		box-shadow:
			0 1px 2px rgba(15, 23, 42, 0.06),
			0 1px 0 rgba(15, 23, 42, 0.04) inset;
	}
	kbd.wide {
		min-width: 36px;
	}
`

/* ─── Empty states ────────────────────────────────────────────────── */

const StateHero = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 20px 24px;
	text-align: center;
	animation: ${stateFade} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const HeroIcon = styled.span<{ $tone?: 'muted' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 68px;
	height: 68px;
	border-radius: 50%;
	background: #f1f5f9;
	color: #94a3b8;
	animation: ${heroFloat} 3.2s ease-in-out infinite;
	svg {
		font-size: 34px;
	}
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const HeroTitle = styled.p`
	margin: 2px 0 0;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 17px;
	font-weight: 700;
	letter-spacing: -0.3px;
	color: #0f172a;
`

const HeroSub = styled.p`
	margin: 0;
	font-size: 13px;
	font-weight: 500;
	line-height: 1.5;
	color: #64748b;
	max-width: 36ch;
	strong {
		color: #0f172a;
		font-weight: 700;
	}
`

/* ─── Loading ─────────────────────────────────────────────────────── */

const dotWave = keyframes`
	0%, 60%, 100% {
		transform: translateY(0);
		opacity: 0.4;
	}
	30% {
		transform: translateY(-8px);
		opacity: 1;
	}
`

const LoaderBox = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	animation: ${stateFade} 220ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const Dot = styled.span`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #94a3b8;
	animation: ${dotWave} 1.1s ease-in-out infinite;

	&:nth-child(2) {
		animation-delay: 0.14s;
	}
	&:nth-child(3) {
		animation-delay: 0.28s;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* ─── File-type icon (mirror of FileManager's AttachTypeIcon) ───── */

type MimeKind = 'pdf' | 'image' | 'doc' | 'other'

const mimeKind = (mime: string): MimeKind => {
	if (/pdf/i.test(mime)) return 'pdf'
	if (/^image\//i.test(mime)) return 'image'
	if (/word|document|msword|sheet|excel|csv|presentation|powerpoint/i.test(mime))
		return 'doc'
	return 'other'
}

const getExt = (name: string): string => {
	const dot = name.lastIndexOf('.')
	if (dot < 0 || dot === name.length - 1) return 'FILE'
	return name.slice(dot + 1, dot + 5).toUpperCase()
}

/* Short date "6 Nov 2026" — reads at a glance, no year noise for
 * same-year items could be an improvement later. */
const fmtDate = (iso: string): string => {
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return ''
	return d.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
}

const FILE_ICON_COLORS: Record<MimeKind, { from: string; to: string }> = {
	pdf: { from: '#f87171', to: '#dc2626' },
	image: { from: '#60a5fa', to: '#2563eb' },
	doc: { from: '#4ade80', to: '#16a34a' },
	other: { from: '#fbbf24', to: '#f59e0b' },
}

const FileTypeIcon = styled.div<{ $kind: MimeKind }>`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: center;
	padding-bottom: 5px;
	width: 32px;
	height: 40px;
	border-radius: 5px;
	background: linear-gradient(
		135deg,
		${(p) => FILE_ICON_COLORS[p.$kind].from},
		${(p) => FILE_ICON_COLORS[p.$kind].to}
	);
	flex: 0 0 auto;
	box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.15);
`

/* Folder icon — plain outlined icon in muted slate, no tile bg. */
const FolderIcoWrap = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	color: #64748b;
	flex: 0 0 auto;

	svg {
		font-size: 26px;
	}
`

const AttachFold = styled.span`
	position: absolute;
	top: 0;
	right: 0;
	width: 10px;
	height: 10px;
	background: linear-gradient(
		225deg,
		rgba(255, 255, 255, 0.5) 0%,
		rgba(255, 255, 255, 0.5) 50%,
		rgba(0, 0, 0, 0.08) 50%,
		rgba(0, 0, 0, 0.08) 100%
	);
	border-radius: 0 5px 0 3px;
`

const AttachExt = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 8.5px;
	font-weight: 800;
	letter-spacing: 0.6px;
	color: #ffffff;
`
