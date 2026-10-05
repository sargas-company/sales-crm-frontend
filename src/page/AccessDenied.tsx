import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import {
	LockOutlined,
	HomeRounded,
	ArrowBackRounded,
	ShieldOutlined,
} from '@mui/icons-material'
import usePermissions from '../hooks/usePermissions'
import { firstAvailableLandingPath } from '../routes/landing'
import { T } from '../components/sales-analytics/_shared/tokens'

/**
 * Authenticated-only fallback when the caller lacks the permission
 * the target route required. Same visual language as our premium
 * analytics pages: Bricolage headline, big-number background, primary
 * gradient icon and two clear actions.
 */
const AccessDenied = () => {
	const navigate = useNavigate()
	const { has } = usePermissions()
	const fallback = firstAvailableLandingPath(has)

	return (
		<Shell>
			<BgNumber aria-hidden='true'>403</BgNumber>

			<Card>
				<IconStack>
					<IconRing $delay={0} />
					<IconRing $delay={0.8} />
					<IconWrap>
						<LockOutlined style={{ fontSize: 34 }} />
					</IconWrap>
				</IconStack>

				<Eyebrow>
					<ShieldOutlined style={{ fontSize: 12 }} />
					403 · Restricted area
				</Eyebrow>
				<Title>
					Access <TitleAccent>denied</TitleAccent>.
				</Title>
				<Copy>
					Your role doesn&rsquo;t include permission to open this page. Ask an
					administrator to grant it, or head somewhere you can already access.
				</Copy>

				<Actions>
					{fallback ? (
						<PrimaryBtn type='button' onClick={() => navigate(fallback)}>
							<HomeRounded style={{ fontSize: 18 }} />
							Go to home
						</PrimaryBtn>
					) : null}
					<GhostBtn type='button' onClick={() => navigate(-1)}>
						<ArrowBackRounded style={{ fontSize: 18 }} />
						Go back
					</GhostBtn>
				</Actions>
			</Card>
		</Shell>
	)
}

export default AccessDenied

/* ─── Styles ────────────────────────────────────────────────────── */

const shellIn = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Shell = styled.section`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: calc(100vh - 160px);
	padding: 40px 24px;
	overflow: hidden;
	background:
		radial-gradient(
			1200px 700px at 50% 0%,
			${T.primaryTint} 0%,
			transparent 60%
		),
		radial-gradient(
			800px 500px at 100% 100%,
			rgba(217, 119, 6, 0.06) 0%,
			transparent 55%
		);
	animation: ${shellIn} 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const bgFloat = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
`

const BgNumber = styled.div`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -55%);
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: clamp(220px, 40vw, 420px);
	font-weight: 700;
	line-height: 1;
	letter-spacing: -0.06em;
	color: rgba(3, 105, 161, 0.06);
	pointer-events: none;
	user-select: none;
	animation: ${bgFloat} 8s ease-in-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const Card = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	max-width: 520px;
	padding: 44px 44px 38px;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(15, 23, 42, 0.05);
	border-radius: 22px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 20px 50px rgba(15, 23, 42, 0.08);
	text-align: center;

	@media (max-width: 560px) {
		padding: 32px 22px 28px;
	}
`

const IconStack = styled.div`
	position: relative;
	width: 96px;
	height: 96px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 6px;
`

const ringPulse = keyframes`
	0% {
		transform: scale(0.85);
		opacity: 0.55;
	}
	100% {
		transform: scale(1.6);
		opacity: 0;
	}
`

const IconRing = styled.span<{ $delay: number }>`
	position: absolute;
	inset: 0;
	border-radius: 50%;
	border: 2px solid ${T.primary};
	opacity: 0.4;
	animation: ${ringPulse} 2.4s ease-out infinite;
	animation-delay: ${({ $delay }) => $delay}s;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		opacity: 0;
	}
`

const iconFloat = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-4px); }
`

const IconWrap = styled.span`
	position: relative;
	z-index: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 72px;
	height: 72px;
	border-radius: 50%;
	background: linear-gradient(135deg, ${T.primary}, #075985);
	color: #ffffff;
	box-shadow: 0 12px 30px rgba(3, 105, 161, 0.35);
	animation: ${iconFloat} 4s ease-in-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const Eyebrow = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 12px;
	border-radius: 999px;
	background: ${T.primaryTint};
	color: ${T.primary};
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.8px;
	text-transform: uppercase;
`

const Title = styled.h1`
	margin: 6px 0 0;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: clamp(28px, 5vw, 40px);
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -1px;
	line-height: 1.1;
`

const TitleAccent = styled.span`
	color: ${T.primary};
	font-style: italic;
`

const Copy = styled.p`
	margin: 8px 0 4px;
	max-width: 400px;
	font-size: 14.5px;
	line-height: 1.55;
	color: ${T.textSecondary};
`

const Actions = styled.div`
	display: inline-flex;
	gap: 10px;
	margin-top: 18px;
	flex-wrap: wrap;
	justify-content: center;
`

const PrimaryBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 11px 22px;
	border-radius: 999px;
	border: none;
	background: linear-gradient(135deg, ${T.primary}, #075985);
	color: #ffffff;
	font: inherit;
	font-size: 13.5px;
	font-weight: 700;
	cursor: pointer;
	text-transform: none;
	letter-spacing: 0.2px;
	box-shadow: 0 6px 18px rgba(3, 105, 161, 0.28);
	transition:
		transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
		box-shadow 200ms ease;
	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 22px rgba(3, 105, 161, 0.36);
	}
`

const GhostBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 11px 22px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.12);
	background: #ffffff;
	color: ${T.textSecondary};
	font: inherit;
	font-size: 13.5px;
	font-weight: 600;
	cursor: pointer;
	text-transform: none;
	transition:
		border-color 200ms ease,
		color 200ms ease,
		transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
		transform: translateY(-1px);
	}
`
