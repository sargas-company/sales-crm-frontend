import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
	ArrowBackRounded,
	CheckCircleOutlined,
	HighlightOffOutlined,
	ReportProblemOutlined,
	TimerOutlined,
} from '@mui/icons-material'
import {
	AuditResult,
	useListAuditEventsQuery,
} from '../../store/credentials/auditApi'

const SensitiveAccess = () => {
	const [action, setAction] = useState<string>('')
	const [result, setResult] = useState<AuditResult | ''>('')
	const { data, isLoading } = useListAuditEventsQuery({
		domain: 'credentials',
		action: action || undefined,
		result: result || undefined,
		limit: 100,
	})
	const rows = data?.data ?? []

	return (
		<Shell>
			<Back to='/credentials'>
				<ArrowBackRounded style={{ fontSize: 18 }} />
				Back to vault
			</Back>
			<Head>
				<h1>Sensitive Access</h1>
				<p>
					Append-only audit of every vault event: unlocks, reveals, copies,
					edits, archives, deletions. Entries never go away.
				</p>
			</Head>

			<Toolbar>
				<SegGroup>
					{(['', 'account.reveal', 'account.copy', 'vault.unlock', 'account.update'] as const).map(
						(a) => (
							<Seg
								key={a || 'all'}
								$active={action === a}
								onClick={() => setAction(a)}
							>
								{a === '' ? 'All' : a.split('.')[1] || a}
							</Seg>
						),
					)}
				</SegGroup>
				<SegGroup>
					{(['', 'SUCCESS', 'DENIED', 'FAILED'] as const).map((r) => (
						<Seg
							key={r || 'any'}
							$active={result === r}
							onClick={() => setResult(r as AuditResult | '')}
						>
							{r === '' ? 'Any' : r}
						</Seg>
					))}
				</SegGroup>
			</Toolbar>

			{isLoading ? (
				<Empty>Loading…</Empty>
			) : rows.length === 0 ? (
				<Empty>Nothing matches these filters.</Empty>
			) : (
				<Timeline>
					{rows.map((e) => (
						<Row key={e.id}>
							<ResultIcon $result={e.result}>
								{e.result === 'SUCCESS' ? (
									<CheckCircleOutlined />
								) : e.result === 'DENIED' ? (
									<HighlightOffOutlined />
								) : (
									<ReportProblemOutlined />
								)}
							</ResultIcon>
							<Body>
								<Line>
									<strong>{e.action}</strong>
									{e.targetLabel && <span className='target'>{e.targetLabel}</span>}
								</Line>
								<Meta>
									<span>
										<TimerOutlined style={{ fontSize: 12 }} />
										{new Date(e.occurredAt).toLocaleString()}
									</span>
									{e.actorUserId && (
										<span className='mono'>actor:{e.actorUserId.slice(0, 8)}</span>
									)}
									{e.ip && <span className='mono'>ip:{e.ip}</span>}
									{e.metadata && Object.keys(e.metadata).length > 0 && (
										<Code>
											{JSON.stringify(e.metadata)}
										</Code>
									)}
								</Meta>
							</Body>
							<ResultBadge $result={e.result}>{e.result}</ResultBadge>
						</Row>
					))}
				</Timeline>
			)}
		</Shell>
	)
}

export default SensitiveAccess

/* ─── Styles ──────────────────────────────────────────────────── */

const Shell = styled.div`
	max-width: 1000px;
	margin: 0 auto;
	padding: 24px 28px 48px;
`

const Back = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	color: #0369a1;
	text-decoration: none;
	font-size: 12.5px;
	font-weight: 700;
	margin-bottom: 14px;
	&:hover {
		text-decoration: underline;
	}
`

const Head = styled.header`
	margin-bottom: 22px;
	h1 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 28px;
		letter-spacing: -0.5px;
	}
	p {
		margin: 4px 0 0;
		max-width: 60ch;
		color: #475569;
	}
`

const Toolbar = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 18px;
	flex-wrap: wrap;
`

const SegGroup = styled.div`
	display: inline-flex;
	gap: 4px;
	padding: 3px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
`

const Seg = styled.button<{ $active: boolean }>`
	padding: 6px 12px;
	border-radius: 999px;
	border: none;
	background: ${(p) => (p.$active ? '#ffffff' : 'transparent')};
	color: ${(p) => (p.$active ? '#0369a1' : '#64748b')};
	font: inherit;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	box-shadow: ${(p) => (p.$active ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none')};
`

const Empty = styled.div`
	padding: 48px;
	text-align: center;
	color: #64748b;
	border-radius: 14px;
	border: 1px dashed rgba(15, 23, 42, 0.1);
`

const Timeline = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const Row = styled.div`
	display: grid;
	grid-template-columns: 36px 1fr auto;
	gap: 14px;
	align-items: center;
	padding: 12px 16px;
	border-radius: 12px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`

const ResultIcon = styled.div<{ $result: AuditResult }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 999px;
	background: ${(p) =>
		p.$result === 'SUCCESS'
			? 'rgba(5, 150, 105, 0.14)'
			: p.$result === 'DENIED'
				? 'rgba(220, 38, 38, 0.14)'
				: 'rgba(217, 119, 6, 0.14)'};
	color: ${(p) =>
		p.$result === 'SUCCESS'
			? '#047857'
			: p.$result === 'DENIED'
				? '#b91c1c'
				: '#b45309'};
	svg {
		font-size: 20px;
	}
`

const Body = styled.div`
	min-width: 0;
`

const Line = styled.div`
	display: flex;
	align-items: baseline;
	gap: 10px;
	strong {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-weight: 700;
		font-size: 13px;
		color: #0f172a;
	}
	.target {
		font-size: 12.5px;
		color: #334155;
	}
`

const Meta = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	margin-top: 4px;
	font-size: 11px;
	color: #64748b;
	flex-wrap: wrap;
	span {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.mono {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
	}
`

const Code = styled.code`
	display: inline-block;
	padding: 2px 6px;
	border-radius: 6px;
	background: rgba(15, 23, 42, 0.05);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	color: #475569;
	max-width: 420px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const ResultBadge = styled.span<{ $result: AuditResult }>`
	padding: 3px 10px;
	border-radius: 999px;
	background: ${(p) =>
		p.$result === 'SUCCESS'
			? 'rgba(5, 150, 105, 0.14)'
			: p.$result === 'DENIED'
				? 'rgba(220, 38, 38, 0.14)'
				: 'rgba(217, 119, 6, 0.14)'};
	color: ${(p) =>
		p.$result === 'SUCCESS'
			? '#047857'
			: p.$result === 'DENIED'
				? '#b91c1c'
				: '#b45309'};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	font-weight: 700;
`
