import { memo, useMemo, useState } from 'react'
import {
	Box,
	CircularProgress,
	MenuItem,
	Select,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
} from '@mui/material'
import {
	AccessTimeOutlined,
	ArrowBackRounded,
	ArrowForwardRounded,
	CalendarMonthOutlined,
	CheckRounded,
	ContactPhoneOutlined,
	HourglassEmptyOutlined,
	PhoneInTalkOutlined,
	PublicOutlined,
	RestartAltOutlined,
	WorkOutlineOutlined,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { muiSargasTheme } from '../../../components/_shared/muiSargasTheme'
import { useGetLeadListQuery } from '../../../store/leads/leadsApi'
import { useGetClientRequestListQuery } from '../../../store/clientRequests/clientRequestsApi'
import { useGetClientsQuery } from '../../../store/clients/clientsApi'
import { useCreateClientCallMutation } from '../../../store/clientCalls/clientCallsApi'
import { useToast } from '../../../context/toast/ToastContext'
import { timezones } from '../../../utils/timezones'

dayjs.extend(utc)
dayjs.extend(timezone)

type ClientType = 'lead' | 'client' | 'client_request'

const INK = '#0f172a'
const INK_60 = 'rgba(15, 23, 42, 0.6)'
const INK_45 = 'rgba(15, 23, 42, 0.45)'
const INK_10 = 'rgba(15, 23, 42, 0.08)'
const INK_04 = 'rgba(15, 23, 42, 0.04)'
const PRIMARY = 'rgb(3, 105, 161)'
const PRIMARY_HOVER = 'rgb(2, 124, 192)'
const PRIMARY_TINT = '#f0f9ff'
const PRIMARY_TINT_STRONG = '#e0f2fe'

const fieldSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '12px',
		background: '#fff',
		fontSize: 14.5,
		'& fieldset': { borderColor: INK_10, borderWidth: 1.5 },
		'&:hover fieldset': { borderColor: 'rgba(15, 23, 42, 0.22)' },
		'&.Mui-focused': {
			boxShadow: `0 0 0 4px ${PRIMARY}22`,
		},
		'&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 1.5 },
		'&.Mui-disabled': { background: INK_04 },
	},
	'& .MuiOutlinedInput-input': {
		py: '13px',
		fontWeight: 500,
		color: INK,
		'&::placeholder': { color: INK_45, opacity: 1 },
	},
	'& .MuiInputLabel-root': {
		color: INK_45,
		fontWeight: 500,
	},
	'& .MuiInputLabel-root.Mui-focused': { color: PRIMARY },
}

const clientInitials = (name: string) => {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return '?'
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
	return (parts[0][0] + parts[1][0]).toUpperCase()
}

const CreateCallPage = () => {
	const [searchParams] = useSearchParams()
	const initialClientType = (searchParams.get('clientType') as ClientType | null) ?? 'lead'
	const initialClientId = searchParams.get('clientId') ?? ''

	const defaultDateTime = useMemo(() => dayjs().add(1, 'hour'), [])
	const [submitAttempted, setSubmitAttempted] = useState(false)
	const [clientType, setClientType] = useState<ClientType>(initialClientType)
	const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId)
	const [callTitle, setCallTitle] = useState('Discovery call')
	const [date, setDate] = useState(defaultDateTime.format('YYYY-MM-DD'))
	const [time, setTime] = useState(defaultDateTime.format('HH:mm'))
	const [duration, setDuration] = useState('30')
	const [clientTimezone, setClientTimezone] = useState('EST')

	const navigate = useNavigate()
	const { showToast } = useToast()

	const { data: leadsData, isLoading: leadsLoading } = useGetLeadListQuery({ page: 1, limit: 100 })
	const { data: clientRequestsData, isLoading: crLoading } = useGetClientRequestListQuery({
		page: 1,
		limit: 100,
	})
	const { data: clientsData, isLoading: clientsLoading } = useGetClientsQuery({
		page: 1,
		limit: 100,
		sortBy: 'firstName',
		sortDirection: 'asc',
	})
	const [createClientCall, { isLoading: isSubmitting }] = useCreateClientCallMutation()

	const leads = leadsData?.data ?? []
	const clientRequests = clientRequestsData?.data ?? []
	const crmClients = clientsData?.data ?? []

	const clientOptions =
		clientType === 'lead'
			? leads.map((l) => ({
					id: l.id,
					name: l.firstName
						? `${l.firstName} ${l.lastName ?? ''}`.trim()
						: (l.proposal?.title ?? l.id),
				}))
			: clientType === 'client'
				? crmClients.map((c) => ({
						id: c.id,
						name:
							[c.firstName, c.lastName].filter(Boolean).join(' ').trim() ||
							c.company ||
							c.id,
					}))
				: clientRequests.map((cr) => ({
						id: cr.id,
						name: cr.name || cr.company || cr.id,
					}))

	const selectedTimezone = timezones.find((tz) => tz.value === clientTimezone)
	const selectedClient = clientOptions.find((c) => c.id === selectedClientId)

	const handleClientTypeChange = (type: ClientType) => {
		setClientType(type)
		setSelectedClientId('')
	}

	const clientDateTime = useMemo(() => {
		if (!date || !time || !selectedTimezone) return null
		if (selectedTimezone.timezone) {
			return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', selectedTimezone.timezone)
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

	const handleCreateCall = async () => {
		setSubmitAttempted(true)
		if (hasErrors || !clientDateTime) return

		const clientTimezoneForApi =
			selectedTimezone?.timezone ?? selectedTimezone?.offset ?? clientTimezone

		const body = {
			clientType,
			callTitle: callTitle.trim(),
			scheduledAt: clientDateTime.toISOString(),
			clientTimezone: clientTimezoneForApi,
			duration: Number(duration),
			...(clientType === 'lead'
				? { leadId: selectedClientId }
				: clientType === 'client'
					? { crmClientId: selectedClientId }
					: { clientRequestId: selectedClientId }),
		}

		try {
			const result = await createClientCall(body).unwrap()
			showToast('Client call created successfully', 'success')
			navigate(`/client-calls/preview/${result.id}`)
		} catch {
			showToast('Failed to create client call. Please try again.', 'error')
		}
	}

	const handleReset = () => {
		const fresh = dayjs().add(1, 'hour')
		setClientType('lead')
		setSelectedClientId('')
		setCallTitle('Discovery call')
		setDate(fresh.format('YYYY-MM-DD'))
		setTime(fresh.format('HH:mm'))
		setDuration('30')
		setClientTimezone('EST')
		setSubmitAttempted(false)
	}

	const isLoadingClients =
		clientType === 'lead'
			? leadsLoading
			: clientType === 'client'
				? clientsLoading
				: crLoading

	return (
		<ThemeProvider theme={muiSargasTheme}>
			<Box sx={{ width: '100%' }}>
				<Box
					sx={{
						background: '#fff',
						borderRadius: '18px',
						boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 40px rgba(39, 36, 45, 0.06)',
						overflow: 'hidden',
						position: 'relative',
						animation: 'callShellIn 520ms cubic-bezier(0.22, 1, 0.36, 1) both',
						'@keyframes callShellIn': {
							from: { opacity: 0, transform: 'translateY(10px)' },
							to: { opacity: 1, transform: 'translateY(0)' },
						},
						'@media (prefers-reduced-motion: reduce)': {
							animation: 'none',
						},
					}}
				>
					{/* ── Top row: back + reset ─────────────────────────── */}
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							px: { xs: 3, md: 5 },
							pt: { xs: 3, md: 4 },
							pb: 0,
							gap: 2,
							flexWrap: 'wrap',
						}}
					>
						<BackChip onClick={() => navigate('/client-calls/list')} />
						<GhostButton onClick={handleReset}>
							<RestartAltOutlined sx={{ fontSize: 18 }} />
							<span>Reset</span>
						</GhostButton>
					</Box>

					{/* ── Cursive corner note ───────────────────────────── */}
					<Box
						aria-hidden
						sx={{
							position: 'absolute',
							top: { xs: 60, md: 88 },
							right: { xs: 14, md: 40 },
							pointerEvents: 'none',
							userSelect: 'none',
							display: { xs: 'none', sm: 'inline-flex' },
							flexDirection: 'column',
							alignItems: 'flex-end',
							gap: 0.25,
							zIndex: 2,
						}}
					>
						<Box
							component='span'
							sx={{
								fontFamily: '"Caveat", "Brush Script MT", cursive',
								fontSize: { xs: 40, md: 54 },
								fontWeight: 700,
								lineHeight: 1,
								color: PRIMARY,
								transform: 'rotate(-6deg)',
								transformOrigin: 'right center',
								textShadow: '0 6px 22px rgba(2, 132, 199, 0.18)',
								whiteSpace: 'nowrap',
								animation: 'callHandDraw 900ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both',
								'@keyframes callHandDraw': {
									from: { opacity: 0, transform: 'translate(6px, 4px) rotate(-6deg)' },
									to: { opacity: 1, transform: 'translate(0, 0) rotate(-6deg)' },
								},
							}}
						>
							dial it in
						</Box>
						<Box
							component='svg'
							viewBox='0 0 90 40'
							width='90'
							height='40'
							sx={{
								color: PRIMARY,
								opacity: 0.75,
								transform: 'rotate(-4deg) scaleX(-1)',
								mr: 2,
								mt: -0.5,
								'& path': {
									strokeDasharray: 220,
									strokeDashoffset: 220,
									animation: 'callFlourish 1100ms cubic-bezier(0.22, 1, 0.36, 1) 550ms forwards',
								},
								'@keyframes callFlourish': {
									to: { strokeDashoffset: 0 },
								},
							}}
						>
							<path
								d='M4 6 C 22 18, 48 4, 76 26'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.2'
								strokeLinecap='round'
							/>
							<path
								d='M68 20 L 78 26 L 70 34'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</Box>
					</Box>

					<Box
						sx={{
							p: { xs: 3, md: '32px 40px 40px 40px' },
							display: 'flex',
							flexDirection: 'column',
							gap: 4,
							position: 'relative',
						}}
					>
						{/* ── Editorial header ─────────────────────────── */}
						<Box sx={{ position: 'relative', pt: 1 }}>
							<Box
								aria-hidden
								sx={{
									position: 'absolute',
									top: -32,
									left: -10,
									fontFamily: 'inherit',
									fontSize: { xs: 140, md: 200 },
									fontWeight: 900,
									lineHeight: 1,
									color: 'transparent',
									WebkitTextStroke: `1.5px ${PRIMARY}18`,
									letterSpacing: '-0.03em',
									pointerEvents: 'none',
									userSelect: 'none',
								}}
							>
								01
							</Box>

							<Box sx={{ position: 'relative', zIndex: 1 }}>
								<Stack direction='row' spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
									<Box sx={{ width: 26, height: 2, background: PRIMARY }} />
									<Typography
										sx={{
											color: PRIMARY,
											fontSize: 12,
											fontWeight: 700,
											letterSpacing: '0.22em',
											textTransform: 'uppercase',
										}}
									>
										Schedule a call
									</Typography>
								</Stack>
								<Typography
									sx={{
										fontSize: { xs: 26, md: 34 },
										fontWeight: 800,
										lineHeight: 1.15,
										letterSpacing: '-0.02em',
										color: INK,
										maxWidth: 780,
									}}
								>
									Book a call with your client.
								</Typography>
								<Typography sx={{ color: INK_60, fontSize: 15, mt: 1.5, maxWidth: 620 }}>
									Pick a source, drop in a time — we'll flip the timezones so your side and
									their side both line up.
								</Typography>
							</Box>
						</Box>

						{/* ── Two-column workspace ────────────────────── */}
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' },
								gap: 3,
								alignItems: 'stretch',
							}}
						>
							{/* Left column — form */}
							<Box
								sx={{
									background: '#fff',
									border: `1px solid ${INK_10}`,
									borderRadius: '14px',
									overflow: 'hidden',
									display: 'flex',
									flexDirection: 'column',
								}}
							>
								{/* Client type + client select */}
								<Section title='Client' step='01'>
									<SegmentedPill
										value={clientType}
										onChange={handleClientTypeChange}
										leadCount={leads.length}
										clientCount={crmClients.length}
										requestCount={clientRequests.length}
									/>

									<Box sx={{ mt: 2.5 }}>
										<FieldLabel error={submitAttempted && errors.selectedClientId}>
											{clientType === 'lead'
												? 'Choose lead'
												: clientType === 'client'
													? 'Choose client'
													: 'Choose client request'}
										</FieldLabel>
										<Select
											fullWidth
											displayEmpty
											value={selectedClientId}
											onChange={(e) => setSelectedClientId(e.target.value)}
											disabled={isLoadingClients}
											error={submitAttempted && errors.selectedClientId}
											renderValue={(v) => {
												if (!v) {
													return (
														<Box sx={{ color: INK_45, fontWeight: 500 }}>
															{isLoadingClients
																? 'Loading…'
																: `Pick a ${clientType === 'lead' ? 'lead' : clientType === 'client' ? 'client' : 'client request'}`}
														</Box>
													)
												}
												return clientOptions.find((c) => c.id === v)?.name || v
											}}
											IconComponent={undefined}
											sx={{
												borderRadius: '12px',
												fontSize: 14.5,
												fontWeight: 500,
												color: INK,
												background: '#fff',
												'& .MuiOutlinedInput-notchedOutline': {
													borderColor:
														submitAttempted && errors.selectedClientId ? '#dc2626' : INK_10,
													borderWidth: 1.5,
												},
												'&:hover .MuiOutlinedInput-notchedOutline': {
													borderColor: 'rgba(15, 23, 42, 0.22)',
												},
												'&.Mui-focused': {
													boxShadow: `0 0 0 4px ${PRIMARY}22`,
												},
												'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
													borderColor: PRIMARY,
													borderWidth: 1.5,
												},
												'& .MuiSelect-select': { py: '13px' },
											}}
											endAdornment={
												isLoadingClients ? (
													<CircularProgress size={18} sx={{ mr: 2, color: PRIMARY }} />
												) : undefined
											}
										>
											{clientOptions.map((client) => (
												<MenuItem key={client.id} value={client.id}>
													{client.name}
												</MenuItem>
											))}
										</Select>
										{submitAttempted && errors.selectedClientId ? (
											<HelperText error>Please pick a client</HelperText>
										) : null}
									</Box>

									<Box sx={{ mt: 2.5 }}>
										<FieldLabel error={submitAttempted && errors.callTitle}>
											Call title
										</FieldLabel>
										<TextField
											fullWidth
											value={callTitle}
											onChange={(e) => setCallTitle(e.target.value)}
											placeholder='e.g. Discovery call'
											error={submitAttempted && errors.callTitle}
											sx={fieldSx}
										/>
										{submitAttempted && errors.callTitle ? (
											<HelperText error>Call title is required</HelperText>
										) : null}
									</Box>
								</Section>

								{/* Schedule */}
								<Section title='Schedule' step='02'>
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
											gap: 2,
										}}
									>
										<Box>
											<FieldLabel error={submitAttempted && errors.date}>Date</FieldLabel>
											<TextField
												fullWidth
												type='date'
												value={date}
												onChange={(e) => {
													setDate(e.target.value)
													setTime('')
												}}
												error={submitAttempted && errors.date}
												slotProps={{
													inputLabel: { shrink: true },
													htmlInput: { min: dayjs().format('YYYY-MM-DD') },
												}}
												sx={fieldSx}
											/>
											{submitAttempted && errors.date ? (
												<HelperText error>Date is required</HelperText>
											) : null}
										</Box>

										<Box>
											<FieldLabel error={submitAttempted && errors.time}>Time</FieldLabel>
											<LocalizationProvider dateAdapter={AdapterDayjs}>
												<TimePicker
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
															sx: {
																...fieldSx,
																'& .MuiOutlinedInput-root.Mui-disabled': {
																	background: INK_04,
																},
															},
														},
													}}
												/>
											</LocalizationProvider>
											{submitAttempted && errors.time ? (
												<HelperText error>
													Must be at least 30 minutes from now
												</HelperText>
											) : !date ? (
												<HelperText>Pick a date first</HelperText>
											) : null}
										</Box>
									</Box>

									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
											gap: 2,
											mt: 2.5,
										}}
									>
										<Box>
											<FieldLabel error={submitAttempted && errors.clientTimezone}>
												Client timezone
											</FieldLabel>
											<Select
												fullWidth
												value={clientTimezone}
												onChange={(e) => setClientTimezone(e.target.value)}
												error={submitAttempted && errors.clientTimezone}
												sx={{
													borderRadius: '12px',
													fontSize: 14.5,
													fontWeight: 500,
													color: INK,
													'& .MuiOutlinedInput-notchedOutline': {
														borderColor: INK_10,
														borderWidth: 1.5,
													},
													'&:hover .MuiOutlinedInput-notchedOutline': {
														borderColor: 'rgba(15, 23, 42, 0.22)',
													},
													'&.Mui-focused': { boxShadow: `0 0 0 4px ${PRIMARY}22` },
													'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
														borderColor: PRIMARY,
														borderWidth: 1.5,
													},
													'& .MuiSelect-select': { py: '13px' },
												}}
											>
												{timezones.map((tz) => (
													<MenuItem key={tz.value} value={tz.value}>
														{tz.label}
													</MenuItem>
												))}
											</Select>
										</Box>

										<Box>
											<FieldLabel error={submitAttempted && errors.duration}>
												Duration
											</FieldLabel>
											<Select
												fullWidth
												value={duration}
												onChange={(e) => setDuration(e.target.value)}
												error={submitAttempted && errors.duration}
												sx={{
													borderRadius: '12px',
													fontSize: 14.5,
													fontWeight: 500,
													color: INK,
													'& .MuiOutlinedInput-notchedOutline': {
														borderColor: INK_10,
														borderWidth: 1.5,
													},
													'&:hover .MuiOutlinedInput-notchedOutline': {
														borderColor: 'rgba(15, 23, 42, 0.22)',
													},
													'&.Mui-focused': { boxShadow: `0 0 0 4px ${PRIMARY}22` },
													'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
														borderColor: PRIMARY,
														borderWidth: 1.5,
													},
													'& .MuiSelect-select': { py: '13px' },
												}}
											>
												<MenuItem value='30'>30 minutes</MenuItem>
												<MenuItem value='45'>45 minutes</MenuItem>
												<MenuItem value='60'>60 minutes</MenuItem>
											</Select>
										</Box>
									</Box>
								</Section>

								{/* CTA */}
								<Box sx={{ p: 3, borderTop: `1px solid ${INK_10}`, background: INK_04 }}>
									<CTAButton
										disabled={isSubmitting}
										loading={isSubmitting}
										onClick={handleCreateCall}
									/>
								</Box>
							</Box>

							{/* Right column — preview */}
							<Box
								sx={{
									background: '#fff',
									border: `1px solid ${INK_10}`,
									borderRadius: '14px',
									overflow: 'hidden',
									display: 'flex',
									flexDirection: 'column',
									alignSelf: 'start',
									position: { lg: 'sticky' },
									top: { lg: 24 },
								}}
							>
								<Box
									sx={{
										p: 2.5,
										borderBottom: `1px solid ${INK_10}`,
										background: INK_04,
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<Typography
										sx={{
											fontSize: 11,
											fontWeight: 700,
											letterSpacing: '0.18em',
											textTransform: 'uppercase',
											color: INK_60,
										}}
									>
										Preview
									</Typography>
									<Typography
										sx={{
											fontFamily: '"JetBrains Mono", monospace',
											fontSize: 11,
											color: INK_45,
										}}
									>
										CALL-DRAFT
									</Typography>
								</Box>

								<Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
									{/* Client card */}
									<Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
										<Box
											sx={{
												width: 52,
												height: 52,
												borderRadius: '12px',
												background: selectedClient ? PRIMARY : INK_04,
												color: selectedClient ? '#fff' : INK_45,
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontFamily: '"JetBrains Mono", monospace',
												fontWeight: 800,
												fontSize: 18,
												letterSpacing: '0.05em',
												flexShrink: 0,
												border: `1px solid ${selectedClient ? PRIMARY : INK_10}`,
												boxShadow: selectedClient
													? `0 8px 20px -10px ${PRIMARY}66`
													: 'none',
												transition: 'all 240ms cubic-bezier(0.22, 1, 0.36, 1)',
											}}
										>
											{selectedClient ? (
												clientInitials(selectedClient.name)
											) : (
												<PhoneInTalkOutlined sx={{ fontSize: 22 }} />
											)}
										</Box>
										<Box sx={{ minWidth: 0, flex: 1 }}>
											<Typography
												sx={{
													fontSize: 10.5,
													fontWeight: 800,
													letterSpacing: '0.22em',
													textTransform: 'uppercase',
													color: INK_45,
													lineHeight: 1,
												}}
											>
												{clientType === 'lead'
													? 'Lead'
													: clientType === 'client'
														? 'Client'
														: 'Client request'}
											</Typography>
											<Typography
												sx={{
													fontSize: 17,
													fontWeight: 800,
													color: selectedClient ? INK : INK_45,
													lineHeight: 1.25,
													letterSpacing: '-0.01em',
													mt: 0.5,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
											>
												{selectedClient?.name || 'Nobody picked yet'}
											</Typography>
										</Box>
									</Stack>

									{/* Call title chip */}
									<Box
										sx={{
											borderTop: `1px dashed ${INK_10}`,
											pt: 2,
										}}
									>
										<Typography
											sx={{
												fontSize: 10.5,
												fontWeight: 800,
												letterSpacing: '0.22em',
												textTransform: 'uppercase',
												color: INK_45,
												mb: 0.5,
											}}
										>
											Title
										</Typography>
										<Typography
											sx={{
												fontSize: 15,
												fontWeight: 600,
												color: callTitle ? INK : INK_45,
												letterSpacing: '-0.005em',
												wordBreak: 'break-word',
											}}
										>
											{callTitle || '—'}
										</Typography>
									</Box>

									{/* Time conversion box */}
									<Box
										sx={{
											position: 'relative',
											mt: 0.5,
											p: '16px 18px',
											borderRadius: '14px',
											background: `linear-gradient(135deg, ${PRIMARY_TINT} 0%, #ffffff 60%, ${PRIMARY_TINT} 130%)`,
											backgroundSize: '200% 200%',
											border: `1px solid ${PRIMARY_TINT_STRONG}`,
											overflow: 'hidden',
											animation: 'callTimeShift 6s ease-in-out infinite',
											'@keyframes callTimeShift': {
												'0%, 100%': { backgroundPosition: '0% 50%' },
												'50%': { backgroundPosition: '100% 50%' },
											},
											'@media (prefers-reduced-motion: reduce)': {
												animation: 'none',
											},
										}}
									>
										<Typography
											sx={{
												fontSize: 11,
												fontWeight: 800,
												letterSpacing: '0.18em',
												textTransform: 'uppercase',
												color: PRIMARY,
												mb: 1.25,
											}}
										>
											Time conversion
										</Typography>
										<Stack spacing={1}>
											<TimeLine
												label='Client'
												value={
													clientDateTime && selectedTimezone
														? `${clientDateTime.format('DD MMM YYYY · HH:mm')} · ${selectedTimezone.value}`
														: '—'
												}
											/>
											<TimeLine
												label='You'
												value={
													kyivDateTime
														? `${kyivDateTime.format('DD MMM YYYY · HH:mm')} · Kyiv`
														: '—'
												}
											/>
										</Stack>
									</Box>

									{/* Fact chips */}
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: '1fr 1fr',
											gap: 1.5,
											mt: 0.5,
										}}
									>
										<FactChip
											icon={<HourglassEmptyOutlined sx={{ fontSize: 16 }} />}
											label='Duration'
											value={`${duration} min`}
										/>
										<FactChip
											icon={<PublicOutlined sx={{ fontSize: 16 }} />}
											label='TZ'
											value={selectedTimezone?.value || '—'}
										/>
										<FactChip
											icon={<CalendarMonthOutlined sx={{ fontSize: 16 }} />}
											label='Date'
											value={date || '—'}
										/>
										<FactChip
											icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
											label='Time'
											value={time || '—'}
										/>
									</Box>
								</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</ThemeProvider>
	)
}

export default memo(CreateCallPage)

/* ── Sub-components ─────────────────────────────────────────────── */

const Section = ({
	title,
	step,
	children,
}: {
	title: string
	step: string
	children: React.ReactNode
}) => (
	<Box sx={{ p: { xs: 2.5, md: 3 }, borderBottom: `1px solid ${INK_10}` }}>
		<Stack direction='row' spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
			<Box
				sx={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: 26,
					height: 26,
					borderRadius: '50%',
					background: PRIMARY_TINT,
					color: PRIMARY,
					fontFamily: '"JetBrains Mono", monospace',
					fontSize: 11,
					fontWeight: 800,
					border: `1px solid ${PRIMARY_TINT_STRONG}`,
					letterSpacing: '0.02em',
				}}
			>
				{step}
			</Box>
			<Typography
				sx={{
					fontSize: 11,
					fontWeight: 800,
					letterSpacing: '0.22em',
					textTransform: 'uppercase',
					color: INK_45,
				}}
			>
				{title}
			</Typography>
			<Box sx={{ flex: 1, height: 1, background: INK_10 }} />
		</Stack>
		{children}
	</Box>
)

const FieldLabel = ({ children, error }: { children: React.ReactNode; error?: boolean }) => (
	<Typography
		sx={{
			fontSize: 10.5,
			fontWeight: 800,
			letterSpacing: '0.18em',
			textTransform: 'uppercase',
			color: error ? '#dc2626' : INK_60,
			mb: 0.75,
		}}
	>
		{children}
	</Typography>
)

const HelperText = ({ children, error }: { children: React.ReactNode; error?: boolean }) => (
	<Typography
		sx={{
			fontSize: 12,
			color: error ? '#dc2626' : INK_45,
			mt: 0.5,
			fontWeight: 500,
		}}
	>
		{children}
	</Typography>
)

const SegmentedPill = ({
	value,
	onChange,
	leadCount,
	clientCount,
	requestCount,
}: {
	value: ClientType
	onChange: (v: ClientType) => void
	leadCount: number
	clientCount: number
	requestCount: number
}) => {
	const activeIndex = value === 'lead' ? 0 : value === 'client' ? 1 : 2
	return (
		<Box
			sx={{
				position: 'relative',
				display: 'grid',
				gridTemplateColumns: '1fr 1fr 1fr',
				background: INK_04,
				borderRadius: '12px',
				p: '4px',
				border: `1px solid ${INK_10}`,
				overflow: 'hidden',
			}}
		>
			<Box
				sx={{
					position: 'absolute',
					top: 4,
					bottom: 4,
					left: `calc(${(activeIndex * 100) / 3}% + 4px)`,
					width: 'calc(100% / 3 - 8px)',
					background: '#fff',
					borderRadius: '9px',
					boxShadow:
						'0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px -4px rgba(15, 23, 42, 0.08)',
					border: `1px solid ${INK_10}`,
					transition: 'left 240ms cubic-bezier(0.22, 1, 0.36, 1)',
					zIndex: 0,
				}}
			/>
			<PillTab
				icon={<ContactPhoneOutlined sx={{ fontSize: 18 }} />}
				label='Leads'
				count={leadCount}
				active={value === 'lead'}
				onClick={() => onChange('lead')}
			/>
			<PillTab
				icon={<ContactPhoneOutlined sx={{ fontSize: 18 }} />}
				label='Clients'
				count={clientCount}
				active={value === 'client'}
				onClick={() => onChange('client')}
			/>
			<PillTab
				icon={<WorkOutlineOutlined sx={{ fontSize: 18 }} />}
				label='Client requests'
				count={requestCount}
				active={value === 'client_request'}
				onClick={() => onChange('client_request')}
			/>
		</Box>
	)
}

const PillTab = ({
	icon,
	label,
	count,
	active,
	onClick,
}: {
	icon: React.ReactNode
	label: string
	count: number
	active: boolean
	onClick: () => void
}) => (
	<Box
		component='button'
		type='button'
		onClick={onClick}
		sx={{
			position: 'relative',
			zIndex: 1,
			appearance: 'none',
			background: 'transparent',
			border: 'none',
			padding: '10px 14px',
			cursor: 'pointer',
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 1.25,
			transition: 'color 160ms ease',
			fontFamily: 'inherit',
			color: active ? PRIMARY : INK_60,
			fontWeight: active ? 700 : 600,
			fontSize: 13.5,
			letterSpacing: '0.005em',
			borderRadius: '9px',
			'&:hover': { color: active ? PRIMARY : INK },
		}}
	>
		{icon}
		<span>{label}</span>
		<Box
			component='span'
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				minWidth: 22,
				height: 20,
				borderRadius: '999px',
				background: active ? PRIMARY_TINT : INK_10,
				color: active ? PRIMARY : INK_60,
				fontSize: 11.5,
				fontWeight: 700,
				padding: '0 6px',
				fontVariantNumeric: 'tabular-nums',
				transition: 'all 160ms ease',
			}}
		>
			{count}
		</Box>
	</Box>
)

const BackChip = ({ onClick }: { onClick: () => void }) => (
	<Box
		component='button'
		type='button'
		onClick={onClick}
		sx={{
			appearance: 'none',
			background: 'transparent',
			border: 'none',
			padding: '8px 14px 8px 10px',
			cursor: 'pointer',
			display: 'inline-flex',
			alignItems: 'center',
			gap: 1.25,
			color: INK,
			fontFamily: 'inherit',
			fontSize: 13.5,
			fontWeight: 500,
			borderRadius: '999px',
			'& .arrow': {
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: 26,
				height: 26,
				borderRadius: '50%',
				background: PRIMARY,
				color: '#fff',
				transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
			},
			'&:hover .arrow': {
				transform: 'translateX(-3px)',
			},
		}}
	>
		<span className='arrow'>
			<ArrowBackRounded sx={{ fontSize: 16 }} />
		</span>
		<span>Back to calls</span>
	</Box>
)

const GhostButton = ({
	onClick,
	children,
}: {
	onClick: () => void
	children: React.ReactNode
}) => (
	<Box
		component='button'
		type='button'
		onClick={onClick}
		sx={{
			appearance: 'none',
			background: '#fff',
			border: `1px solid ${INK_10}`,
			borderRadius: '12px',
			padding: '10px 16px',
			cursor: 'pointer',
			display: 'inline-flex',
			alignItems: 'center',
			gap: 1,
			color: INK,
			fontFamily: 'inherit',
			fontSize: 13.5,
			fontWeight: 500,
			boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
			transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
			'& svg': {
				transformOrigin: '50% 50%',
				transition: 'rotate 500ms cubic-bezier(0.22, 1, 0.36, 1)',
			},
			'&:hover': {
				transform: 'translateY(-1px)',
			},
			'&:hover svg': {
				rotate: '-180deg',
			},
		}}
	>
		{children}
	</Box>
)

const TimeLine = ({ label, value }: { label: string; value: string }) => (
	<Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
		<Box
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: 28,
				height: 28,
				borderRadius: '8px',
				background: '#fff',
				border: `1px solid ${PRIMARY_TINT_STRONG}`,
				color: PRIMARY,
				flexShrink: 0,
			}}
		>
			<AccessTimeOutlined sx={{ fontSize: 16 }} />
		</Box>
		<Box sx={{ minWidth: 0 }}>
			<Typography
				sx={{
					fontSize: 10,
					fontWeight: 800,
					letterSpacing: '0.18em',
					textTransform: 'uppercase',
					color: INK_45,
					lineHeight: 1,
				}}
			>
				{label}
			</Typography>
			<Typography
				sx={{
					fontFamily: '"JetBrains Mono", monospace',
					fontSize: 13,
					fontWeight: 700,
					color: INK,
					mt: 0.5,
					letterSpacing: '-0.005em',
				}}
			>
				{value}
			</Typography>
		</Box>
	</Stack>
)

const FactChip = ({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode
	label: string
	value: string
}) => (
	<Box
		sx={{
			display: 'flex',
			alignItems: 'center',
			gap: 1,
			padding: '10px 12px',
			borderRadius: '10px',
			background: '#fff',
			border: `1px solid ${INK_10}`,
			minWidth: 0,
		}}
	>
		<Box
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: PRIMARY,
				flexShrink: 0,
			}}
		>
			{icon}
		</Box>
		<Box sx={{ minWidth: 0, flex: 1 }}>
			<Typography
				sx={{
					fontSize: 10.5,
					fontWeight: 800,
					letterSpacing: '0.18em',
					textTransform: 'uppercase',
					color: INK_45,
					lineHeight: 1,
				}}
			>
				{label}
			</Typography>
			<Typography
				sx={{
					fontSize: 14,
					fontWeight: 700,
					color: INK,
					mt: 0.5,
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				}}
			>
				{value}
			</Typography>
		</Box>
	</Box>
)

const CTAButton = ({
	disabled,
	loading,
	onClick,
}: {
	disabled: boolean
	loading: boolean
	onClick: () => void
}) => (
	<Box
		component='button'
		type='button'
		disabled={disabled}
		onClick={onClick}
		sx={{
			appearance: 'none',
			border: 'none',
			background: PRIMARY,
			color: '#fff',
			fontFamily: 'inherit',
			fontSize: 14.5,
			fontWeight: 700,
			letterSpacing: '0.02em',
			padding: '14px 22px',
			borderRadius: '10px',
			cursor: disabled ? 'not-allowed' : 'pointer',
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: 1.5,
			boxShadow: `0 8px 22px -8px ${PRIMARY}66`,
			transition: 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms ease',
			width: '100%',
			opacity: disabled ? 0.7 : 1,
			'& svg.arrow': {
				transition: 'translate 220ms cubic-bezier(0.22, 1, 0.36, 1)',
			},
			'&:hover:not(:disabled)': {
				background: PRIMARY_HOVER,
				transform: 'translateY(-1px)',
			},
			'&:hover:not(:disabled) svg.arrow': {
				translate: '4px 0',
			},
			'&:active:not(:disabled)': { transform: 'translateY(0)' },
		}}
	>
		<Stack direction='row' spacing={1.25} sx={{ alignItems: 'center' }}>
			{loading ? (
				<CircularProgress size={18} sx={{ color: '#fff' }} />
			) : (
				<CheckRounded sx={{ fontSize: 20 }} />
			)}
			<span>{loading ? 'Creating…' : 'Create call'}</span>
		</Stack>
		<ArrowForwardRounded className='arrow' sx={{ fontSize: 20 }} />
	</Box>
)
