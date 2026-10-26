import { Navigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { API_BASE_URL } from '../api/baseApi'

/* Portal login — minimalist. Only path to sign in is Discord OAuth
 * (admins never pass through here). Visual language is intentionally
 * identical to InviteLandingPage: mesh background + glass card +
 * ink-poster hero + Discord blurple CTA. */
export const PortalLoginPage = () => {
	const [params] = useSearchParams()
	const errorMsg = params.get('error')
	const apiBase = API_BASE_URL

	/* Guard against showing the login screen to an already-signed-in
	 * worker. Checked synchronously from localStorage — the same source
	 * PortalRequireAuth uses — so there's no mismatch window. */
	let hasToken = false
	try {
		hasToken = !!localStorage.getItem('access_token')
	} catch {
		/* ignore */
	}
	if (hasToken && !errorMsg) {
		return <Navigate to='/' replace />
	}

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
						<HeroPill>Sign in</HeroPill>
					</HeroRow>
					<HeroPoster>
						<HeroEyebrow>Workers portal</HeroEyebrow>
						<HeroTitle>Access your shared files</HeroTitle>
						<HeroDivider />
						<HeroSub>Discord sign-in required.</HeroSub>
					</HeroPoster>
				</Hero>

				{errorMsg && <ErrorBox>{errorMsg}</ErrorBox>}

				<DiscordBtn
					type='button'
					onClick={() => {
						window.location.href = `${apiBase}/auth/portal/discord/login`
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

				<Footnote>You need an invite link to join. Ask your admin.</Footnote>
			</Card>
		</Root>
	)
}

/* ─── Layout + mesh background (identical to InviteLandingPage) ──── */
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
	@media (prefers-reduced-motion: reduce) { animation: none; }
`
const Card = styled.div`
	position: relative;
	width: 100%;
	max-width: 460px;
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
	& > * {
		animation: sectionIn 540ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	& > *:nth-child(1) { animation-delay: 120ms; }
	& > *:nth-child(2) { animation-delay: 240ms; }
	& > *:nth-child(3) { animation-delay: 360ms; }
	& > *:nth-child(4) { animation-delay: 480ms; }
	@keyframes sectionIn {
		from { opacity: 0; transform: translateY(10px); filter: blur(3px); }
		to { opacity: 1; transform: translateY(0); filter: blur(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		& > * { animation: none; }
	}
`

/* ─── Hero (dark ink poster) ─────────────────────────────────────── */
const Hero = styled.div`
	position: relative;
	padding: 20px 24px 28px;
	border-radius: 18px;
	overflow: hidden;
	color: #ffffff;
	box-shadow:
		0 20px 40px -16px rgba(15, 23, 42, 0.5),
		0 0 0 1px rgba(255, 255, 255, 0.06) inset;
`
const HeroBg = styled.div`
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%);
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
		background: radial-gradient(circle, rgba(129, 140, 248, 0.35), transparent 70%);
	}
	&::after {
		bottom: -50%;
		left: -10%;
		width: 260px;
		height: 260px;
		background: radial-gradient(circle, rgba(45, 212, 191, 0.22), transparent 70%);
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
const HeroGrain = styled.div`
	position: absolute;
	inset: 0;
	z-index: 1;
	pointer-events: none;
	opacity: 0.14;
	mix-blend-mode: overlay;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
`
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
	@media (prefers-reduced-motion: reduce) { animation: none; opacity: 0; }
`
const HeroRow = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	gap: 10px;
`
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
	margin-top: 24px;
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
	font-size: 28px;
	font-weight: 800;
	color: #ffffff;
	margin: 0;
	letter-spacing: -0.6px;
	line-height: 1.15;
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
const HeroSub = styled.div`
	font-size: 13px;
	color: rgba(203, 213, 225, 0.85);
`

/* ─── Error box ──────────────────────────────────────────────────── */
const ErrorBox = styled.div`
	padding: 10px 14px;
	border-radius: 12px;
	background: rgba(220, 38, 38, 0.08);
	border: 1px solid rgba(220, 38, 38, 0.15);
	color: #b91c1c;
	font-size: 12.5px;
	font-weight: 500;
	text-align: center;
`

/* ─── Discord CTA (same as InviteLandingPage) ────────────────────── */
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
	&:hover { transform: translateY(-2px); }
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
