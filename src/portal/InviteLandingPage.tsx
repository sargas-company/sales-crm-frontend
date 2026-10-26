import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	FolderOutlined,
	FolderRounded,
	InsertDriveFileOutlined,
	InsertDriveFileRounded,
	WarningAmberRounded,
} from '@mui/icons-material'
import { API_BASE_URL } from '../api/baseApi'

/* Landing page shown when a worker opens an invite link. Fetches
 * the public invite preview (no auth needed), lists the resources
 * they'll gain access to, and shows a Discord sign-in button that
 * passes the invite token through OAuth state. */

interface InvitePreview {
	token: string
	shares: Array<{
		resourceType: 'FOLDER' | 'FILE'
		resourceId: string
		resourceName: string | null
		canDownload: boolean
		canUpload: boolean
		canCreateSubfolders: boolean
		recursive: boolean
	}>
	expiresAt: string | null
	createdAt: string
	note: string | null
}

export const InviteLandingPage = () => {
	const { token } = useParams<{ token: string }>()
	const [preview, setPreview] = useState<InvitePreview | null>(null)
	const [err, setErr] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	const apiBase = API_BASE_URL

	useEffect(() => {
		if (!token) return
		fetch(`${apiBase}/auth/portal/invites/${token}`)
			.then(async (r) => {
				if (!r.ok) {
					const data = await r.json().catch(() => ({ message: 'invalid invite' }))
					throw new Error(data.message || 'invalid invite')
				}
				return r.json()
			})
			.then(setPreview)
			.catch((e: Error) => setErr(e.message))
			.finally(() => setLoading(false))
	}, [token, apiBase])

	if (loading) {
		return (
			<Root>
				<BgMesh />
				<Card>
					<Loading>
						<LoadingDot />
						<LoadingDot style={{ animationDelay: '140ms' }} />
						<LoadingDot style={{ animationDelay: '280ms' }} />
					</Loading>
				</Card>
			</Root>
		)
	}

	if (err) {
		return (
			<Root>
				<BgMesh />
				<Card>
					<Hero $tone='error'>
						<HeroBg $tone='error' />
						<HeroInfo>
							<HeroEyebrow>Something's off</HeroEyebrow>
							<HeroTitle>This invite can't be opened</HeroTitle>
							<HeroSub>
								<WarningAmberRounded style={{ fontSize: 15 }} />
								{err}
							</HeroSub>
						</HeroInfo>
					</Hero>
					<ErrorHint>
						Ask whoever shared the link to generate a new one — invites
						are single-use and expire.
					</ErrorHint>
				</Card>
			</Root>
		)
	}
	if (!preview) return null

	return (
		<Root>
			<BgMesh />
			<Card>
				<Hero>
					<HeroBg />
					<HeroGrain />
					<HeroSweep />
					<HeroRow>
						<BrandWordmark>
							<WordmarkTick />
							SARGAS <WordmarkThin>FILES</WordmarkThin>
						</BrandWordmark>
						<HeroPill>Invitation</HeroPill>
					</HeroRow>
					<HeroPoster>
						<HeroEyebrow>You've been invited to access</HeroEyebrow>
						<HeroBigNumWrap>
							<HeroBigNum>{preview.shares.length}</HeroBigNum>
							<HeroBigLabel>
								{preview.shares.length === 1 ? 'resource' : 'resources'}
							</HeroBigLabel>
						</HeroBigNumWrap>
						<HeroDivider />
						<HeroSub>Single-use link · Discord sign-in required.</HeroSub>
					</HeroPoster>
				</Hero>

				<SharesBlock>
					<SharesHead>
						<SharesTitle>What you'll get</SharesTitle>
					</SharesHead>

					<SharesScroll>
						{preview.shares.map((s, i) => {
							const name = s.resourceName ?? `(unnamed ${s.resourceType.toLowerCase()})`
							const typeLabel =
								s.resourceType === 'FOLDER'
									? 'Folder'
									: fileExt(name).toLowerCase() === 'file'
										? 'File'
										: `${fileExt(name)} file`
							const isFolder = s.resourceType === 'FOLDER'
							return (
								<ShareRow
									key={s.resourceId}
									style={{ ['--i' as string]: i }}
								>
									{isFolder ? (
										<FinderFolder>
											{/* Papers peeking out — fan out on parent hover.
											 *  Rendered BEFORE the folder body so they sit
											 *  behind the front flap. */}
											<Paper data-finder-paper style={{ ['--p' as string]: 0 }} />
											<Paper data-finder-paper style={{ ['--p' as string]: 1 }} />
											<Paper data-finder-paper style={{ ['--p' as string]: 2 }} />
											<FolderBack />
											<FolderFront />
										</FinderFolder>
									) : (
										<V4FileTile>
											<V4FileCorner />
											<V4FileLine style={{ top: 14 }} />
											<V4FileLine style={{ top: 20, width: '55%' }} />
											<V4FileLine style={{ top: 26, width: '75%' }} />
										</V4FileTile>
									)}
									<ShareBody>
										<ShareName>{name}</ShareName>
										<ShareMeta>{typeLabel}</ShareMeta>
									</ShareBody>
								</ShareRow>
							)
						})}
					</SharesScroll>
				</SharesBlock>

				{preview.note && (
					<Note>
						<NoteLabel>Note from the sender</NoteLabel>
						<NoteBody>"{preview.note}"</NoteBody>
					</Note>
				)}

				<DiscordBtn
					type='button'
					onClick={() => {
						window.location.href = `${apiBase}/auth/portal/discord/login?state=${encodeURIComponent(preview.token)}`
					}}
				>
					<DiscordBtnBg />
					<DiscordBtnContent>
						<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1828 0-2.1569-1.0857-2.1569-2.4186 0-1.3328.9552-2.4185 2.157-2.4185 1.2108 0 2.1757 1.0952 2.1568 2.4185 0 1.3329-.9552 2.4186-2.1569 2.4186zm7.9748 0c-1.1828 0-2.1569-1.0857-2.1569-2.4186 0-1.3328.9553-2.4185 2.1569-2.4185 1.2108 0 2.1757 1.0952 2.1568 2.4185 0 1.3329-.946 2.4186-2.1568 2.4186Z' />
						</svg>
						Continue with Discord
					</DiscordBtnContent>
				</DiscordBtn>

				<Footnote>
					We only read your Discord identity and email — nothing else.
				</Footnote>
			</Card>
		</Root>
	)
}

/* ─── Helpers (resource type → gradient family + extension tag) ──── */
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

/* ─── Permission glyph SVGs ──────────────────────────────────────── */
const IconDl = () => (
	<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M12 3v12m0 0l-5-5m5 5l5-5M4 21h16' />
	</svg>
)
const IconUp = () => (
	<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M12 21V9m0 0l-5 5m5-5l5 5M4 3h16' />
	</svg>
)
const IconMkdir = () => (
	<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z' />
		<path d='M12 11v6M9 14h6' />
	</svg>
)
const IconRec = () => (
	<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
		<path d='M17 2.5a7 7 0 0 1 0 10l-3 3a7 7 0 0 1-10-10l1.5-1.5M7 21.5a7 7 0 0 1 0-10l3-3a7 7 0 0 1 10 10l-1.5 1.5' />
	</svg>
)

/* ─── Layout + mesh background ───────────────────────────────────── */
const Root = styled.div`
	position: relative;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32px 20px;
	background: #f8fafc;
	overflow: hidden;
`
/* Soft multi-radial mesh — brand-only palette (indigo deep, indigo
 * light, warm orange accent). No teal/fuchsia leaking through the
 * glass card, so the whole second half reads as our colors. */
const BgMesh = styled.div`
	position: absolute;
	inset: 0;
	pointer-events: none;
	background:
		radial-gradient(60vmin 60vmin at 15% 15%, rgba(67, 56, 202, 0.3), transparent 60%),
		radial-gradient(55vmin 55vmin at 85% 20%, rgba(99, 102, 241, 0.22), transparent 60%),
		radial-gradient(70vmin 70vmin at 50% 95%, rgba(232, 93, 47, 0.15), transparent 60%);
	filter: blur(10px);
	animation: meshDrift 24s ease-in-out infinite alternate;
	@keyframes meshDrift {
		from { transform: translate3d(0, 0, 0) scale(1); }
		to { transform: translate3d(-2%, 1%, 0) scale(1.05); }
	}
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`
const Card = styled.div`
	position: relative;
	width: 100%;
	max-width: 540px;
	padding: 20px;
	background: rgba(255, 255, 255, 0.78);
	backdrop-filter: blur(24px) saturate(160%);
	-webkit-backdrop-filter: blur(24px) saturate(160%);
	border-radius: 24px;
	border: 1px solid rgba(255, 255, 255, 0.6);
	box-shadow:
		0 32px 70px -24px rgba(15, 23, 42, 0.3),
		0 2px 10px -4px rgba(15, 23, 42, 0.1);
	display: flex;
	flex-direction: column;
	gap: 18px;
	animation: cardIn 540ms cubic-bezier(0.22, 1, 0.36, 1) both;
	@keyframes cardIn {
		from { opacity: 0; transform: translateY(14px) scale(0.98); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}
	/* Stagger each direct child so sections cascade in. Keyed by DOM
	 * order; delay step matches the card's own ease curve. */
	& > * {
		animation: sectionIn 540ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	& > *:nth-child(1) { animation-delay: 120ms; }
	& > *:nth-child(2) { animation-delay: 240ms; }
	& > *:nth-child(3) { animation-delay: 360ms; }
	& > *:nth-child(4) { animation-delay: 480ms; }
	& > *:nth-child(5) { animation-delay: 600ms; }
	@keyframes sectionIn {
		from { opacity: 0; transform: translateY(10px); filter: blur(3px); }
		to { opacity: 1; transform: translateY(0); filter: blur(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		& > * { animation: none; }
	}
`

/* ─── Hero (dark ink gradient) ───────────────────────────────────── */
const Hero = styled.div<{ $tone?: 'ok' | 'error' }>`
	position: relative;
	padding: 20px 24px 28px;
	border-radius: 18px;
	overflow: hidden;
	color: ${({ $tone }) => ($tone === 'error' ? '#fecaca' : '#ffffff')};
	box-shadow:
		0 20px 40px -16px rgba(15, 23, 42, 0.5),
		0 0 0 1px rgba(255, 255, 255, 0.06) inset;
`

/* Film-grain over the hero only — adds photographic texture so the
 * dark gradient doesn't read as a flat block. SVG inline. */
const HeroGrain = styled.div`
	position: absolute;
	inset: 0;
	z-index: 1;
	pointer-events: none;
	opacity: 0.14;
	mix-blend-mode: overlay;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
`
/* Slow spotlight sweep — animated diagonal gradient drifting across
 * the hero every 8s. Pointer-events none; blur softens the edge. */
const HeroSweep = styled.div`
	position: absolute;
	inset: 0;
	z-index: 1;
	pointer-events: none;
	opacity: 0.65;
	background: linear-gradient(
		115deg,
		transparent 30%,
		rgba(165, 180, 252, 0.18) 48%,
		rgba(255, 255, 255, 0.08) 52%,
		transparent 70%
	);
	background-size: 200% 100%;
	background-position: 100% 0;
	animation: heroSweep 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	@keyframes heroSweep {
		0%   { background-position: 100% 0; }
		60%  { background-position: -100% 0; }
		100% { background-position: -100% 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		animation: none;
		opacity: 0;
	}
`
const HeroPill = styled.span`
	position: relative;
	z-index: 2;
	padding: 6px 14px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.08);
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	font-weight: 500;
	letter-spacing: 0.2px;
	color: rgba(226, 232, 240, 0.9);
`
const HeroPoster = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 20px;
`
const HeroBigNumWrap = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 12px;
	line-height: 1;
`
const HeroBigNum = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 76px;
	font-weight: 800;
	letter-spacing: -3px;
	line-height: 1;
	background: linear-gradient(
		180deg,
		#ffffff 0%,
		#e2e8f0 60%,
		#94a3b8 100%
	);
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
	color: transparent;
	filter: drop-shadow(0 2px 20px rgba(255, 255, 255, 0.15));
`
const HeroBigLabel = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 20px;
	font-weight: 700;
	color: rgba(203, 213, 225, 0.75);
	letter-spacing: -0.3px;
`
const HeroDivider = styled.hr`
	border: none;
	height: 1px;
	background: linear-gradient(
		90deg,
		transparent,
		rgba(255, 255, 255, 0.18) 20%,
		rgba(255, 255, 255, 0.18) 80%,
		transparent
	);
	margin: 4px 0 0;
	width: 100%;
`
const HeroBg = styled.div<{ $tone?: 'ok' | 'error' }>`
	position: absolute;
	inset: 0;
	background: ${({ $tone }) =>
		$tone === 'error'
			? 'linear-gradient(135deg, #450a0a 0%, #1f2937 55%, #0f172a 100%)'
			: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)'};
	z-index: 0;
	&::before, &::after {
		content: '';
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		animation: heroBreathe 10s ease-in-out infinite alternate;
	}
	&::before {
		top: -40%;
		right: -10%;
		width: 320px;
		height: 320px;
		background: ${({ $tone }) =>
			$tone === 'error'
				? 'radial-gradient(circle, rgba(248, 113, 113, 0.3), transparent 70%)'
				: 'radial-gradient(circle, rgba(129, 140, 248, 0.35), transparent 70%)'};
	}
	&::after {
		bottom: -50%;
		left: -10%;
		width: 260px;
		height: 260px;
		background: ${({ $tone }) =>
			$tone === 'error'
				? 'radial-gradient(circle, rgba(220, 38, 38, 0.2), transparent 70%)'
				: 'radial-gradient(circle, rgba(45, 212, 191, 0.22), transparent 70%)'};
		animation-delay: -5s;
	}
	@keyframes heroBreathe {
		from { transform: translate(0, 0) scale(1); opacity: 0.9; }
		to   { transform: translate(10px, -8px) scale(1.08); opacity: 1; }
	}
	@media (prefers-reduced-motion: reduce) {
		&::before, &::after { animation: none; }
	}
`
const HeroRow = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	gap: 10px;
`
/* Typographic wordmark — replaces the loose logo image. Reads as
 * brand without competing with the hero poster below. */
const BrandWordmark = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 17px;
	font-weight: 800;
	color: #ffffff;
	letter-spacing: 2.5px;
	flex: 1;
`
const WordmarkTick = styled.span`
	width: 3px;
	height: 24px;
	border-radius: 2px;
	background: #ffffff;
`
const WordmarkThin = styled.span`
	font-weight: 400;
	color: rgba(203, 213, 225, 0.65);
	letter-spacing: 2.5px;
`
const HeroInfo = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 6px;
`
const HeroEyebrow = styled.div`
	font-size: 11px;
	font-weight: 700;
	color: rgba(203, 213, 225, 0.7);
	text-transform: uppercase;
	letter-spacing: 1.2px;
`
const HeroTitle = styled.h1`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 26px;
	font-weight: 800;
	color: #ffffff;
	margin: 0;
	letter-spacing: -0.6px;
	line-height: 1.15;
`
const HeroSub = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: rgba(203, 213, 225, 0.85);
	margin-top: 2px;
`

/* ─── Shares block ───────────────────────────────────────────────── */
const SharesBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`
const SharesHead = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 10px;
	padding: 0 2px;
`
const SharesTitle = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: #475569;
	letter-spacing: 0.4px;
	text-transform: uppercase;
`
/* Single container that groups rows into a "manifest" with hairline
 * dividers between them instead of individual card backgrounds. Reads
 * as a continuous document — more harmonious with the hero poster
 * above and the Discord CTA below than a stack of cards. */
const SharesScroll = styled.div`
	display: flex;
	flex-direction: column;
	max-height: 300px;
	overflow-y: auto;
	padding: 4px 2px;
	background: rgba(255, 255, 255, 0.5);
	border-radius: 14px;
	box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.05) inset;
	&::-webkit-scrollbar { width: 6px; }
	&::-webkit-scrollbar-thumb {
		background: rgba(15, 23, 42, 0.15);
		border-radius: 999px;
	}
	& > * {
		animation: shareRowIn 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: calc(380ms + var(--i, 0) * 70ms);
	}
	@keyframes shareRowIn {
		from { opacity: 0; transform: translateX(-8px); }
		to { opacity: 1; transform: translateX(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		& > * { animation: none; }
	}
`
const ShareRow = styled.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 14px;
	align-items: center;
	padding: 12px 14px;
	border-radius: 10px;
	transition: background 220ms ease;
	& + & {
		box-shadow: 0 -1px 0 rgba(15, 23, 42, 0.06);
	}
	&:hover {
		background: rgba(255, 255, 255, 0.75);
	}
	/* Fan the three papers out above the folder tab on row hover —
	 * each at a different angle, driven by the --p custom prop. */
	&:hover [data-finder-paper] {
		transform:
			translateY(calc(-14px - var(--p, 0) * 2px))
			rotate(calc((var(--p, 0) - 1) * 14deg));
	}
`
/* Finder-style folder — Mac/macOS inspired. Composition:
 *   1. three mini papers tucked INSIDE the folder (positioned behind
 *      the folder body); on parent-row hover they fan out above the
 *      tab line, like opening a drawer.
 *   2. FolderBack — the back half of the folder with the tab shape
 *      cut out on top (so papers can rise through the gap).
 *   3. FolderFront — the front panel that covers the bottom portion;
 *      has a subtle lighter edge on top for a 3D lip.
 *  Hero-banner palette: dark ink gradient (#1e293b → #0f172a). */
const FinderFolder = styled.div`
	position: relative;
	width: 48px;
	height: 40px;
	flex: 0 0 auto;
`
/* Paper that peeks out from inside the folder. Three stacked papers
 * fan out at different angles on hover. Controlled via --p (0..2). */
const Paper = styled.span`
	position: absolute;
	left: 50%;
	top: 10px;
	width: 22px;
	height: 26px;
	margin-left: -11px;
	background: linear-gradient(180deg, #ffffff, #e2e8f0);
	border: 1px solid rgba(15, 23, 42, 0.1);
	border-radius: 3px;
	box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
	z-index: 1;
	transform-origin: 50% 100%;
	transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
	/* Rest state — all three stacked flat inside the folder. */
	transform: translateY(0) rotate(0deg);
`
/* Back half of the folder — bottom body with tab on top-left. */
const FolderBack = styled.span`
	position: absolute;
	top: 6px;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(180deg, #475569, #334155);
	border-radius: 4px 6px 6px 6px;
	z-index: 0;
	&::before {
		content: '';
		position: absolute;
		top: -6px;
		left: 0;
		width: 18px;
		height: 6px;
		background: linear-gradient(180deg, #475569, #334155);
		border-radius: 5px 5px 0 0;
	}
`
/* Front panel — covers lower 70% of folder, slightly darker. */
const FolderFront = styled.span`
	position: absolute;
	top: 14px;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
	border-radius: 2px 6px 6px 6px;
	z-index: 2;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.08),
		0 3px 8px -2px rgba(15, 23, 42, 0.4);
`

/* V4 file tile (kept as-is — paper with folded corner + ruled lines). */
const V4FileTile = styled.div`
	position: relative;
	width: 32px;
	height: 40px;
	background: linear-gradient(180deg, #ffffff, #e2e8f0);
	border: 1px solid rgba(15, 23, 42, 0.12);
	border-radius: 5px;
	box-shadow: 0 3px 8px -2px rgba(15, 23, 42, 0.15);
`
const V4FileCorner = styled.span`
	position: absolute;
	top: -1px;
	right: -1px;
	width: 12px;
	height: 12px;
	background: linear-gradient(225deg, #ffffff 50%, rgba(15, 23, 42, 0.14) 50%);
	border-top-right-radius: 5px;
`
const V4FileLine = styled.span`
	position: absolute;
	left: 6px;
	right: 6px;
	height: 2px;
	background: rgba(15, 23, 42, 0.15);
	border-radius: 2px;
`

/* V5 — Floating gradient orb (sphere with inner shine). */
const V5Orb = styled.div<{ $folder: boolean }>`
	position: relative;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${({ $folder }) =>
		$folder
			? 'radial-gradient(circle at 30% 25%, #818cf8 0%, #4338ca 65%, #312e81 100%)'
			: 'radial-gradient(circle at 30% 25%, #94a3b8 0%, #475569 60%, #1e293b 100%)'};
	box-shadow:
		0 6px 14px -4px rgba(67, 56, 202, 0.4),
		0 0 0 1px rgba(255, 255, 255, 0.1) inset;
	overflow: hidden;
`
const V5OrbShine = styled.span`
	position: absolute;
	top: 4px;
	left: 8px;
	width: 14px;
	height: 10px;
	background: radial-gradient(ellipse, rgba(255, 255, 255, 0.5), transparent 70%);
	border-radius: 50%;
	pointer-events: none;
`

/* V6 — Outline / blueprint. Just a stroked rounded square + outlined
 * MUI icon. Super minimal, technical. */
const V6Outline = styled.div<{ $folder: boolean }>`
	width: 40px;
	height: 40px;
	border-radius: 10px;
	border: 1.5px solid ${({ $folder }) => ($folder ? '#4338ca' : '#64748b')};
	color: ${({ $folder }) => ($folder ? '#4338ca' : '#64748b')};
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: transparent;
`

/* V7 — Angled stamp (rotated -8°, double-border). Casual. */
const V7Stamp = styled.div<{ $folder: boolean }>`
	width: 40px;
	height: 40px;
	border-radius: 8px;
	background: ${({ $folder }) =>
		$folder
			? 'linear-gradient(135deg, #4f46e5, #4338ca)'
			: 'linear-gradient(135deg, #64748b, #475569)'};
	transform: rotate(-8deg);
	padding: 3px;
	box-shadow: 0 4px 10px -3px rgba(15, 23, 42, 0.25);
	flex: 0 0 auto;
`
const V7StampInner = styled.div`
	width: 100%;
	height: 100%;
	border: 1.5px dashed rgba(255, 255, 255, 0.5);
	border-radius: 5px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
`

/* V8 — Horizontal compact pill with icon + name + ext chip. All
 * inline, no stacked meta line — denser option for long lists. */
const V8Pill = styled.div`
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 10px;
	align-items: center;
	padding: 10px 12px;
	background: rgba(255, 255, 255, 0.7);
	border-radius: 999px;
	&:hover { background: rgba(255, 255, 255, 0.9); }
`
const V8PillIcon = styled.span<{ $folder: boolean }>`
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: ${({ $folder }) =>
		$folder ? 'rgba(67, 56, 202, 0.12)' : 'rgba(15, 23, 42, 0.08)'};
	color: ${({ $folder }) => ($folder ? '#4338ca' : '#475569')};
	display: inline-flex;
	align-items: center;
	justify-content: center;
`
const V8PillName = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 14px;
	font-weight: 700;
	color: #0f172a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const V8ExtTag = styled.span<{ $folder: boolean }>`
	padding: 3px 9px;
	border-radius: 999px;
	background: ${({ $folder }) =>
		$folder ? 'rgba(67, 56, 202, 0.12)' : 'rgba(15, 23, 42, 0.06)'};
	color: ${({ $folder }) => ($folder ? '#4338ca' : '#475569')};
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 9.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
`

/* Soft iconic chip (V1) — gentle rounded square with MUI icon. */
const ShareIcon = styled.div<{ $kind: 'folder' | 'file' }>`
	width: 40px;
	height: 40px;
	border-radius: 11px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${({ $kind }) =>
		$kind === 'folder'
			? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(67, 56, 202, 0.08))'
			: 'linear-gradient(135deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.04))'};
	color: ${({ $kind }) => ($kind === 'folder' ? '#4338ca' : '#475569')};
	box-shadow: 0 0 0 1px
		${({ $kind }) =>
			$kind === 'folder'
				? 'rgba(99, 102, 241, 0.12)'
				: 'rgba(15, 23, 42, 0.06)'}
		inset;
`
const ShareBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`
const ShareName = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.2px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const ShareMeta = styled.div`
	font-size: 11.5px;
	color: #94a3b8;
	font-weight: 500;
	letter-spacing: 0.1px;
`
const ShareMatrix = styled.div`
	display: inline-flex;
	gap: 2px;
	padding: 2px;
	border-radius: 7px;
	background: rgba(15, 23, 42, 0.04);
`
const Bit = styled.span<{ $on: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 5px;
	background: ${({ $on }) =>
		$on
			? 'linear-gradient(135deg, #6366f1, #4338ca)'
			: 'transparent'};
	color: ${({ $on }) => ($on ? '#ffffff' : 'rgba(15, 23, 42, 0.2)')};
	box-shadow: ${({ $on }) =>
		$on ? '0 2px 6px -2px rgba(79, 70, 229, 0.5)' : 'none'};
	transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
`

/* ─── Mime-color badge (same shape as ShareModal / PortalUserDetail) ─ */
/* Unified ink/indigo badges — same shape for folder and all file
 * types; file type is read from the ext tag, not the fill. Keeps the
 * whole surface in our brand gamma (ink + indigo accents). Folder
 * stays pure ink; files get a subtle indigo lift so they visually
 * separate from folders without going "iPhone-colored". */
const FileBadgeFolder = styled.div`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding-bottom: 4px;
	width: 34px;
	height: 40px;
	border-radius: 6px;
	background: linear-gradient(135deg, #1e293b, #0f172a);
	box-shadow:
		0 3px 8px -2px rgba(15, 23, 42, 0.3),
		0 0 0 1px rgba(255, 255, 255, 0.04) inset;
`
const FileBadgeFile = styled.div<{ $kind: 'pdf' | 'img' | 'doc' | 'other' }>`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding-bottom: 4px;
	width: 34px;
	height: 40px;
	border-radius: 6px;
	background: linear-gradient(135deg, #4338ca 0%, #1e293b 100%);
	box-shadow:
		0 3px 8px -2px rgba(67, 56, 202, 0.3),
		0 0 0 1px rgba(255, 255, 255, 0.04) inset;
`
const FileBadgeFold = styled.span`
	position: absolute;
	top: 0;
	right: 0;
	width: 11px;
	height: 11px;
	background: linear-gradient(
		225deg,
		rgba(255, 255, 255, 0.5) 0%,
		rgba(255, 255, 255, 0.5) 50%,
		rgba(0, 0, 0, 0.08) 50%,
		rgba(0, 0, 0, 0.08) 100%
	);
	border-radius: 0 6px 0 4px;
`
const FileBadgeExt = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 8.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	color: #ffffff;
`

/* ─── Note from sender ───────────────────────────────────────────── */
const Note = styled.div`
	padding: 14px 16px;
	border-radius: 12px;
	background: rgba(99, 102, 241, 0.06);
	border: 1px solid rgba(99, 102, 241, 0.14);
	border-left: 3px solid #6366f1;
	display: flex;
	flex-direction: column;
	gap: 4px;
`
const NoteLabel = styled.div`
	font-size: 10.5px;
	font-weight: 700;
	color: #4338ca;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`
const NoteBody = styled.div`
	font-size: 13.5px;
	color: #334155;
	line-height: 1.5;
	font-style: italic;
`

/* ─── Discord CTA — chunky, branded, glow on hover ───────────────── */
const DiscordBtn = styled.button`
	position: relative;
	width: 100%;
	padding: 14px 18px;
	border-radius: 14px;
	border: none;
	background: transparent;
	color: #ffffff;
	cursor: pointer;
	overflow: hidden;
	transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
	&:hover {
		transform: translateY(-2px);
	}
	&:hover > div:first-child {
		box-shadow:
			0 14px 32px -10px rgba(88, 101, 242, 0.75),
			0 0 0 1px rgba(255, 255, 255, 0.1) inset;
		filter: brightness(1.1);
	}
	&:active { transform: translateY(0); }
`
const DiscordBtnBg = styled.div`
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #5865f2 0%, #4752c4 100%);
	border-radius: 14px;
	box-shadow:
		0 10px 24px -8px rgba(88, 101, 242, 0.5),
		0 0 0 1px rgba(255, 255, 255, 0.08) inset;
	transition: box-shadow 220ms ease, filter 220ms ease;
	z-index: 0;
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 50%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.15), transparent);
		border-radius: 14px 14px 0 0;
	}
`
const DiscordBtnContent = styled.div`
	position: relative;
	z-index: 1;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14.5px;
	font-weight: 700;
	letter-spacing: 0.1px;
`

const Footnote = styled.div`
	font-size: 11.5px;
	color: #94a3b8;
	text-align: center;
	line-height: 1.5;
`

/* ─── Loading state (3-dot pulse) ────────────────────────────────── */
const Loading = styled.div`
	display: inline-flex;
	gap: 8px;
	padding: 60px;
	justify-content: center;
`
const LoadingDot = styled.span`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366f1, #4338ca);
	animation: dotBounce 1.2s ease-in-out infinite;
	@keyframes dotBounce {
		0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
		40% { transform: scale(1); opacity: 1; }
	}
`

/* ─── Error state hint under hero ────────────────────────────────── */
const ErrorHint = styled.div`
	font-size: 13px;
	color: #64748b;
	line-height: 1.5;
	padding: 0 4px 8px;
	text-align: center;
`
