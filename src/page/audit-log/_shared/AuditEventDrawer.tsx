import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	CloseRounded,
	CodeOutlined,
	ExpandMoreRounded,
	NorthEastRounded,
	WarningAmberRounded,
	CheckCircleOutlined,
	HighlightOffOutlined,
	ReportProblemOutlined,
	PersonOutlineRounded,
	TerminalRounded,
	MyLocationRounded,
	CategoryRounded,
	PublicRounded,
	DevicesRounded,
	FingerprintRounded,
	ScheduleRounded,
	ShieldOutlined,
	FlashOnRounded,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import {
	AuditEvent,
	useGetAuditEventQuery,
} from '../../../store/audit-log/auditLogApi'
import { DOMAIN_LABEL, describeEvent } from './auditVocab'

interface Props {
	eventId: string
	preview: AuditEvent
	onClose: () => void
}

const PAPER_BG = '#FDFBF7'
const PAPER_INK = '#241E16'
const PAPER_INK_SOFT = '#5C5243'
const PAPER_MUTE = '#7D6E5D'
const PAPER_ACCENT = '#E85D2F'
const PAPER_RULE = 'rgba(36, 30, 22, 0.08)'
const PAPER_RULE_STRONG = 'rgba(36, 30, 22, 0.14)'

const AuditEventDrawer = ({ eventId, preview, onClose }: Props) => {
	const { data: full } = useGetAuditEventQuery(eventId)
	const event = full ?? preview
	const { actorText, verbText, targetText } = describeEvent(event)
	const [closing, setClosing] = useState(false)
	const [showRaw, setShowRaw] = useState(false)

	const requestClose = () => {
		if (closing) return
		setClosing(true)
		window.setTimeout(() => onClose(), 240)
	}

	const occurredDate = new Date(event.occurredAt)
	const dateStr = occurredDate.toLocaleDateString('en-US', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
	const timeStr = occurredDate.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})

	return (
		<Scrim onClick={requestClose} $closing={closing}>
			<Panel onClick={(e) => e.stopPropagation()} $closing={closing}>
				<CloseBtn onClick={requestClose} aria-label='Close'>
					<CloseRounded />
				</CloseBtn>

				<Head>
					<HeadMeta>
						<MetaChip>event</MetaChip>
						<MetaPath>
							<span className='k'>{DOMAIN_LABEL[event.domain] ?? event.domain}</span>
							<span className='sep'>/</span>
							<span className='v'>{event.action}</span>
						</MetaPath>
					</HeadMeta>

					<HeadRow>
						<HeroIcon $result={event.result}>
							{event.result === 'SUCCESS' ? (
								<CheckCircleOutlined />
							) : event.result === 'DENIED' ? (
								<HighlightOffOutlined />
							) : (
								<ReportProblemOutlined />
							)}
						</HeroIcon>
						<HeroText>
							<Hero>
								<ActorInline>{actorText}</ActorInline>{' '}
								<Verb>{verbText}</Verb>
								{targetText && (
									<>
										{' '}
										<TargetInline>{targetText}</TargetInline>
									</>
								)}
							</Hero>
							<DateLine>
								<ScheduleRounded style={{ fontSize: 14 }} />
								<span className='d'>{dateStr}</span>
								<span className='t'>{timeStr}</span>
							</DateLine>
						</HeroText>
					</HeadRow>

					<HeadStrip>
						<StripChip $tone={resultTone(event.result)}>
							<FlashOnRounded style={{ fontSize: 13 }} />
							{event.result.toLowerCase()}
						</StripChip>
						<StripChip
							$tone={event.severity === 'CRITICAL' ? 'danger' : event.severity === 'WARNING' ? 'warn' : 'info'}
						>
							<ShieldOutlined style={{ fontSize: 13 }} />
							{event.severity.toLowerCase()}
						</StripChip>
						<StripChip $tone='neutral'>
							<CategoryRounded style={{ fontSize: 13 }} />
							{DOMAIN_LABEL[event.domain] ?? event.domain}
						</StripChip>
					</HeadStrip>
				</Head>

				<Section>
					<SectionTitle>
						<span className='dot' />
						Context
					</SectionTitle>
					<FactGrid>
						<Fact>
							<FactIcon>
								<PersonOutlineRounded />
							</FactIcon>
							<FactBody>
								<FactLabel>Actor</FactLabel>
								<FactValue>
									{event.actorName ?? event.actorEmail ?? '—'}
								</FactValue>
								{event.actorEmail && event.actorName && (
									<FactMuted>{event.actorEmail}</FactMuted>
								)}
							</FactBody>
						</Fact>
						<Fact>
							<FactIcon>
								<TerminalRounded />
							</FactIcon>
							<FactBody>
								<FactLabel>Action</FactLabel>
								<FactMono>{event.action}</FactMono>
							</FactBody>
						</Fact>
						{event.targetLabel && (
							<Fact>
								<FactIcon>
									<MyLocationRounded />
								</FactIcon>
								<FactBody>
									<FactLabel>Target</FactLabel>
									<FactValue>
										{event.targetHref ? (
											<TargetLink
												to={event.targetHref}
												onClick={onClose}
											>
												{event.targetLabel}
												<NorthEastRounded style={{ fontSize: 13 }} />
											</TargetLink>
										) : (
											event.targetLabel
										)}
									</FactValue>
								</FactBody>
							</Fact>
						)}
						{event.targetType && (
							<Fact>
								<FactIcon>
									<CategoryRounded />
								</FactIcon>
								<FactBody>
									<FactLabel>Target type</FactLabel>
									<FactMono>{event.targetType}</FactMono>
								</FactBody>
							</Fact>
						)}
						{event.ip && (
							<Fact>
								<FactIcon>
									<PublicRounded />
								</FactIcon>
								<FactBody>
									<FactLabel>IP address</FactLabel>
									<FactMono>{event.ip}</FactMono>
								</FactBody>
							</Fact>
						)}
						{event.userAgent && (
							<Fact>
								<FactIcon>
									<DevicesRounded />
								</FactIcon>
								<FactBody>
									<FactLabel>User agent</FactLabel>
									<FactMuted title={event.userAgent}>
										{event.userAgent.length > 80
											? event.userAgent.slice(0, 80) + '…'
											: event.userAgent}
									</FactMuted>
								</FactBody>
							</Fact>
						)}
						{event.requestId && (
							<Fact>
								<FactIcon>
									<FingerprintRounded />
								</FactIcon>
								<FactBody>
									<FactLabel>Request ID</FactLabel>
									<FactMono>{event.requestId}</FactMono>
								</FactBody>
							</Fact>
						)}
					</FactGrid>
				</Section>

				{event.changes && Object.keys(event.changes).length > 0 && (
					<Section>
						<SectionTitle>
							<span className='dot' />
							Changes
							<CountPill>{Object.keys(event.changes).length}</CountPill>
						</SectionTitle>
						<DiffList>
							{Object.entries(event.changes).map(([field, diff]) => (
								<DiffRow key={field}>
									<DiffField>{humanField(field)}</DiffField>
									<DiffValues diff={diff as any} />
								</DiffRow>
							))}
						</DiffList>
					</Section>
				)}

				{event.result !== 'SUCCESS' && event.metadata?.reason && (
					<Section>
						<SectionTitle>
							<span className='dot' />
							Reason
						</SectionTitle>
						<Reason>
							<WarningAmberRounded style={{ fontSize: 18 }} />
							<span>{String(event.metadata.reason)}</span>
						</Reason>
					</Section>
				)}

				{(event.metadata || event.changes) && (
					<Section>
						<RawToggle
							type='button'
							$open={showRaw}
							onClick={() => setShowRaw((v) => !v)}
						>
							<CodeOutlined style={{ fontSize: 16 }} />
							Technical metadata
							<ExpandMoreRounded className='chev' />
						</RawToggle>
						{showRaw && (
							<RawBlock>
								<pre>
									{JSON.stringify(
										{
											metadata: event.metadata ?? null,
											changes: event.changes ?? null,
										},
										null,
										2,
									)}
								</pre>
							</RawBlock>
						)}
					</Section>
				)}
			</Panel>
		</Scrim>
	)
}

export default AuditEventDrawer

/* ─── Helpers ────────────────────────────────────────────────── */

const resultTone = (
	r: 'SUCCESS' | 'DENIED' | 'FAILED',
): 'success' | 'danger' | 'warn' =>
	r === 'SUCCESS' ? 'success' : r === 'DENIED' ? 'danger' : 'warn'

const humanField = (f: string) =>
	f
		.replace(/([A-Z])/g, ' $1')
		.replace(/[._-]/g, ' ')
		.toLowerCase()
		.replace(/^\s*(\w)/, (_, c: string) => c.toUpperCase())

const DiffValues = ({
	diff,
}: {
	diff:
		| { before: unknown; after: unknown }
		| { changed: true }
		| { added: string[]; removed: string[] }
}) => {
	if ('changed' in diff) {
		return <RedactedBit>Changed · value is redacted</RedactedBit>
	}
	if ('added' in diff || 'removed' in diff) {
		const d = diff as { added?: string[]; removed?: string[] }
		return (
			<PermList>
				{d.added?.map((p) => (
					<Chip key={`+${p}`} $tone='success'>
						+ {p}
					</Chip>
				))}
				{d.removed?.map((p) => (
					<Chip key={`-${p}`} $tone='danger'>
						− {p}
					</Chip>
				))}
			</PermList>
		)
	}
	return (
		<DiffPair>
			<Before>{formatValue(diff.before)}</Before>
			<Arrow>→</Arrow>
			<After>{formatValue(diff.after)}</After>
		</DiffPair>
	)
}

const formatValue = (v: unknown): string => {
	if (v === null || v === undefined) return '—'
	if (typeof v === 'string') return v || '—'
	if (typeof v === 'number' || typeof v === 'boolean') return String(v)
	try {
		return JSON.stringify(v)
	} catch {
		return String(v)
	}
}

/* ─── Styles ──────────────────────────────────────────────────── */

const scrimFadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const scrimFadeOut = keyframes`from { opacity: 1; } to { opacity: 0; }`

const panelIn = keyframes`
	from { opacity: 0; transform: translateX(32px); }
	to { opacity: 1; transform: translateX(0); }
`
const panelOut = keyframes`
	0% { opacity: 1; transform: translateX(0); }
	100% { opacity: 0; transform: translateX(24px); }
`

const sectionIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Scrim = styled.div<{ $closing: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.35);
	backdrop-filter: blur(4px);
	display: flex;
	justify-content: flex-end;
	z-index: 1000;
	animation: ${(p) => (p.$closing ? scrimFadeOut : scrimFadeIn)}
		${(p) => (p.$closing ? '260ms' : '180ms')}
		ease-out forwards;
`

const Panel = styled.aside<{ $closing: boolean }>`
	position: relative;
	background: ${PAPER_BG};
	width: 100%;
	max-width: 620px;
	height: 100%;
	overflow-y: auto;
	padding: 32px 32px 48px;
	display: flex;
	flex-direction: column;
	gap: 28px;
	box-shadow: -16px 0 56px rgba(15, 23, 42, 0.18);
	animation: ${(p) => (p.$closing ? panelOut : panelIn)}
		${(p) => (p.$closing ? '220ms' : '320ms')}
		cubic-bezier(0.22, 1, 0.36, 1) forwards;

	/* Thin paper edge rail */
	&::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 3px;
		background: ${PAPER_ACCENT};
	}
`

const CloseBtn = styled.button`
	position: absolute;
	top: 20px;
	right: 20px;
	background: transparent;
	border: 1px solid ${PAPER_RULE};
	cursor: pointer;
	color: ${PAPER_INK_SOFT};
	width: 36px;
	height: 36px;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
	z-index: 2;

	svg {
		font-size: 20px;
	}

	&:hover {
		border-color: ${PAPER_INK};
		color: ${PAPER_INK};
		background: #ffffff;
	}
`

const Head = styled.header`
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding-right: 44px;
	padding-bottom: 20px;
	border-bottom: 1px dashed ${PAPER_RULE_STRONG};
	animation: ${sectionIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const HeadMeta = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
`

const MetaChip = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${PAPER_INK};
	color: #fdfaf2;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
`

const MetaPath = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: ${PAPER_MUTE};
	letter-spacing: 0.4px;

	.k {
		text-transform: uppercase;
	}
	.sep {
		opacity: 0.5;
	}
	.v {
		color: ${PAPER_INK};
		font-weight: 600;
	}
`

const HeadRow = styled.div`
	display: grid;
	grid-template-columns: 56px 1fr;
	gap: 16px;
	align-items: flex-start;
`

const HeroIcon = styled.div<{ $result: 'SUCCESS' | 'DENIED' | 'FAILED' }>`
	width: 56px;
	height: 56px;
	border-radius: 16px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${(p) =>
		p.$result === 'SUCCESS'
			? 'rgba(5, 150, 105, 0.1)'
			: p.$result === 'DENIED'
				? 'rgba(220, 38, 38, 0.1)'
				: 'rgba(217, 119, 6, 0.12)'};
	color: ${(p) =>
		p.$result === 'SUCCESS'
			? '#047857'
			: p.$result === 'DENIED'
				? '#c2410c'
				: '#b45309'};

	svg {
		font-size: 28px;
	}
`

const HeroText = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const Hero = styled.h2`
	margin: 0;
	font-family: 'Fraunces', 'Georgia', serif;
	font-variation-settings: 'opsz' 36;
	font-size: 24px;
	font-weight: 600;
	color: ${PAPER_INK};
	letter-spacing: -0.4px;
	line-height: 1.25;
	word-break: break-word;
`

const ActorInline = styled.span`
	color: ${PAPER_INK};
	font-weight: 700;
`
const Verb = styled.span`
	color: ${PAPER_INK_SOFT};
	font-weight: 500;
	font-style: italic;
`
const TargetInline = styled.span`
	color: ${PAPER_ACCENT};
	font-weight: 700;
`

const DateLine = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: ${PAPER_MUTE};
	letter-spacing: 0.3px;

	svg {
		color: ${PAPER_MUTE};
	}

	.d {
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.t {
		color: ${PAPER_INK};
		font-weight: 600;
	}
	.t::before {
		content: '·';
		margin-right: 6px;
		color: ${PAPER_MUTE};
		font-weight: 400;
	}
`

const HeadStrip = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	gap: 6px;
`

const StripChip = styled.span<{
	$tone: 'success' | 'danger' | 'warn' | 'info' | 'neutral'
}>`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 5px 11px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	background: ${(p) =>
		p.$tone === 'success'
			? 'rgba(5, 150, 105, 0.1)'
			: p.$tone === 'danger'
				? 'rgba(220, 38, 38, 0.1)'
				: p.$tone === 'warn'
					? 'rgba(232, 93, 47, 0.12)'
					: p.$tone === 'info'
						? 'rgba(3, 105, 161, 0.1)'
						: 'rgba(36, 30, 22, 0.06)'};
	color: ${(p) =>
		p.$tone === 'success'
			? '#047857'
			: p.$tone === 'danger'
				? '#c2410c'
				: p.$tone === 'warn'
					? '#e85d2f'
					: p.$tone === 'info'
						? '#0369a1'
						: PAPER_INK};
`

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 12px;
	animation: ${sectionIn} 360ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:nth-of-type(1) {
		animation-delay: 60ms;
	}
	&:nth-of-type(2) {
		animation-delay: 120ms;
	}
	&:nth-of-type(3) {
		animation-delay: 180ms;
	}
	&:nth-of-type(4) {
		animation-delay: 240ms;
	}
`

const SectionTitle = styled.h3`
	margin: 0;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	font-family: 'Fraunces', 'Georgia', serif;
	font-variation-settings: 'opsz' 36;
	font-size: 17px;
	font-weight: 600;
	color: ${PAPER_INK};
	letter-spacing: -0.2px;

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: ${PAPER_ACCENT};
	}
`

const CountPill = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 20px;
	padding: 0 7px;
	height: 20px;
	border-radius: 999px;
	background: rgba(232, 93, 47, 0.12);
	color: ${PAPER_ACCENT};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	font-weight: 700;
	margin-left: 2px;
`

const FactGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;

	@media (max-width: 540px) {
		grid-template-columns: 1fr;
	}
`

const Fact = styled.div`
	display: grid;
	grid-template-columns: 32px 1fr;
	gap: 10px;
	align-items: flex-start;
	padding: 12px 14px;
	border-radius: 12px;
	background: #ffffff;
	border: 1px solid ${PAPER_RULE};
	transition: border-color 180ms ease, transform 180ms ease;

	&:hover {
		border-color: ${PAPER_RULE_STRONG};
	}
`

const FactIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 10px;
	background: rgba(232, 93, 47, 0.09);
	color: ${PAPER_ACCENT};
	flex-shrink: 0;

	svg {
		font-size: 18px;
	}
`

const FactBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const FactLabel = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 9.5px;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: ${PAPER_MUTE};
`

const FactValue = styled.span`
	font-size: 13px;
	font-weight: 600;
	color: ${PAPER_INK};
	word-break: break-word;
`

const FactMuted = styled.span`
	font-size: 11.5px;
	color: ${PAPER_MUTE};
`

const FactMono = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${PAPER_INK};
	word-break: break-all;
`

const TargetLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	color: ${PAPER_ACCENT};
	text-decoration: none;
	font-weight: 700;
	transition: color 180ms ease;

	svg {
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover {
		color: ${PAPER_INK};
	}
	&:hover svg {
		transform: translate(2px, -2px);
	}
`

const DiffList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const DiffRow = styled.div`
	display: grid;
	grid-template-columns: 160px 1fr;
	gap: 14px;
	padding: 10px 14px;
	border-radius: 10px;
	background: #ffffff;
	border: 1px solid ${PAPER_RULE};
	align-items: center;

	@media (max-width: 540px) {
		grid-template-columns: 1fr;
	}
`

const DiffField = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: ${PAPER_MUTE};
	letter-spacing: 0.3px;
	text-transform: uppercase;
`

const DiffPair = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	font-size: 12.5px;
`

const Before = styled.span`
	padding: 3px 10px;
	border-radius: 7px;
	background: rgba(220, 38, 38, 0.08);
	color: #c2410c;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-weight: 600;
	max-width: 180px;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: line-through;
	text-decoration-color: rgba(194, 65, 12, 0.4);
`

const Arrow = styled.span`
	color: ${PAPER_MUTE};
	font-weight: 700;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
`

const After = styled.span`
	padding: 3px 10px;
	border-radius: 7px;
	background: rgba(5, 150, 105, 0.1);
	color: #047857;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-weight: 600;
	max-width: 180px;
	overflow: hidden;
	text-overflow: ellipsis;
`

const RedactedBit = styled.span`
	padding: 3px 10px;
	border-radius: 7px;
	background: rgba(36, 30, 22, 0.06);
	color: ${PAPER_MUTE};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-style: italic;
`

const PermList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
`

const Chip = styled.span<{ $tone: 'success' | 'danger' }>`
	padding: 2px 8px;
	border-radius: 7px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	font-weight: 600;
	background: ${(p) =>
		p.$tone === 'success'
			? 'rgba(5, 150, 105, 0.1)'
			: 'rgba(220, 38, 38, 0.08)'};
	color: ${(p) => (p.$tone === 'success' ? '#047857' : '#c2410c')};
`

const Reason = styled.div`
	display: inline-flex;
	align-items: flex-start;
	gap: 10px;
	padding: 14px 16px;
	border-radius: 12px;
	background: rgba(232, 93, 47, 0.08);
	border: 1px solid rgba(232, 93, 47, 0.25);
	color: ${PAPER_INK};
	font-size: 13px;
	line-height: 1.5;

	svg {
		color: ${PAPER_ACCENT};
		flex-shrink: 0;
		margin-top: 1px;
	}
`

const RawToggle = styled.button<{ $open: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px;
	border-radius: 999px;
	border: 1.5px solid ${PAPER_RULE_STRONG};
	background: #ffffff;
	color: ${PAPER_MUTE};
	font: inherit;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	align-self: flex-start;
	transition: border-color 180ms ease, color 180ms ease;

	.chev {
		font-size: 16px;
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
		transform: rotate(${(p) => (p.$open ? '180deg' : '0deg')});
	}

	&:hover {
		border-color: ${PAPER_INK};
		color: ${PAPER_INK};
	}
`

const RawBlock = styled.div`
	padding: 14px 16px;
	border-radius: 12px;
	background: ${PAPER_INK};
	color: #e2e8f0;
	overflow-x: auto;
	border: 1px solid rgba(0, 0, 0, 0.4);

	pre {
		margin: 0;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 11px;
		line-height: 1.55;
		white-space: pre;
	}
`

/* ─── Kept for diff fallbacks (unused literal T token) ───────────── */
void T
