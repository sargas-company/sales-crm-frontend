import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import styled from 'styled-components'
import {
	EditOutlined,
	DeleteOutline,
	ArrowBackRounded,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import {
	useDeleteClientMutation,
	useGetClientActivityQuery,
	useGetClientByIdQuery,
	type ApiClientStatus,
	type ClientItem,
} from '../../../store/clients/clientsApi'
import PermissionGate from '../../../components/auth/PermissionGate'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import {
	countryToFlag,
	formatPhoneDisplay,
	phoneCountryIso,
} from '../../../utils/phone'
import ActivityTimeline, {
	ActivityHeading,
} from '../../../components/_shared/ActivityTimeline'

const statusLabel: Record<ApiClientStatus, string> = {
	ACTIVE: 'Active',
	ON_HOLD: 'On hold',
	FORMER: 'Former',
}

const nameOf = (c: ClientItem) =>
	[c.firstName, c.lastName].filter(Boolean).join(' ').trim() || 'Client'

const ClientView = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { data, isLoading, isError } = useGetClientByIdQuery(id!, {
		skip: !id,
	})
	const {
		data: activity,
		isLoading: activityLoading,
		isError: activityError,
	} = useGetClientActivityQuery(id!, { skip: !id })
	const [deleteClient, { isLoading: deleting }] = useDeleteClientMutation()
	const [confirmOpen, setConfirmOpen] = useState(false)

	if (!id) return <Shell>Missing client id.</Shell>
	if (isLoading) return <Shell>Loading client…</Shell>
	if (isError || !data) return <Shell>Client not found.</Shell>

	const iso = phoneCountryIso(data.phone)
	const flag = countryToFlag(iso)

	const handleDelete = async () => {
		try {
			await deleteClient(id).unwrap()
			showToast('Client deleted', 'success')
			navigate('/clients/list/')
		} catch (err) {
			showToast(parseServerError(err), 'error')
			setConfirmOpen(false)
		}
	}

	return (
		<Shell>
			<Head>
				<BackLink to='/clients/list/'>
					<ArrowBackRounded fontSize='small' />
					Back to clients
				</BackLink>
				<Title>
					<h2>{nameOf(data)}</h2>
					<StatusPill $status={data.status}>
						{statusLabel[data.status]}
					</StatusPill>
				</Title>
				<Actions>
					<PermissionGate permission='clients:update'>
						<GhostBtn onClick={() => navigate(`/clients/edit/${id}`)}>
							<EditOutlined fontSize='small' />
							Edit
						</GhostBtn>
					</PermissionGate>
					<PermissionGate permission='clients:delete'>
						<DangerBtn
							disabled={deleting}
							onClick={() => setConfirmOpen(true)}
						>
							<DeleteOutline fontSize='small' />
							Delete
						</DangerBtn>
					</PermissionGate>
				</Actions>
			</Head>

			<Grid>
				<Card>
					<CardHead>Contact</CardHead>
					<Rows>
						<Row>
							<Label>Company</Label>
							<Value>{data.company ?? <Muted>—</Muted>}</Value>
						</Row>
						<Row>
							<Label>Email</Label>
							<Value>
								{data.email ? (
									<a href={`mailto:${data.email}`}>{data.email}</a>
								) : (
									<Muted>—</Muted>
								)}
							</Value>
						</Row>
						<Row>
							<Label>Phone</Label>
							<Value>
								{data.phone ? (
									<PhoneCell>
										{flag && <Flag title={iso ?? undefined}>{flag}</Flag>}
										<a href={`tel:${data.phone}`}>
											{formatPhoneDisplay(data.phone)}
										</a>
									</PhoneCell>
								) : (
									<Muted>—</Muted>
								)}
							</Value>
						</Row>
						<Row>
							<Label>Source</Label>
							<Value>{data.source ?? <Muted>—</Muted>}</Value>
						</Row>
						<Row>
							<Label>Profile</Label>
							<Value>
								{data.profileUrl ? (
									<a
										href={data.profileUrl}
										target='_blank'
										rel='noopener noreferrer'
									>
										Open profile
									</a>
								) : (
									<Muted>—</Muted>
								)}
							</Value>
						</Row>
						<Row>
							<Label>Client since</Label>
							<Value>
								{data.clientSince ? (
									data.clientSince.slice(0, 10)
								) : (
									<Muted>—</Muted>
								)}
							</Value>
						</Row>
					</Rows>
				</Card>

				<Card>
					<CardHead>Notes</CardHead>
					{data.notes ? <Notes>{data.notes}</Notes> : <Muted>No notes.</Muted>}
				</Card>

				<CardFull>
					<CardHead>
						<ActivityHeading />
					</CardHead>
					<ActivityTimeline
						events={activity}
						isLoading={activityLoading}
						isError={activityError}
						emptyLabel='No activity recorded for this client yet.'
					/>
				</CardFull>
			</Grid>

			{confirmOpen && (
				<ConfirmBackdrop onClick={() => setConfirmOpen(false)}>
					<ConfirmDialog onClick={(e) => e.stopPropagation()}>
						<h3>Delete this client?</h3>
						<p>
							This cannot be undone. If any projects reference this client, the
							delete will be refused.
						</p>
						<ConfirmActions>
							<GhostBtn onClick={() => setConfirmOpen(false)}>Cancel</GhostBtn>
							<DangerBtn disabled={deleting} onClick={handleDelete}>
								{deleting ? 'Deleting…' : 'Delete'}
							</DangerBtn>
						</ConfirmActions>
					</ConfirmDialog>
				</ConfirmBackdrop>
			)}
		</Shell>
	)
}

const Shell = styled.div`
	padding: 24px 32px;
	max-width: 1180px;
	margin: 0 auto;
	color: ${T.textPrimary};
	@media (max-width: 640px) {
		padding: 16px;
	}
`
const Head = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 12px;
	margin-bottom: 20px;
`
const BackLink = styled(Link)`
	display: inline-flex;
	gap: 6px;
	align-items: center;
	color: ${T.textSecondary};
	text-decoration: none;
	font-size: 13px;
	&:hover {
		color: ${T.textStrong};
	}
`
const Title = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex: 1;
	min-width: 240px;
	h2 {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
		color: ${T.textStrong};
	}
`
const StatusPill = styled.span<{ $status: ApiClientStatus }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	background: ${({ $status }) =>
		$status === 'ACTIVE'
			? 'rgba(34, 197, 94, 0.14)'
			: $status === 'FORMER'
				? 'rgba(100, 116, 139, 0.16)'
				: 'rgba(245, 158, 11, 0.16)'};
	color: ${({ $status }) =>
		$status === 'ACTIVE'
			? '#15803d'
			: $status === 'FORMER'
				? '#334155'
				: '#a26608'};
`
const Actions = styled.div`
	display: inline-flex;
	gap: 10px;
`
const GhostBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.1);
	background: transparent;
	font-size: 13px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	&:hover {
		background: rgba(15, 23, 42, 0.04);
	}
`
const DangerBtn = styled(GhostBtn)`
	color: #b91c1c;
	border-color: rgba(185, 28, 28, 0.3);
	&:hover {
		background: rgba(185, 28, 28, 0.08);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`
const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`
const Card = styled.div`
	padding: 16px;
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`
const CardFull = styled(Card)`
	grid-column: 1 / -1;
`
const CardHead = styled.div`
	font-size: 13px;
	font-weight: 700;
	color: ${T.textStrong};
	margin-bottom: 10px;
	letter-spacing: 0.2px;
`
const Rows = styled.div`
	display: grid;
	gap: 8px;
`
const Row = styled.div`
	display: grid;
	grid-template-columns: 130px 1fr;
	gap: 10px;
	font-size: 13px;
	@media (max-width: 500px) {
		grid-template-columns: 1fr;
		gap: 2px;
	}
`
const Label = styled.span`
	color: ${T.textSecondary};
	font-weight: 500;
`
const Value = styled.span`
	color: ${T.textStrong};
	word-break: break-word;
	a {
		color: ${T.primary};
	}
`
const Muted = styled.span`
	color: ${T.textSecondary};
`
const Notes = styled.p`
	margin: 0;
	white-space: pre-wrap;
	font-size: 13px;
	line-height: 1.5;
	color: ${T.textStrong};
`
const PhoneCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`
const Flag = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 5px;
	background: rgba(15, 23, 42, 0.04);
	font-size: 18px;
	line-height: 1;
`
const ConfirmBackdrop = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.4);
	display: grid;
	place-items: center;
	z-index: 50;
`
const ConfirmDialog = styled.div`
	background: #fff;
	border-radius: 16px;
	padding: 20px;
	min-width: 300px;
	max-width: 420px;
	h3 {
		margin: 0 0 8px;
		font-size: 16px;
		color: ${T.textStrong};
	}
	p {
		margin: 0 0 16px;
		font-size: 13px;
		color: ${T.textSecondary};
	}
`
const ConfirmActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 10px;
`

export default ClientView
