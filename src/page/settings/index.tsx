import { memo, useState } from 'react'
import {
	Box,
	Button,
	Card,
	Divider,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Switch,
	TextField,
	Typography,
} from '@mui/material'
import {
	SettingsOutlined,
	NotificationsNoneOutlined,
	SmartToyOutlined,
	ExtensionOutlined,
	ArticleOutlined,
	KeyOutlined,
} from '@mui/icons-material'

const fieldSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '14px',
		background: '#fff',
	},
}

const sections = [
	{ id: 'general', label: 'General', icon: <SettingsOutlined /> },
	{ id: 'ai', label: 'AI Settings', icon: <SmartToyOutlined /> },
	{ id: 'scanner', label: 'Job Scanner', icon: <ArticleOutlined /> },
	{ id: 'integrations', label: 'Integrations', icon: <ExtensionOutlined /> },
	{ id: 'notifications', label: 'Notifications', icon: <NotificationsNoneOutlined /> },
	{ id: 'api', label: 'API Keys', icon: <KeyOutlined /> },
]

const SettingsPage = () => {
	const [activeSection, setActiveSection] = useState('general')

	return (
		<Box
			sx={{
				minHeight: '100vh',
				background: '#f7f2fb',
				p: { xs: 2, md: 5 },
			}}
		>
			<Card
				sx={{
					borderRadius: '28px',
					boxShadow: '0 12px 35px rgba(39, 36, 45, 0.06)',
					overflow: 'hidden',
					background: '#fff',
				}}
			>
				<Box sx={{ display: 'grid', gridTemplateColumns: '260px 1fr' }}>
					<Box sx={{ borderRight: '1px solid #eee', p: 3 }}>
						<Typography sx={{ fontSize: 24, fontWeight: 800, mb: 0.5 }}>
							Settings
						</Typography>
						<Typography sx={{ fontSize: 14, color: '#777', mb: 4 }}>
							Manage CRM preferences.
						</Typography>

						<Box sx={{ display: 'grid', gap: 1 }}>
							{sections.map((item) => (
								<Box
									key={item.id}
									onClick={() => setActiveSection(item.id)}
									sx={{
										height: 48,
										px: 2,
										borderRadius: '14px',
										display: 'flex',
										alignItems: 'center',
										gap: 1.5,
										cursor: 'pointer',
										color: activeSection === item.id ? '#1976d2' : '#222',
										background: activeSection === item.id ? '#eef4ff' : 'transparent',
										'& svg': {
											fontSize: 22,
										},
									}}
								>
									{item.icon}
									<Typography sx={{ fontSize: 15, fontWeight: 500 }}>
										{item.label}
									</Typography>
								</Box>
							))}
						</Box>
					</Box>

					<Box>
						<Box sx={{ p: 3, borderBottom: '1px solid #eee' }}>
							<Typography sx={{ fontSize: 26, fontWeight: 800 }}>
								{sections.find((s) => s.id === activeSection)?.label}
							</Typography>
							<Typography sx={{ color: '#777', mt: 0.5 }}>
								Configure selected section.
							</Typography>
						</Box>

						<SettingsRow
							title="Default behavior"
							description="Configure the base behavior for managers and sales flow."
						>
							<Box sx={{ display: 'grid', gap: 2 }}>
								<FormControl fullWidth sx={fieldSx}>
									<InputLabel>Default manager</InputLabel>
									<Select label="Default manager" defaultValue="vadym">
										<MenuItem value="vadym">Vadym</MenuItem>
										<MenuItem value="sales">Sales Team</MenuItem>
									</Select>
								</FormControl>

								<TextField
									label="Default call title"
									defaultValue="Discovery call"
									fullWidth
									sx={fieldSx}
								/>
							</Box>
						</SettingsRow>

						<SettingsRow
							title="Automation options"
							description="Turn on/off automation logic for CRM workflows."
						>
							<Box sx={{ display: 'grid', gap: 2 }}>
								<SwitchLine title="Enable job scanner" description="Automatically fetch new jobs." />
								<SwitchLine title="Auto analyze leads" description="Score leads after import." />
								<SwitchLine title="Telegram alerts" description="Send important updates to Telegram." />
							</Box>
						</SettingsRow>

						<SettingsRow
							title="Prompt / template"
							description="Store larger text blocks, prompts, rules, or default messages."
						>
							<TextField
								label="System prompt"
								multiline
								minRows={7}
								fullWidth
								placeholder="Paste your prompt or writing rules here..."
								sx={fieldSx}
							/>
						</SettingsRow>

						<SettingsRow
							title="API / integration"
							description="Store keys or integration-specific values."
						>
							<Box sx={{ display: 'grid', gap: 2 }}>
								<TextField label="OpenAI API key" fullWidth sx={fieldSx} />
								<TextField label="Discord webhook URL" fullWidth sx={fieldSx} />
								<Button
									variant="contained"
									sx={{
										height: 46,
										borderRadius: '14px',
										justifySelf: 'flex-end',
										px: 4,
										mt: 4
									}}
								>
									Save changes
								</Button>
							</Box>
						</SettingsRow>
					</Box>
				</Box>
			</Card>
		</Box>
	)
}

const SettingsRow = ({
						 title,
						 description,
						 children,
					 }: {
	title: string
	description: string
	children: React.ReactNode
}) => (
	<Box
		sx={{
			display: 'grid',
			gridTemplateColumns: '300px 1fr',
			gap: 5,
			p: 3,
			borderBottom: '1px solid #eee',
		}}
	>
		<Box>
			<Typography sx={{ fontSize: 18, fontWeight: 800 }}>{title}</Typography>
			<Typography sx={{ fontSize: 14, color: '#777', mt: 0.5 }}>
				{description}
			</Typography>
		</Box>

		<Box>{children}</Box>
	</Box>
)

const SwitchLine = ({
						title,
						description,
					}: {
	title: string
	description: string
}) => (
	<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
		<Box>
			<Typography sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
			<Typography sx={{ fontSize: 14, color: '#777' }}>{description}</Typography>
		</Box>

		<Switch defaultChecked />
	</Box>
)

export default memo(SettingsPage)