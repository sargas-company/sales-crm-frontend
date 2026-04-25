import { memo } from 'react'
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
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
import {useNavigate} from "react-router-dom";
import ProposalDeleteModal from "../../../components/proposal/list/ProposalDeleteModal";

const CallDetailsPage = () => {
	const navigate = useNavigate()

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
					label="Scheduled"
					variant="outlined"
					sx={{
						borderColor: '#2f80ed',
						color: '#2f80ed',
						px: 1,
						fontWeight: 500,
						'& .MuiChip-icon': {
							color: '#2f80ed',
						},
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
								Discovery call
							</Typography>

							<Typography sx={{ color: '#625c68', mt: 1 }}>
								John Smith · Lead
							</Typography>
						</Box>

						<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
							<Button
								variant="outlined"
								startIcon={<EditCalendarOutlined />}
								sx={{ height: 46, borderRadius: '14px' }}
								onClick={() => navigate('/client-calls/edit/1')}
							>
								Reschedule call
							</Button>

							<Button
								variant="outlined"
								color="error"
								startIcon={<CancelOutlined />}
								sx={{ height: 46, borderRadius: '14px' }}
							>
								Cancel call
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
										17 Apr 2026 - 01:00 EST
									</Box>
								</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<AccessTimeOutlined fontSize="small" sx={{ color: '#2f80ed' }} />
								<Typography>
									You:{' '}
									<Box component="span" sx={{ fontWeight: 800 }}>
										17 Apr 2026 - 08:00 Kyiv
									</Box>
								</Typography>
							</Box>
						</Box>

						<Box sx={{ display: 'grid', gap: 2 }}>
							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<CalendarMonthOutlined fontSize="small" />
								<Typography>Created: 15 Apr 2026</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<PublicOutlined fontSize="small" />
								<Typography>Duration: 30 minutes</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<PhoneInTalkOutlined fontSize="small" />
								<Typography>Call type: Upwork call</Typography>
							</Box>
						</Box>
					</Box>
				</CardContent>
			</Card>
		</Box>
	)
}

export default memo(CallDetailsPage)