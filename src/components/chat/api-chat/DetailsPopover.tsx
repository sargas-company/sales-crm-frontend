import React, { useMemo, useState } from 'react'
import { KeyboardArrowDownRounded, InfoOutlined } from '@mui/icons-material'

import { Divider, Menu } from '@mui/material'

import Box from '../../box/Box'
import { Text } from '../../../ui'
import type { ReactNode } from 'react'
import {
	mapJobPostToFields,
	mapLeadToFields,
	mapProposalToFields,
} from '../../details-popover/DetailsMapper'

type DetailField = {
	label: string
	value?: string | number | null
	variant?: 'row' | 'stacked'
	icon?: ReactNode
	display?: 'default' | 'pill'
	color?: 'green' | 'gray' | 'blue' | 'red'
	truncate?: boolean
}

type DetailSection = {
	title: string
	fields: DetailField[]
}

type AiResponse = {
	short_summary?: string | null
	decision?: string | null
	priority?: string | null
	hard_stop?: boolean | null
	hard_stop_reason?: string | null
	match_score?: number | null
	reasons?: string[]
	red_flags?: string[]
	subscores?: Record<string, number>
}

type DetailsPopoverProps = {
	lead?: {
		name?: string | null
		companyName?: string | null
		status?: string | null
		clientType?: string | null
		location?: string | null
	}
	proposal?: {
		title?: string | null
		status?: string | null
		proposalType?: string | null
		boosted?: boolean | null
		connects?: number | null
		boostedConnects?: number | null
		platform?: { id: string; name: string } | null
		vacancy?: string | null
		coverLetter?: string | null
	}
	jobPost?: {
		title?: string | null
		description?: string | null
		score?: string | number | null
		gigRadarScore?: string | number | null
		budget?: string | null
		source?: string | null
		totalSpent?: string | number | null
		avgRatePaid?: string | number | null
		hireRate?: string | number | null
		location?: string | null
		aiResponse?: AiResponse | null
	}
	label?: string
}

const getDisplayValue = (value?: string | number | null) => {
	if (value === null || value === undefined || value === '') {
		return 'N/A'
	}

	return String(value)
}

const SectionBlock = ({ title, fields }: DetailSection) => {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})

	const renderValue = (field: DetailField) => {
		const value = getDisplayValue(field.value)

		if (field.display === 'pill') {
			const bgMap = {
				green: '#16a34a',
				gray: '#e5e7eb',
				blue: '#2563eb',
				red: '#dc2626',
			}

			const textColorMap = {
				green: '#ffffff',
				gray: '#111827',
				blue: '#ffffff',
				red: '#ffffff',
			}

			const color = field.color || 'gray'

			return (
				<Box
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '10px 22px',
						borderRadius: 999,
						background: bgMap[color],
						color: textColorMap[color],
						fontSize: 13,
						fontWeight: 600,
						lineHeight: 1,
						width: 'fit-content',
					}}
				>
					{value}
				</Box>
			)
		}

		return (
			<Text varient='body2' weight='bold'>
				{value}
			</Text>
		)
	}

	return (
		<Box
			display='flex'
			flexDirection='column'
			style={{
				padding: '14px 26px',
				gap: 12,
			}}
		>
			<Text varient='body2' weight='bold'>
				{title}
			</Text>

			<Box display='flex' flexDirection='column' style={{ gap: 10 }}>
				{fields.map((field) => {
					const isStacked = field.variant === 'stacked'

					if (isStacked) {
						return (
							<Box
								key={`${title}-${field.label}`}
								display='flex'
								flexDirection='column'
								style={{ gap: 3, marginBottom: 15 }}
							>
								<Box
									display='flex'
									align='center'
									style={{
										gap: 6,
										minWidth: 0,
									}}
								>
									{field.icon && (
										<Box
											style={{
												display: 'flex',
												alignItems: 'center',
												color: '#667085',
												flexShrink: 0,
											}}
										>
											{field.icon}
										</Box>
									)}

									<Text varient='caption' secondary>
										{field.label}
									</Text>
								</Box>

								<Box
									style={{
										width: '100%',
										wordBreak: 'break-word',
										whiteSpace: 'pre-wrap',
										lineHeight: 1.5,
										...(field.truncate && !expanded[field.label]
											? {
													display: '-webkit-box',
													WebkitLineClamp: 4,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
													whiteSpace: 'normal',
												}
											: {}),
									}}
								>
									<Text varient='body2'>{getDisplayValue(field.value)}</Text>
								</Box>
								{field.truncate && (
									<Box
										style={{ cursor: 'pointer', marginTop: 6, textAlign: 'end' }}
										onClick={() =>
											setExpanded((prev) => ({
												...prev,
												[field.label]: !prev[field.label],
											}))
										}
									>
										<Text varient='caption' styles={{ color: '#2563eb' }}>
											{expanded[field.label] ? 'Show less' : 'Show more'}
										</Text>
									</Box>
								)}
							</Box>
						)
					}

					return (
						<Box
							key={`${title}-${field.label}`}
							display='flex'
							align='center'
							style={{
								justifyContent: 'space-between',
								gap: 12,
								marginBottom: 15,
							}}
						>
							<Box
								display='flex'
								align='center'
								style={{
									gap: 6,
									minWidth: 0,
								}}
							>
								{field.icon && (
									<Box
										style={{
											display: 'flex',
											alignItems: 'center',
											color: '#667085',
											flexShrink: 0,
										}}
									>
										{field.icon}
									</Box>
								)}

								<Text varient='caption' secondary>
									{field.label}
								</Text>
							</Box>

							<Box
								style={{
									textAlign: 'right',
									maxWidth: '60%',
									wordBreak: 'break-word',
								}}
							>
								<Text varient='body2' weight='medium'>
									{renderValue(field)}
								</Text>
							</Box>
						</Box>
					)
				})}
			</Box>
		</Box>
	)
}

const decisionColor: Record<string, string> = {
	approve: '#16a34a',
	reject: '#dc2626',
	review: '#d97706',
}

const priorityColor: Record<string, string> = {
	high: '#16a34a',
	medium: '#d97706',
	low: '#667085',
}

const AiSectionBlock = ({ ai }: { ai: AiResponse }) => (
	<Box display='flex' flexDirection='column' style={{ padding: '14px 26px', gap: 14 }}>
		<Text varient='body2' weight='bold'>
			AI Analysis
		</Text>

		{ai.short_summary && (
			<Box display='flex' flexDirection='column' style={{ gap: 4 }}>
				<Text varient='caption' secondary>
					Summary
				</Text>
				<Text varient='body2'>{ai.short_summary}</Text>
			</Box>
		)}

		<Box display='flex' style={{ gap: 8, flexWrap: 'wrap' }}>
			{ai.decision && (
				<Box
					style={{
						padding: '4px 14px',
						borderRadius: 999,
						background: decisionColor[ai.decision] ?? '#e5e7eb',
						color: '#fff',
						fontSize: 12,
						fontWeight: 600,
					}}
				>
					{ai.decision.charAt(0).toUpperCase() + ai.decision.slice(1)}
				</Box>
			)}
			{ai.priority && (
				<Box
					style={{
						padding: '4px 14px',
						borderRadius: 999,
						background: priorityColor[ai.priority] ?? '#e5e7eb',
						color: '#fff',
						fontSize: 12,
						fontWeight: 600,
					}}
				>
					{ai.priority.charAt(0).toUpperCase() + ai.priority.slice(1)} Priority
				</Box>
			)}
			{ai.hard_stop && (
				<Box
					style={{
						padding: '4px 14px',
						borderRadius: 999,
						background: '#dc2626',
						color: '#fff',
						fontSize: 12,
						fontWeight: 600,
					}}
				>
					Hard Stop
				</Box>
			)}
		</Box>

		{ai.subscores && Object.keys(ai.subscores).length > 0 && (
			<Box display='flex' flexDirection='column' style={{ gap: 4 }}>
				<Text varient='caption' secondary>
					Subscores
				</Text>
				{Object.entries(ai.subscores).map(([key, val]) => (
					<Box
						key={key}
						display='flex'
						align='center'
						style={{ justifyContent: 'space-between', padding: '3px 0' }}
					>
						<Text varient='body2' styles={{ textTransform: 'capitalize' }}>
							{key.replace(/_/g, ' ')}
						</Text>
						<Text varient='body2' weight='bold'>
							{String(val)}
						</Text>
					</Box>
				))}
			</Box>
		)}

		{ai.reasons && ai.reasons.length > 0 && (
			<Box display='flex' flexDirection='column' style={{ gap: 4 }}>
				<Text varient='caption' secondary>
					Reasons
				</Text>
				<ul style={{ margin: 0, paddingLeft: 18 }}>
					{ai.reasons.map((r, i) => (
						<li key={i} style={{ marginBottom: 4 }}>
							<Text varient='body2'>{r}</Text>
						</li>
					))}
				</ul>
			</Box>
		)}

		{ai.red_flags && ai.red_flags.length > 0 && (
			<Box display='flex' flexDirection='column' style={{ gap: 4 }}>
				<Text varient='caption' styles={{ color: '#dc2626' }}>
					Red Flags
				</Text>
				<ul style={{ margin: 0, paddingLeft: 18 }}>
					{ai.red_flags.map((r, i) => (
						<li key={i} style={{ marginBottom: 4 }}>
							<Text varient='body2'>{r}</Text>
						</li>
					))}
				</ul>
			</Box>
		)}
	</Box>
)

const DetailsPopover = ({ lead, proposal, jobPost, label = 'Details' }: DetailsPopoverProps) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

	const open = Boolean(anchorEl)

	const sections = useMemo<DetailSection[]>(
		() => [
			{
				title: 'Job Post',
				fields: mapJobPostToFields(jobPost),
			},
			{
				title: 'Proposal',
				fields: mapProposalToFields(proposal),
			},
			...(lead
				? [{ title: 'Lead', fields: mapLeadToFields(lead) }]
				: []),
		],
		[lead, proposal, jobPost]
	)

	const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget)
	}

	const handleClose = () => {
		setAnchorEl(null)
	}

	return (
		<>
			<Box
				onClick={handleOpen}
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: 8,
					height: 40,
					padding: '0 14px',
					borderRadius: 12,
					marginRight: 15,
					background: '#f8fafc',
					border: '1px solid #dbe3ef',
					cursor: 'pointer',
					userSelect: 'none',
					boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
				}}
			>
				<InfoOutlined
					style={{
						fontSize: 18,
						color: '#667085',
						flexShrink: 0,
					}}
				/>

				<Text varient='body2' weight='bold'>
					{label}
				</Text>

				<KeyboardArrowDownRounded
					style={{
						fontSize: 18,
						color: '#667085',
						flexShrink: 0,
					}}
				/>
			</Box>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
				transformOrigin={{ horizontal: 'right', vertical: 'top' }}
				slotProps={{
					paper: {
						style: {
							width: 620,
							maxWidth: 'calc(100vw - 32px)',
							maxHeight: '70vh',
							borderRadius: 20,
							padding: 0,
							overflow: 'hidden',
							boxShadow: '0 18px 50px rgba(16, 24, 40, 0.16)',
							border: '1px solid #e5e7eb',
						},
					},
				}}
			>
				<Box
					display='flex'
					flexDirection='column'
					style={{
						minWidth: 420,
						maxWidth: '100%',
						maxHeight: '70vh',
					}}
				>
					<Box
						display='flex'
						align='center'
						px={16}
						py={14}
						style={{
							justifyContent: 'space-between',
							background: '#fcfcfd',
							flexShrink: 0,
							borderBottom: '1px solid #e5e7eb',
						}}
					>
						<Text varient='body2' weight='bold'>
							Detailed Information
						</Text>

						<Text varient='caption' secondary>
							Lead • Proposal • Job Post
						</Text>
					</Box>

					<Box
						style={{
							overflowY: 'auto',
							maxHeight: 'calc(70vh - 58px)',
						}}
					>
						{sections.map((section, index) => (
							<React.Fragment key={section.title}>
								<SectionBlock title={section.title} fields={section.fields} />
								{(index !== sections.length - 1 || jobPost?.aiResponse) && <Divider />}
							</React.Fragment>
						))}
						{jobPost?.aiResponse && <AiSectionBlock ai={jobPost.aiResponse} />}
					</Box>
				</Box>
			</Menu>
		</>
	)
}

export default DetailsPopover
