import { useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	ContactSupportOutlined,
	DescriptionOutlined,
	FileDownloadOutlined,
	ImageOutlined,
	InsertDriveFileOutlined,
	PhoneInTalkOutlined,
	PictureAsPdfOutlined,
	ScheduleRounded,
	TableChartOutlined,
	VisibilityOutlined,
	WarningAmberRounded,
} from '@mui/icons-material'

import { T } from '../../../components/sales-analytics/_shared/tokens'
import ListPageShell from '../../../components/_shared/ListPageShell/ListPageShell'
import {
	useGetClientRequestByIdQuery,
	useGetClientRequestFilesQuery,
} from '../../../store/clientRequests/clientRequestsApi'
import type {
	ClientRequestSignedFile,
	ClientRequestStatus,
} from '../../../store/clientRequests/types/definition'

const STATUS_LABEL: Record<ClientRequestStatus, string> = {
	on_review: 'on review',
	conversation_ongoing: 'conversation',
	archived: 'archived',
}

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40) || 'request'

const formatSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileIcon = (mimetype: string, size = 20) => {
	const sx = { fontSize: size }
	if (mimetype === 'application/pdf') return <PictureAsPdfOutlined sx={sx} />
	if (mimetype.startsWith('image/')) return <ImageOutlined sx={sx} />
	if (mimetype.includes('word')) return <DescriptionOutlined sx={sx} />
	if (mimetype.includes('sheet') || mimetype.includes('excel'))
		return <TableChartOutlined sx={sx} />
	return <InsertDriveFileOutlined sx={sx} />
}

const downloadFile = (url: string, name: string) => {
	const a = document.createElement('a')
	a.href = url
	a.download = name
	document.body.appendChild(a)
	a.click()
	a.remove()
}

const ClientRequestPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()

	const {
		data: request,
		isLoading,
		isError,
	} = useGetClientRequestByIdQuery(id ?? '', { skip: !id })

	const hasFiles = (request?.files?.length ?? 0) > 0
	const { data: signedFiles, isLoading: isLoadingFiles } = useGetClientRequestFilesQuery(
		id ?? '',
		{
			skip: !id || !hasFiles,
			refetchOnMountOrArgChange: 3540,
		}
	)

	if (!id) {
		return (
			<Shell>
				<ErrorBox onBack={() => navigate(-1)} message='Missing request id' />
			</Shell>
		)
	}
	if (isLoading && !request) {
		return (
			<Shell>
				<Terminal>
					<TermHeader>
						<TermDots>
							<span className='r' />
							<span className='y' />
							<span className='g' />
						</TermDots>
						<TermPath>loading…</TermPath>
					</TermHeader>
					<Loading>fetching client request…</Loading>
				</Terminal>
			</Shell>
		)
	}
	if (isError || !request) {
		return (
			<Shell>
				<ErrorBox
					onBack={() => navigate('/client-requests/list/')}
					message='Client request not found'
				/>
			</Shell>
		)
	}

	const createdDate = new Date(request.createdAt)
	const updatedDate = new Date(request.updatedAt)
	const createdStr = createdDate.toLocaleString('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
	const updatedStr = updatedDate.toLocaleString('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
	const sameTs = request.createdAt === request.updatedAt
	const phoneLine =
		request.phone && request.phoneCountry
			? `+${request.phoneCountry.toUpperCase()} ${request.phone}`
			: request.phone || ''

	const termPath = `crm@sargas:~/client-requests/${STATUS_LABEL[request.status].replace(
		/\s+/g,
		'-'
	)}/${slugify(request.name || 'request')}`

	return (
		<Shell>
			<Terminal>
				<TermHeader>
					<TermDots>
						<span
							className='r'
							role='button'
							aria-label='Close'
							onClick={() => navigate(-1)}
						/>
						<span className='y' />
						<span className='g' />
					</TermDots>
					<TermPath>{termPath}</TermPath>
					<TermHeaderActions>
						<BookCallBtn
							type='button'
							onClick={() =>
								navigate(
									`/client-calls/add/?clientType=client_request&clientId=${request.id}`
								)
							}
						>
							<BookCallIcon aria-hidden='true'>
								<PhoneInTalkOutlined />
							</BookCallIcon>
							Book a call
						</BookCallBtn>
					</TermHeaderActions>
				</TermHeader>

				<TermBody>
					<TermPromptLine>
						<TermPrompt>$</TermPrompt> cat request --id {request.id.slice(0, 8)}
					</TermPromptLine>

					<HeroRow>
						<HeroIcon>
							<ContactSupportOutlined />
						</HeroIcon>
						<HeroText>
							<Hero>{request.name || 'Anonymous'}</Hero>
							<HeroMeta>
								<ScheduleRounded style={{ fontSize: 13 }} />
								<span>received {createdStr}</span>
								{request.company && (
									<>
										<Sep>·</Sep>
										<span>{request.company}</span>
									</>
								)}
							</HeroMeta>
						</HeroText>
					</HeroRow>

					<KeyLines>
						<KV label='name'>
							<KvMono>{request.name || '—'}</KvMono>
						</KV>
						<KV label='company'>
							<KvMono>{request.company || '—'}</KvMono>
						</KV>
						<KV label='email'>
							{request.email ? (
								<KvLink href={`mailto:${request.email}`}>{request.email}</KvLink>
							) : (
								<KvMono>—</KvMono>
							)}
						</KV>
						<KV label='phone'>
							{phoneLine ? (
								<KvLink href={`tel:${phoneLine.replace(/\s+/g, '')}`}>{phoneLine}</KvLink>
							) : (
								<KvMono>—</KvMono>
							)}
						</KV>
						<KV label='services'>
							{request.services?.length ? (
								<ChipRow>
									{request.services.map((s) => (
										<ServiceChip key={s}>{s}</ServiceChip>
									))}
								</ChipRow>
							) : (
								<KvMono>—</KvMono>
							)}
						</KV>
						<KV label='status'>
							<StatusTag $status={request.status}>{STATUS_LABEL[request.status]}</StatusTag>
						</KV>
						<KV label='received'>
							<KvMono>{createdStr}</KvMono>
						</KV>
						{!sameTs && (
							<KV label='updated'>
								<KvMono>{updatedStr}</KvMono>
							</KV>
						)}
						<KV label='id'>
							<KvMono>{request.id}</KvMono>
						</KV>
					</KeyLines>

					<Divider />
					<TermPromptLine>
						<TermPrompt>$</TermPrompt> cat message.txt
					</TermPromptLine>
					<RawBlock>
						<pre>{request.message?.trim() || '(empty — no message provided)'}</pre>
					</RawBlock>

					{hasFiles && (
						<>
							<Divider />
							<TermPromptLine>
								<TermPrompt>$</TermPrompt> ls files/{' '}
								<CountInline>{request.files.length}</CountInline>
							</TermPromptLine>
							{isLoadingFiles ? (
								<FilesLoading>fetching signed URLs…</FilesLoading>
							) : (
								<FileList>
									{(signedFiles ?? ([] as ClientRequestSignedFile[])).map((file) => (
										<FileRow key={file.originalName}>
											<FileIconBox>{fileIcon(file.mimetype)}</FileIconBox>
											<FileInfo>
												<FileName>{file.originalName}</FileName>
												<FileMeta>
													{file.mimetype}
													<Sep>·</Sep>
													{formatSize(file.size)}
												</FileMeta>
											</FileInfo>
											<FileActions>
												<FileIconBtn
													type='button'
													onClick={() =>
														window.open(file.url, '_blank', 'noopener,noreferrer')
													}
													aria-label='View file'
													title='View'
												>
													<VisibilityOutlined style={{ fontSize: 16 }} />
												</FileIconBtn>
												<FileIconBtn
													type='button'
													onClick={() => downloadFile(file.url, file.originalName)}
													aria-label='Download file'
													title='Download'
												>
													<FileDownloadOutlined style={{ fontSize: 16 }} />
												</FileIconBtn>
											</FileActions>
										</FileRow>
									))}
								</FileList>
							)}
						</>
					)}
				</TermBody>

				<TermFooter>
					request · {createdStr} · {request.id}
					<TermCursor />
				</TermFooter>
			</Terminal>
		</Shell>
	)
}

export default ClientRequestPreview

/* ─── Reusable row ─────────────────────────────────────────────── */

const KV = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<KvRow>
		<KvArrow>→</KvArrow>
		<KvLabel>{label}</KvLabel>
		<KvValue>{children}</KvValue>
	</KvRow>
)

/* ─── Shell wrapper that keeps the standard ListPageShell nav ───── */

const Shell = ({ children }: { children: React.ReactNode }) => {
	const navigate = useNavigate()
	return (
		<ListPageShell
			crumbs={[
				{ label: 'Pipeline' },
				{ label: 'Client requests', href: '/client-requests/list/' },
				{ label: 'Preview', current: true },
			]}
			icon={<ContactSupportOutlined />}
			title='Client request'
			subtitle='Inbound inquiry from the public contact form — contact, services, message, files.'
			action={
				<BackBtn type='button' onClick={() => navigate(-1)}>
					<ArrowBackRounded style={{ fontSize: 16 }} />
					Back
				</BackBtn>
			}
		>
			{children}
		</ListPageShell>
	)
}

const ErrorBox = ({ onBack, message }: { onBack: () => void; message: string }) => (
	<Terminal>
		<TermHeader>
			<TermDots>
				<span className='r' />
				<span className='y' />
				<span className='g' />
			</TermDots>
			<TermPath>crm@sargas:~/client-requests/error</TermPath>
		</TermHeader>
		<Loading>
			<WarningAmberRounded style={{ fontSize: 16, marginRight: 6 }} />
			{message}
		</Loading>
		<TermFooter>
			<BackBtn type='button' onClick={onBack}>
				<ArrowBackRounded style={{ fontSize: 16 }} />
				Back
			</BackBtn>
		</TermFooter>
	</Terminal>
)

/* ─── Styles (mirror of PromptPreview / AuditEventPage) ────────── */

const terminalIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to   { opacity: 1; transform: translateY(0); }
`

const rowIn = keyframes`
	from { opacity: 0; transform: translateX(-6px); }
	to   { opacity: 1; transform: translateX(0); }
`

const cursorBlink = keyframes`
	0%, 50% { opacity: 1; }
	51%, 100% { opacity: 0; }
`

const Terminal = styled.div`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 14px;
	padding: 16px 22px 14px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.03),
		0 8px 24px rgba(15, 23, 42, 0.04);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	animation: ${terminalIn} 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const TermHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 14px;
	padding-bottom: 12px;
	border-bottom: 1px dashed rgba(15, 23, 42, 0.08);
	flex-wrap: wrap;
`

const TermDots = styled.div`
	display: inline-flex;
	gap: 6px;
	flex-shrink: 0;

	span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.r {
		background: #f87171;
		cursor: pointer;
		transition: filter 140ms ease;
	}
	.r:hover {
		filter: brightness(0.9);
	}
	.y {
		background: #fbbf24;
	}
	.g {
		background: #4ade80;
	}
`

const TermPath = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${T.textMuted};
	letter-spacing: 0.2px;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const TermHeaderActions = styled.div`
	margin-left: auto;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-shrink: 0;
`

const phoneShake = keyframes`
	0%, 100% { transform: rotate(0deg); }
	20% { transform: rotate(-14deg); }
	40% { transform: rotate(12deg); }
	60% { transform: rotate(-8deg); }
	80% { transform: rotate(6deg); }
`

const BookCallBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 11px 18px;
	border: 0;
	border-radius: 12px;
	background: ${T.primary};
	color: #ffffff;
	font-family: inherit;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.01em;
	cursor: pointer;
	box-shadow: none;
	transition: transform 120ms cubic-bezier(0.4, 0, 0.2, 1);

	svg {
		font-size: 18px;
	}

	&:hover:not(:disabled) {
		transform: translateY(-1px);
	}
	&:active:not(:disabled) {
		transform: translateY(0);
	}
`

const BookCallIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transform-origin: center;

	${BookCallBtn}:hover:not(:disabled) & svg {
		animation: ${phoneShake} 650ms cubic-bezier(0.22, 1, 0.36, 1) 1;
	}

	@media (prefers-reduced-motion: reduce) {
		${BookCallBtn}:hover:not(:disabled) & svg {
			animation: none;
		}
	}
`

const TermBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const TermPromptLine = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const TermPrompt = styled.span`
	color: ${T.primary};
	font-weight: 700;
`

const CountInline = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 20px;
	padding: 0 7px;
	height: 20px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.1);
	color: ${T.primary};
	font-size: 11px;
	font-weight: 700;
`

/* ─── Hero ──────────────────────────────────────────────────── */

const HeroRow = styled.div`
	display: grid;
	grid-template-columns: 44px 1fr;
	gap: 14px;
	align-items: flex-start;
`

const HeroIcon = styled.div`
	width: 44px;
	height: 44px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: rgba(3, 105, 161, 0.1);
	color: ${T.primary};

	svg {
		font-size: 22px;
	}
`

const HeroText = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 5px;
`

const Hero = styled.h2`
	margin: 0;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 18.5px;
	font-weight: 700;
	color: ${T.textStrong};
	line-height: 1.35;
	letter-spacing: -0.1px;
	word-break: break-word;
`

const HeroMeta = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${T.textMuted};
	flex-wrap: wrap;

	svg {
		color: ${T.textMuted};
	}
`

const Sep = styled.span`
	opacity: 0.5;
`

/* ─── Key-value lines ───────────────────────────────────────── */

const KeyLines = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const KvRow = styled.div`
	display: grid;
	grid-template-columns: 14px 110px 1fr;
	gap: 10px;
	padding: 6px 0;
	align-items: center;
	border-bottom: 1px solid rgba(15, 23, 42, 0.04);
	transition: background 160ms;
	animation: ${rowIn} 300ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:nth-child(1) {
		animation-delay: 60ms;
	}
	&:nth-child(2) {
		animation-delay: 110ms;
	}
	&:nth-child(3) {
		animation-delay: 160ms;
	}
	&:nth-child(4) {
		animation-delay: 210ms;
	}
	&:nth-child(5) {
		animation-delay: 260ms;
	}
	&:nth-child(6) {
		animation-delay: 310ms;
	}
	&:nth-child(7) {
		animation-delay: 360ms;
	}
	&:nth-child(8) {
		animation-delay: 410ms;
	}
	&:nth-child(9) {
		animation-delay: 460ms;
	}

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: rgba(3, 105, 161, 0.03);
		border-radius: 6px;
		padding-left: 6px;
		padding-right: 6px;
		margin-left: -6px;
		margin-right: -6px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const KvArrow = styled.span`
	color: ${T.primary};
	font-weight: 700;
	font-size: 14px;
`

const KvLabel = styled.span`
	color: ${T.textMuted};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	letter-spacing: 0.4px;
`

const KvValue = styled.span`
	min-width: 0;
	font-size: 13.5px;
	color: ${T.textStrong};
	word-break: break-word;
`

const KvMono = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	color: ${T.textStrong};
	word-break: break-all;
`

const KvLink = styled.a`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	font-weight: 600;
	color: ${T.primary};
	text-decoration: none;
	word-break: break-all;

	&:hover {
		text-decoration: underline;
	}
`

const ChipRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const ServiceChip = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 600;
	letter-spacing: 0.2px;
`

const StatusTag = styled.span<{ $status: ClientRequestStatus }>`
	display: inline-flex;
	padding: 3px 11px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	color: ${(p) =>
		p.$status === 'on_review'
			? '#a26608'
			: p.$status === 'conversation_ongoing'
				? '#0369a1'
				: T.textMuted};
	background: ${(p) =>
		p.$status === 'on_review'
			? 'rgba(245, 158, 11, 0.14)'
			: p.$status === 'conversation_ongoing'
				? 'rgba(3, 105, 161, 0.12)'
				: 'rgba(15, 23, 42, 0.05)'};
`

/* ─── Divider / message / files ─────────────────────────────── */

const Divider = styled.div`
	border-top: 1px dashed rgba(15, 23, 42, 0.08);
	margin: 6px 0;
`

const RawBlock = styled.div`
	padding: 14px 16px;
	border-radius: 10px;
	background: #0f172a;
	color: #e2e8f0;
	overflow-x: auto;

	pre {
		margin: 0;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12.5px;
		line-height: 1.65;
		white-space: pre-wrap;
		word-break: break-word;
	}
`

const FileList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const FileRow = styled.div`
	display: grid;
	grid-template-columns: 32px 1fr auto;
	gap: 12px;
	align-items: center;
	padding: 10px 12px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.06);
	background: #fafbfc;
	transition:
		border-color 160ms ease,
		background 160ms ease;

	&:hover {
		border-color: rgba(3, 105, 161, 0.3);
		background: #ffffff;
	}
`

const FileIconBox = styled.span`
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	display: inline-flex;
	align-items: center;
	justify-content: center;
`

const FileInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const FileName = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	font-weight: 600;
	color: ${T.textStrong};
	word-break: break-all;
`

const FileMeta = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: ${T.textMuted};
	display: inline-flex;
	align-items: center;
	gap: 6px;
`

const FileActions = styled.div`
	display: inline-flex;
	gap: 4px;
`

const FileIconBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border-radius: 8px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	background: #ffffff;
	color: ${T.textSecondary};
	cursor: pointer;
	transition:
		border-color 160ms ease,
		color 160ms ease,
		background 160ms ease;

	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
		background: rgba(3, 105, 161, 0.04);
	}
`

const FilesLoading = styled.div`
	padding: 8px 0;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	color: ${T.textSecondary};
`

/* ─── Footer ─────────────────────────────────────────────────── */

const TermFooter = styled.div`
	margin-top: 14px;
	padding-top: 10px;
	border-top: 1px dashed rgba(15, 23, 42, 0.08);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${T.textMuted};
	display: inline-flex;
	align-items: center;
	gap: 4px;
`

const TermCursor = styled.span`
	display: inline-block;
	width: 7px;
	height: 11px;
	background: ${T.primary};
	margin-left: 6px;
	vertical-align: middle;
	animation: ${cursorBlink} 1s steps(2) infinite;
`

const Loading = styled.div`
	padding: 18px 0;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13.5px;
	color: ${T.textSecondary};
	display: inline-flex;
	align-items: center;
`

const BackBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 14px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: ${T.textStrong};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition:
		border-color 180ms ease,
		color 180ms ease;

	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`
