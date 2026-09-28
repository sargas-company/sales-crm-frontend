import { memo, useState, useEffect } from 'react'
import {
	Box,
	Card,
	CircularProgress,
	FormControl,
	IconButton,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	Switch,
	TextField,
	Typography,
} from '@mui/material'
import {
	ArticleOutlined,
	ExtensionOutlined,
	KeyOutlined,
	NotificationsNoneOutlined,
	ReceiptLongOutlined,
	SettingsOutlined,
	SmartToyOutlined,
	Visibility,
	VisibilityOff,
} from '@mui/icons-material'
import { Button as UiButton } from '../../ui'
import { useGetSettingsQuery, useUpdateSettingMutation } from '../../store/settings/settingsApi'
import SettingsEmptyTab from './SettingsEmptyTab'
import { AnimatedSectionContent, AnimatedTabHeader } from './settings.styled'
import type { SettingItem } from '../../store/settings/types/definition'
import PermissionGate from '../../components/auth/PermissionGate'

const SECTION_ICONS: Record<string, React.ReactNode> = {
	general: <SettingsOutlined />,
	ai: <SmartToyOutlined />,
	job_scanner: <ArticleOutlined />,
	integrations: <ExtensionOutlined />,
	notifications: <NotificationsNoneOutlined />,
	api_keys: <KeyOutlined />,
	invoice: <ReceiptLongOutlined />,
}

const SECTION_EMPTY_COPY: Record<string, { title: string; description: string }> = {
	general: {
		title: 'Nothing to tweak yet',
		description: 'General settings will appear here as soon as they are available.',
	},
	ai: {
		title: 'AI is warming up',
		description: 'Model settings will show up once your AI features are enabled.',
	},
	job_scanner: {
		title: 'Scanner is quiet for now',
		description: 'Job scanner options will appear here once the scanner is configured.',
	},
	integrations: {
		title: 'No integrations yet',
		description: 'Connect a service and its configuration will land right here.',
	},
	notifications: {
		title: 'You are all caught up',
		description: 'Notification preferences will appear here once channels are set up.',
	},
	api_keys: {
		title: 'No API keys generated',
		description: 'Generated tokens and their limits will be listed here.',
	},
	invoice: {
		title: 'No invoice preferences',
		description: 'Numbering rules, templates and defaults will appear here.',
	},
}

const fieldSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '14px',
		background: '#fff',
	},
}

const SettingsPage = () => {
	const { data: allSections = [], isLoading } = useGetSettingsQuery()
	const [updateSetting, { isLoading: isSaving }] = useUpdateSettingMutation()
	const [activeSection, setActiveSection] = useState('')
	const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({})
	const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

	// Hide sidebar entries for sections that have zero configurable Settings
	// today. The sections still exist in the DB — they just have no rows yet,
	// so rendering them as empty tabs invites clicks that go nowhere. Only
	// sections with real settings are shown; when new settings land, their
	// section becomes visible automatically.
	const sections = allSections.filter((s) => s.settings.length > 0)

	useEffect(() => {
		if (sections.length === 0) {
			if (activeSection !== '') setActiveSection('')
			return
		}
		if (!activeSection || !sections.some((s) => s.key === activeSection)) {
			setActiveSection(sections[0].key)
		}
	}, [sections, activeSection])

	const currentSection = sections.find((s) => s.key === activeSection)

	const getDisplayValue = (setting: SettingItem): string => {
		const pending = pendingChanges[setting.key]
		if (pending !== undefined) return pending
		if (setting.isSecret) return ''
		if (setting.type === 'json') return JSON.stringify(setting.value, null, 2)
		return String(setting.value ?? setting.defaultValue ?? '')
	}

	const handleChange = (key: string, value: string) => {
		setPendingChanges((prev) => ({ ...prev, [key]: value }))
	}

	const handleSectionChange = (key: string) => {
		setActiveSection(key)
		setPendingChanges({})
	}

	const hasPendingChanges = currentSection?.settings.some((s) => s.key in pendingChanges)

	const handleSave = async () => {
		if (!currentSection) return
		const toSave = currentSection.settings.filter((s) => s.key in pendingChanges)

		for (const setting of toSave) {
			const raw = pendingChanges[setting.key]
			let value: unknown = raw
			if (setting.type === 'number') value = Number(raw)
			else if (setting.type === 'boolean') value = raw === 'true'
			else if (setting.type === 'json') {
				try {
					value = JSON.parse(raw)
				} catch {
					continue
				}
			}
			await updateSetting({ key: setting.key, body: { value } })
		}

		setPendingChanges((prev) => {
			const next = { ...prev }
			toSave.forEach((s) => delete next[s.key])
			return next
		})
	}

	return (
		<Box>
			<Card
				sx={{
					borderRadius: '28px',
					boxShadow: '0 12px 35px rgba(39, 36, 45, 0.06)',
					overflow: 'hidden',
					background: '#fff',
					padding: '20px 10px 30px 10px',
				}}
			>
				<Box sx={{ display: 'grid', gridTemplateColumns: '260px 1fr' }}>
					{/* Sidebar */}
					<Box sx={{ borderRight: '1px solid #eee', p: 3 }}>
						<Typography sx={{ fontSize: 24, fontWeight: 800, mb: 0.5 }}>
							Settings
						</Typography>
						<Typography sx={{ fontSize: 14, color: '#777', mb: 4 }}>
							Manage CRM preferences.
						</Typography>

						{isLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
								<CircularProgress size={24} />
							</Box>
						) : (
							<Box sx={{ display: 'grid', gap: 1 }}>
								{sections.map((section) => (
									<Box
										key={section.key}
										onClick={() => handleSectionChange(section.key)}
										sx={{
											height: 48,
											px: 2,
											borderRadius: '14px',
											display: 'flex',
											alignItems: 'center',
											gap: 1.5,
											cursor: 'pointer',
											color: activeSection === section.key ? '#1976d2' : '#222',
											background:
												activeSection === section.key ? '#f0f9ff' : 'transparent',
											'& svg': { fontSize: 22 },
										}}
									>
										{SECTION_ICONS[section.key] ?? <SettingsOutlined />}
										<Typography sx={{ fontSize: 15, fontWeight: 500 }}>
											{section.title}
										</Typography>
									</Box>
								))}
							</Box>
						)}
					</Box>

					{/* Content */}
					<Box>
						<AnimatedTabHeader key={`h-${currentSection?.key ?? 'none'}`}>
							<Box sx={{ p: 3, borderBottom: '1px solid #eee' }}>
								<Typography sx={{ fontSize: 26, fontWeight: 800 }}>
									{currentSection?.title ?? ''}
								</Typography>
								<Typography sx={{ color: '#777', mt: 0.5 }}>
									Configure selected section.
								</Typography>
							</Box>
						</AnimatedTabHeader>

						{isLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
								<CircularProgress />
							</Box>
						) : currentSection && currentSection.settings.length === 0 ? (
							<SettingsEmptyTab
								key={currentSection.key}
								icon={SECTION_ICONS[currentSection.key] ?? <SettingsOutlined />}
								title={
									SECTION_EMPTY_COPY[currentSection.key]?.title ??
									'Nothing to configure here yet'
								}
								description={
									SECTION_EMPTY_COPY[currentSection.key]?.description ??
									'Settings for this section will appear here once available.'
								}
							/>
						) : (
							<AnimatedSectionContent key={currentSection?.key ?? 'section'}>
								{currentSection?.settings.map((setting) => (
										<SettingRow
											key={setting.key}
											setting={setting}
											displayValue={getDisplayValue(setting)}
											showPassword={showPasswords[setting.key] ?? false}
											onTogglePassword={() =>
												setShowPasswords((prev) => ({
													...prev,
													[setting.key]: !prev[setting.key],
												}))
											}
											onChange={(value) => handleChange(setting.key, value)}
											isSaving={isSaving}
										/>
									))}

								{hasPendingChanges && (
									<PermissionGate permission='settings:update'>
										<Box
											className='settings-save-bar'
											sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}
										>
											<UiButton onClick={handleSave} disabled={isSaving}>
												{isSaving ? 'Saving…' : 'Save changes'}
											</UiButton>
										</Box>
									</PermissionGate>
								)}
							</AnimatedSectionContent>
						)}
					</Box>
				</Box>
			</Card>
		</Box>
	)
}

const SettingRow = ({
	setting,
	displayValue,
	showPassword,
	onTogglePassword,
	onChange,
	isSaving,
}: {
	setting: SettingItem
	displayValue: string
	showPassword: boolean
	onTogglePassword: () => void
	onChange: (value: string) => void
	isSaving: boolean
}) => (
	<Box
		className='settings-row'
		sx={{
			display: 'grid',
			gridTemplateColumns: '300px 1fr',
			gap: 5,
			p: 3,
			borderBottom: '1px solid #eee',
			alignItems: 'start',
		}}
	>
		<Box>
			<Typography sx={{ fontSize: 16, fontWeight: 700 }}>{setting.title}</Typography>
			{setting.description && (
				<Typography sx={{ fontSize: 13, color: '#777', mt: 0.5 }}>
					{setting.description}
				</Typography>
			)}
		</Box>

		<SettingControl
			setting={setting}
			displayValue={displayValue}
			showPassword={showPassword}
			onTogglePassword={onTogglePassword}
			onChange={onChange}
			isSaving={isSaving}
		/>
	</Box>
)

const SettingControl = ({
	setting,
	displayValue,
	showPassword,
	onTogglePassword,
	onChange,
	isSaving,
}: {
	setting: SettingItem
	displayValue: string
	showPassword: boolean
	onTogglePassword: () => void
	onChange: (value: string) => void
	isSaving: boolean
}) => {
	const { uiType, type, options, validationSchema, isSecret } = setting

	if (type === 'json') {
		let currentObj: Record<string, unknown> = {}
		try {
			currentObj = JSON.parse(displayValue || '{}')
		} catch {
			if (typeof setting.value === 'object' && setting.value !== null) {
				currentObj = setting.value as Record<string, unknown>
			}
		}

		const schemaKeys =
			setting.defaultValue && typeof setting.defaultValue === 'object'
				? Object.keys(setting.defaultValue as Record<string, unknown>)
				: Object.keys(currentObj)

		const handleFieldChange = (key: string, val: string) => {
			onChange(JSON.stringify({ ...currentObj, [key]: val }))
		}

		return (
			<Box sx={{ display: 'grid', gap: 1.5 }}>
				{schemaKeys.map((k) => (
					<Box
						key={k}
						sx={{
							display: 'grid',
							gridTemplateColumns: '160px 1fr',
							gap: 2,
							alignItems: 'center',
						}}
					>
						<Typography sx={{ fontSize: 13, color: '#777', fontFamily: 'monospace' }}>
							{k}
						</Typography>
						<TextField
							size="small"
							fullWidth
							value={String(currentObj[k] ?? '')}
							onChange={(e) => handleFieldChange(k, e.target.value)}
							sx={fieldSx}
						/>
					</Box>
				))}
			</Box>
		)
	}

	if (uiType === 'toggle') {
		const checked = displayValue === 'true'
		return (
			<Switch
				checked={checked}
				onChange={(e) => onChange(String(e.target.checked))}
				disabled={isSaving}
			/>
		)
	}

	if (uiType === 'select' && options) {
		return (
			<FormControl fullWidth sx={fieldSx}>
				<InputLabel>{setting.title}</InputLabel>
				<Select
					value={displayValue}
					label={setting.title}
					onChange={(e) => onChange(String(e.target.value))}
				>
					{options.map((opt) => (
						<MenuItem key={opt} value={opt}>
							{opt}
						</MenuItem>
					))}
				</Select>
			</FormControl>
		)
	}

	if (uiType === 'textarea') {
		return (
			<TextField
				multiline
				minRows={5}
				fullWidth
				value={displayValue}
				{...(isSecret && { placeholder: '••••••••••••••••' })}
				onChange={(e) => onChange(e.target.value)}
				sx={fieldSx}
			/>
		)
	}

	if (uiType === 'password') {
		return (
			<TextField
				fullWidth
				type={showPassword ? 'text' : 'password'}
				value={displayValue}
				{...(isSecret && { placeholder: '••••••••••••••••' })}
				onChange={(e) => onChange(e.target.value)}
				sx={fieldSx}
				slotProps={{
					input: {
						endAdornment: (
							<InputAdornment position="end">
								<IconButton onClick={onTogglePassword} edge="end">
									{showPassword ? <VisibilityOff /> : <Visibility />}
								</IconButton>
							</InputAdornment>
						),
					},
				}}
			/>
		)
	}

	return (
		<TextField
			fullWidth
			type={type === 'number' ? 'number' : 'text'}
			value={displayValue}
			onChange={(e) => onChange(e.target.value)}
			{...(validationSchema && {
				inputProps: { min: validationSchema.min, max: validationSchema.max },
			})}
			sx={fieldSx}
		/>
	)
}

export default memo(SettingsPage)
