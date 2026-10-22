import { useState } from 'react'
import styled from 'styled-components'
import { HistoryRounded, VisibilityRounded } from '@mui/icons-material'
import {
	useListAccountHistoryQuery,
	type SecretPayload,
} from '../../store/credentials/credentialsApi'
import { fetchVersionReveal } from '../../store/credentials/revealTransport'

interface Props {
	accountId: string
	onVersionRevealed: (payload: {
		versionId: string
		changedAt: string
		secrets: SecretPayload
	}) => void
}

const HistoryPanel = ({ accountId, onVersionRevealed }: Props) => {
	const [open, setOpen] = useState(false)
	const [busyId, setBusyId] = useState<string | null>(null)
	const [err, setErr] = useState<string | null>(null)
	const { data, isLoading } = useListAccountHistoryQuery(accountId, {
		skip: !open,
	})

	const reveal = async (versionId: string, changedAt: string) => {
		setErr(null)
		setBusyId(versionId)
		try {
			// Backend returns only `secrets`; versionId / changedAt come
			// from the row the user clicked on (passed in as args).
			const result = await fetchVersionReveal(accountId, versionId)
			onVersionRevealed({
				versionId,
				changedAt,
				secrets: result.secrets,
			})
		} catch (e) {
			setErr((e as Error).message || 'Reveal failed')
		} finally {
			setBusyId(null)
		}
	}

	const versions = data?.data ?? []

	return (
		<Shell>
			<Toggle
				type='button'
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
			>
				<HistoryRounded style={{ fontSize: 14 }} />
				{open ? 'hide history' : 'change history'}
				{data && versions.length > 0 && <Badge>{versions.length}</Badge>}
			</Toggle>

			<Slot $show={open} aria-hidden={!open}>
				<Inner $show={open}>
					{isLoading && <Hint>loading…</Hint>}
					{!isLoading && versions.length === 0 && (
						<Hint>no previous versions</Hint>
					)}
					{!isLoading && versions.length > 0 && (
						<List>
							{versions.map((v) => {
								const when = new Date(v.changedAt).toLocaleString(
									'en-GB',
									{
										day: '2-digit',
										month: 'short',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
									},
								)
								const who = v.changedBy?.email ?? 'unknown'
								return (
									<V1Row key={v.id}>
										<V1Rail $kind={v.changeReason}>
											<V1Dot $kind={v.changeReason} />
										</V1Rail>
										<V1Body>
											<V1When>{when}</V1When>
											<V1Meta>
												<V1Tag $kind={v.changeReason}>
													{v.changeReason}
												</V1Tag>
												<V1Who>· {who}</V1Who>
											</V1Meta>
										</V1Body>
										<V1Acts>
											<V1Btn
												type='button'
												disabled={busyId === v.id}
												onClick={() => reveal(v.id, v.changedAt)}
											>
												<VisibilityRounded
													style={{ fontSize: 14 }}
												/>
												{busyId === v.id ? 'opening…' : 'reveal'}
											</V1Btn>
										</V1Acts>
									</V1Row>
								)
							})}
						</List>
					)}
					{err && <ErrLine>{err}</ErrLine>}
				</Inner>
			</Slot>
		</Shell>
	)
}

export default HistoryPanel

/* ── Styles ────────────────────────────────────────────────────── */

const Shell = styled.div`
	border-top: 1px dashed rgba(15, 23, 42, 0.14);
	margin-top: 14px;
	padding-top: 10px;
`

const Toggle = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: transparent;
	border: none;
	padding: 4px 2px;
	color: rgba(3, 105, 161, 1);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.3px;
	cursor: pointer;
	&:hover {
		color: #025080;
	}
`

const Badge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 22px;
	padding: 0 7px;
	height: 20px;
	border-radius: 6px;
	background: rgba(3, 105, 161, 0.14);
	color: rgba(3, 105, 161, 1);
	font-size: 12px;
	font-weight: 800;
	margin-left: 6px;
	letter-spacing: 0.2px;
`

const Slot = styled.div<{ $show: boolean }>`
	display: grid;
	grid-template-rows: ${(p) => (p.$show ? '1fr' : '0fr')};
	margin-top: ${(p) => (p.$show ? '10px' : '0px')};
	transition:
		grid-template-rows 240ms cubic-bezier(0.22, 1, 0.36, 1),
		margin-top 240ms cubic-bezier(0.22, 1, 0.36, 1);
`

const Inner = styled.div<{ $show: boolean }>`
	overflow: hidden;
	min-height: 0;
	opacity: ${(p) => (p.$show ? 1 : 0)};
	transition: opacity 180ms ease ${(p) => (p.$show ? '60ms' : '0ms')};
`

const Hint = styled.div`
	color: #64748b;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	padding: 6px 2px;
`

const ErrLine = styled.div`
	color: #b91c1c;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	font-weight: 600;
	padding: 6px 2px;
`

const List = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

/* Timeline rail row */

const V1Row = styled.li`
	display: grid;
	grid-template-columns: 20px 1fr auto;
	gap: 10px;
	padding: 10px 12px 10px 0;
	align-items: center;
`

const V1Rail = styled.div<{ $kind: 'edit' | 'restore' }>`
	position: relative;
	width: 20px;
	align-self: stretch;
	&::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 9px;
		width: 2px;
		background: ${(p) =>
			p.$kind === 'restore'
				? 'linear-gradient(180deg, rgba(166,108,255,0.5), rgba(249,72,146,0.4))'
				: 'linear-gradient(180deg, rgba(3,105,161,0.55), rgba(3,105,161,0.25))'};
	}
`

const V1Dot = styled.span<{ $kind: 'edit' | 'restore' }>`
	position: absolute;
	top: 50%;
	left: 4px;
	transform: translateY(-50%);
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${(p) =>
		p.$kind === 'restore' ? '#a66cff' : 'rgba(3, 105, 161, 1)'};
	box-shadow:
		0 0 0 3px #fff,
		0 0 0 4px rgba(15, 23, 42, 0.08);
`

const V1Body = styled.div``

const V1When = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.2px;
`

const V1Meta = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	margin-top: 3px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: #64748b;
`

const V1Tag = styled.span<{ $kind: 'edit' | 'restore' }>`
	padding: 1px 6px;
	border-radius: 3px;
	background: ${(p) =>
		p.$kind === 'restore'
			? 'rgba(166, 108, 255, 0.14)'
			: 'rgba(3, 105, 161, 0.14)'};
	color: ${(p) =>
		p.$kind === 'restore' ? '#6b21a8' : 'rgba(3, 105, 161, 1)'};
	font-weight: 700;
	letter-spacing: 1px;
	text-transform: uppercase;
	font-size: 9.5px;
`

const V1Who = styled.span``

const V1Acts = styled.div`
	display: inline-flex;
	gap: 6px;
`

const V1Btn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 6px 12px;
	border-radius: 999px;
	border: 1px solid rgba(3, 105, 161, 0.35);
	background: transparent;
	color: rgba(3, 105, 161, 1);
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: -0.1px;
	cursor: pointer;
	transition: transform 180ms cubic-bezier(0.22, 1.35, 0.36, 1);
	&:hover:not(:disabled) {
		transform: scale(1.1);
	}
	&:disabled {
		opacity: 0.55;
		cursor: default;
	}
`
