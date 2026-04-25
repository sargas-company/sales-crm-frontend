import { memo, useMemo, useState } from 'react'
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from '@mui/material'
import {
	AccessTimeOutlined,
	CalendarMonthOutlined,
	ContactPhoneOutlined,
	PhoneInTalkOutlined,
	PublicOutlined,
	WorkOutlineOutlined,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {useNavigate} from "react-router-dom";

dayjs.extend(utc)
dayjs.extend(timezone)

type ClientType = 'lead' | 'client_request'

type TimezoneOption = {
	label: string
	value: string
	timezone?: string
	offset?: string
}

const timezones: TimezoneOption[] = [
	{ label: 'EST - Eastern Standard Time', value: 'EST', timezone: 'America/New_York' },
	{ label: 'EDT - Eastern Daylight Time', value: 'EDT', timezone: 'America/New_York' },

	{ label: 'CST - Central Standard Time', value: 'CST', timezone: 'America/Chicago' },
	{ label: 'CDT - Central Daylight Time', value: 'CDT', timezone: 'America/Chicago' },

	{ label: 'MST - Mountain Standard Time', value: 'MST', timezone: 'America/Denver' },
	{ label: 'MDT - Mountain Daylight Time', value: 'MDT', timezone: 'America/Denver' },

	{ label: 'PST - Pacific Standard Time', value: 'PST', timezone: 'America/Los_Angeles' },
	{ label: 'PDT - Pacific Daylight Time', value: 'PDT', timezone: 'America/Los_Angeles' },

	{ label: 'GMT - Greenwich Mean Time', value: 'GMT', offset: '+00:00' },

	...Array.from({ length: 27 }, (_, index) => {
		const hour = index - 12
		const sign = hour >= 0 ? '+' : '-'
		const absHour = Math.abs(hour)

		return {
			label: `GMT${sign}${absHour}`,
			value: `GMT${sign}${absHour}`,
			offset: `${sign}${String(absHour).padStart(2, '0')}:00`,
		}
	}),
]

const clients = [
	{ id: 1, name: 'John Smith', type: 'lead' },
	{ id: 2, name: 'Michael Brown', type: 'lead' },
	{ id: 3, name: 'Upwork SaaS MVP', type: 'client_request' },
	{ id: 4, name: 'CRM Automation Request', type: 'client_request' },
]

const fieldSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '14px',
	},
}

const CreateCallPage = () => {
	const [submitAttempted, setSubmitAttempted] = useState(false)
	const [clientType, setClientType] = useState<ClientType>('lead')
	const [selectedClientId, setSelectedClientId] = useState<number | null>(1)
	const [callTitle, setCallTitle] = useState('Discovery call')
	const [date, setDate] = useState('')
	const [time, setTime] = useState('')
	const [duration, setDuration] = useState('30')
	const [clientTimezone, setClientTimezone] = useState('EST')

	const selectedTimezone = timezones.find((tz) => tz.value === clientTimezone)
	const filteredClients = clients.filter((client) => client.type === clientType)
	const selectedClient = clients.find((client) => client.id === selectedClientId)

	const navigate = useNavigate()
	const handleClientTypeChange = (type: ClientType) => {
		setClientType(type)

		const firstClient = clients.find((client) => client.type === type)
		setSelectedClientId(firstClient?.id || null)
	}

	const isRescheduleMode = true

	const clientDateTime = useMemo(() => {
		if (!date || !time || !selectedTimezone) return null

		if (selectedTimezone.timezone) {
			return dayjs.tz(
				`${date} ${time}`,
				'YYYY-MM-DD HH:mm',
				selectedTimezone.timezone
			)
		}

		if (selectedTimezone.offset) {
			return dayjs(`${date}T${time}${selectedTimezone.offset}`)
		}

		return null
	}, [date, time, selectedTimezone])

	const kyivDateTime = useMemo(() => {
		if (!clientDateTime) return null

		return clientDateTime.tz('Europe/Kyiv')
	}, [clientDateTime])

	const minAllowedDateTime = dayjs().add(30, 'minute')

	const errors = {
		selectedClientId: !selectedClientId,
		callTitle: !callTitle.trim(),
		date: !date,
		time: !time || (clientDateTime ? clientDateTime.isBefore(minAllowedDateTime) : false),
		clientTimezone: !clientTimezone,
		duration: !duration,
	}

	const hasErrors = Object.values(errors).some(Boolean)

	const handleEditCall = () => {
		setSubmitAttempted(true)

		if (hasErrors) return

		navigate('/client-calls/preview/1')
	}

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
						Reschedule client call
					</Typography>
				</Box>

				<Chip
					icon={<PhoneInTalkOutlined />}
					label="Select source"
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

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', lg: '2.2fr 1fr' },
					gap: 3,
				}}
			>
				<Card sx={{ borderRadius: 4, boxShadow: '0 12px 35px rgba(39, 36, 45, 0.06)' }}>
					<CardContent sx={{ p: 4 }}>
						<Typography sx={{ fontWeight: 700, mb: 2 }}>Client type</Typography>

						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
								gap: 2,
								mb: 3,
							}}
						>
							<Button
								disabled={isRescheduleMode}
								variant={clientType === 'lead' ? 'contained' : 'outlined'}
								startIcon={<ContactPhoneOutlined />}
								onClick={() => handleClientTypeChange('lead')}
								sx={{
									height: 56,
									borderRadius: '14px',
									justifyContent: 'flex-start',
									px: 3,
								}}
							>
								Leads
							</Button>

							<Button
								disabled={isRescheduleMode}
								variant={clientType === 'client_request' ? 'contained' : 'outlined'}
								startIcon={<WorkOutlineOutlined />}
								onClick={() => handleClientTypeChange('client_request')}
								sx={{
									height: 56,
									borderRadius: '14px',
									justifyContent: 'flex-start',
									px: 3,
								}}
							>
								Client Requests
							</Button>
						</Box>

						<Box sx={{ display: 'grid', gap: 3 }}>
							<FormControl fullWidth sx={fieldSx}>
								<InputLabel>Select client</InputLabel>
								<Select
									disabled={isRescheduleMode}
									value={selectedClientId || ''}
									label="Select client"
									onChange={(e) => setSelectedClientId(Number(e.target.value))}
								>
									{filteredClients.map((client) => (
										<MenuItem key={client.id} value={client.id}>
											{client.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							<TextField
								label="Call title"
								value={callTitle}
								onChange={(e) => setCallTitle(e.target.value)}
								error={submitAttempted && errors.callTitle}
								helperText={submitAttempted && errors.callTitle ? 'Call title is required' : ''}
								fullWidth
								sx={fieldSx}
							/>

							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
									gap: 2,
								}}
							>
								<TextField
									label="Date"
									type="date"
									value={date}
									onChange={(e) => {
										setDate(e.target.value)
										setTime('')
									}}
									error={submitAttempted && errors.date}
									helperText={submitAttempted && errors.date ? 'Date is required' : ''}
									slotProps={{
										inputLabel: {
											shrink: true,
										},
										htmlInput: {
											min: dayjs().format('YYYY-MM-DD'),
										},
									}}
									fullWidth
									sx={fieldSx}
								/>

								<LocalizationProvider dateAdapter={AdapterDayjs}>
									<TimePicker
										label="Proposed time"
										value={time ? dayjs(`${date}T${time}`) : null}
										disabled={!date}
										onChange={(newValue) => {
											if (!newValue) {
												setTime('')
												return
											}

											setTime(newValue.format('HH:mm'))
										}}
										minutesStep={5}
										slotProps={{
											textField: {
												fullWidth: true,
												error: submitAttempted && errors.time,
												helperText: submitAttempted && errors.time
													? 'Call time must be at least 30 minutes from now'
													: !date
														? 'Select date first'
														: '',
												sx: {
													...fieldSx,
													'& .MuiOutlinedInput-root.Mui-disabled': {
														borderRadius: '14px',
														backgroundColor: '#f3f3f3',
													},
												},
											},
										}}
									/>
								</LocalizationProvider>
							</Box>

							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
									gap: 2,
								}}
							>
								<FormControl fullWidth sx={fieldSx} error={submitAttempted && errors.clientTimezone}>
									<InputLabel>Client timezone</InputLabel>
									<Select
										value={clientTimezone}
										label="Client timezone"
										onChange={(e) => setClientTimezone(e.target.value)}
									>
										{timezones.map((tz) => (
											<MenuItem key={tz.value} value={tz.value}>
												{tz.label}
											</MenuItem>
										))}
									</Select>
								</FormControl>

								<FormControl fullWidth sx={fieldSx} error={submitAttempted && errors.duration}>
									<InputLabel>Duration</InputLabel>
									<Select
										value={duration}
										label="Duration"
										onChange={(e) => setDuration(e.target.value)}
									>
										<MenuItem value="30">30 minutes</MenuItem>
										<MenuItem value="45">45 minutes</MenuItem>
										<MenuItem value="60">60 minutes</MenuItem>
									</Select>
								</FormControl>
							</Box>

							<Button
								variant="contained"
								size="large"
								sx={{
									mt: 2,
									height: 54,
									borderRadius: '14px',
									textTransform: 'uppercase',
									background: '#2278d8',
									boxShadow: '0 4px 10px rgba(34, 120, 216, 0.35)',
								}}
								onClick={handleEditCall}
							>
								Reschedule call
							</Button>
						</Box>
					</CardContent>
				</Card>

				<Card sx={{ borderRadius: 4, boxShadow: '0 12px 35px rgba(39, 36, 45, 0.06)' }}>
					<CardContent sx={{ p: 4 }}>
						<Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>
							Preview
						</Typography>

						<Box sx={{ display: 'grid', gap: 3 }}>
							<Box>
								<Typography sx={{ fontSize: 14, color: '#3f3a44' }}>
									Selected source
								</Typography>
								<Typography sx={{ fontSize: 18 }}>
									{clientType === 'lead' ? 'Lead' : 'Client Request'}
								</Typography>
							</Box>

							<Box>
								<Typography sx={{ fontSize: 14, color: '#3f3a44' }}>
									Selected client
								</Typography>
								<Typography sx={{ fontSize: 18 }}>{selectedClient?.name || '—'}</Typography>
							</Box>

							<Box>
								<Typography sx={{ fontSize: 14, color: '#3f3a44' }}>
									Call title
								</Typography>
								<Typography sx={{ fontSize: 18 }}>{callTitle || '—'}</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<CalendarMonthOutlined fontSize="small" />
								<Typography>{date || 'No date selected'}</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<PublicOutlined fontSize="small" />
								<Typography>{duration} minutes</Typography>
							</Box>

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
											{clientDateTime
												? `${clientDateTime.format('DD MMM YYYY - HH:mm')} ${selectedTimezone?.value}`
												: 'N/A'}
										</Box>
									</Typography>
								</Box>

								<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
									<AccessTimeOutlined fontSize="small" sx={{ color: '#2f80ed' }} />
									<Typography>
										You:{' '}
										<Box component="span" sx={{ fontWeight: 800 }}>
											{kyivDateTime
												? `${kyivDateTime.format('DD MMM YYYY - HH:mm')} Kyiv`
												: 'N/A'}
										</Box>
									</Typography>
								</Box>
							</Box>

							<Button
								variant="outlined"
								sx={{ height: 46, borderRadius: '14px' }}
								onClick={() => {
									setCallTitle('Discovery call')
									setDate('')
									setTime('')
									setDuration('30')
									setClientTimezone('EST')
								}}
							>
								Reset
							</Button>
						</Box>
					</CardContent>
				</Card>
			</Box>
		</Box>
	)
}

export default memo(CreateCallPage)