import { memo, useState } from 'react'
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	Typography,
} from '@mui/material'
import {
	AccessTimeOutlined,
	CalendarMonthOutlined,
	CancelOutlined,
	EditCalendarOutlined,
	PhoneInTalkOutlined,
	PublicOutlined,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetClientCallByIdQuery } from '../../../store/clientCalls/clientCallsApi'
import ClientCallDeleteModal from '../../../components/client-call/list/ProposalDeleteModal'
import ClientCallCancelModal from '../../../components/client-call/preview/ClientCallCancelModal'
import { formatDate, formatClientDateTime, formatKyivDateTime } from '../../../utils/formatDate'

const statusColors: Record<string, string> = {
	scheduled: '#2f80ed',
	completed: '#27ae60',
	cancelled: '#eb5757',
}

const CallDetailsPage = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [showCancelModal, setShowCancelModal] = useState(false)

	const { data: call, isLoading } = useGetClientCallByIdQuery(id ?? '', { skip: !id })

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
				<CircularProgress />
			</Box>
		)
	}

	if (!call) {
		return (
			<Box sx={{ px: { xs: 2, md: 10 }, py: 8 }}>
				<Typography>Client call not found.</Typography>
			</Box>
		)
	}

	const clientName = call.lead
		? call.lead.firstName
			? `${call.lead.firstName} ${call.lead.lastName ?? ''}`.trim()
			: call.lead.companyName ?? '—'
		: call.clientRequest?.name ?? '—'

	const statusColor = statusColors[call.status] ?? '#2f80ed'

	return (
		<Box
			sx={{
				minHeight: '100vh',
				background: '#f7f2fb',
				px: { xs: 2, md: 10 },
				py: { xs: 4, md: 8 },
			}}
		>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 5,
					gap: 2,
				}}
			>
				<Box>
					<Typography variant="h3" sx={{ fontWeight: 800, color: '#3d3943' }}>
						Client call details
					</Typography>
				</Box>

				<Chip
					icon={<PhoneInTalkOutlined />}
					label={call.status}
					variant="outlined"
					sx={{
						borderColor: statusColor,
						color: statusColor,
						px: 1,
						fontWeight: 500,
						textTransform: 'capitalize',
						'& .MuiChip-icon': { color: statusColor },
					}}
				/>
			</Box>

			<Card sx={{ borderRadius: 4, boxShadow: '0 12px 35px rgba(39, 36, 45, 0.06)' }}>
				<CardContent sx={{ p: 4 }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							gap: 3,
							flexWrap: 'wrap',
							mb: 4,
						}}
					>
						<Box>
							<Typography variant="h5" sx={{ fontWeight: 800 }}>
								{call.callTitle}
							</Typography>

							<Typography sx={{ color: '#625c68', mt: 1 }}>
								{clientName} · {call.clientType === 'lead' ? 'Lead' : 'Client Request'}
							</Typography>
						</Box>

						<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
							{call.status === 'scheduled' && (
								<>
									<Button
										variant="outlined"
										startIcon={<EditCalendarOutlined />}
										sx={{ height: 46, borderRadius: '14px' }}
										onClick={() => navigate(`/client-calls/edit/${id}`)}
									>
										Reschedule call
									</Button>

									<Button
										variant="outlined"
										color="error"
										startIcon={<CancelOutlined />}
										sx={{ height: 46, borderRadius: '14px' }}
										onClick={() => setShowCancelModal(true)}
									>
										Cancel call
									</Button>
								</>
							)}

							<Button
								variant="outlined"
								color="error"
								startIcon={<CancelOutlined />}
								sx={{ height: 46, borderRadius: '14px' }}
								onClick={() => setShowDeleteModal(true)}
							>
								Delete
							</Button>
						</Box>
					</Box>

					<Divider sx={{ mb: 4 }} />

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
							gap: 3,
						}}
					>
						<Box
							sx={{
								p: 2.5,
								borderRadius: '16px',
								background: '#eef6ff',
								border: '2px solid #2f80ed',
								display: 'grid',
								gap: 1.5,
							}}
						>
							<Typography sx={{ fontSize: 14, fontWeight: 800, color: '#2f80ed' }}>
								Time conversion
							</Typography>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<AccessTimeOutlined fontSize="small" sx={{ color: '#2f80ed' }} />
								<Typography>
									Client:{' '}
									<Box component="span" sx={{ fontWeight: 800 }}>
										{formatClientDateTime(call.clientDateTime)} · {call.clientTimezone}
									</Box>
								</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<AccessTimeOutlined fontSize="small" sx={{ color: '#2f80ed' }} />
								<Typography>
									You:{' '}
									<Box component="span" sx={{ fontWeight: 800 }}>
										{formatKyivDateTime(call.kyivDateTime)} · Kyiv
									</Box>
								</Typography>
							</Box>
						</Box>

						<Box sx={{ display: 'grid', gap: 2 }}>
							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<CalendarMonthOutlined fontSize="small" />
								<Typography>Created: {formatDate(call.createdAt)}</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<PublicOutlined fontSize="small" />
								<Typography>Duration: {call.duration} minutes</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<PhoneInTalkOutlined fontSize="small" />
								<Typography>
									Source: {call.clientType === 'lead' ? 'Lead' : 'Client Request'}
								</Typography>
							</Box>
						</Box>
					</Box>
				</CardContent>
			</Card>

			{showDeleteModal && (
				<ClientCallDeleteModal
					id={call.id}
					title={call.callTitle}
					onClose={() => setShowDeleteModal(false)}
					onSuccess={() => navigate('/client-calls/list/')}
				/>
			)}

			{showCancelModal && (
				<ClientCallCancelModal
					id={call.id}
					title={call.callTitle}
					onClose={() => setShowCancelModal(false)}
					onSuccess={() => {}}
				/>
			)}
		</Box>
	)
}

export default memo(CallDetailsPage)
