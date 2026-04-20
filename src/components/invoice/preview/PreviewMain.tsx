import {
	PersonOutlined,
	BusinessOutlined,
	CalendarTodayOutlined,
	SendOutlined,
	FlashOnOutlined,
	LinkOutlined,
	ContentCopy,
	OpenInNew,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import Box from '../../box/Box'
import { Text, Chip, Divider, IconButton } from '../../../ui'
import { GridInnerContainer, GridItem } from '../../layout'
import { formatDate } from '../../../utils/formatDate'
import type { ProposalItem } from '../../../store/proposals/types/definition'

const SectionLabel = ({ children }: { children: string }) => (
	<Text
		varient='caption'
		weight='medium'
		secondary
		style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
	>
		{children}
	</Text>
)

const InfoRow = ({
	icon,
	label,
	children,
}: {
	icon: React.ReactNode
	label: string
	children: React.ReactNode
}) => (
	<Box display='flex' align='center' space={2} style={{ minHeight: 36 }}>
		<Box
			display='flex'
			align='center'
			space={1}
			style={{ minWidth: 140, color: 'var(--text-secondary, #8A8D93)' }}
		>
			{icon}
			<Text varient='body2' secondary>
				{label}
			</Text>
		</Box>
		<Box>{children}</Box>
	</Box>
)

const TextBlock = ({ children }: { children: string }) => (
	<Box style={{ borderLeft: '3px solid #e0e0e0', paddingLeft: 14, marginTop: 8 }}>
		<Text varient='body2' styles={{ whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>
			{children}
		</Text>
	</Box>
)

interface Props {
	proposal: ProposalItem
}

const PreviewMain = ({ proposal }: Props) => {
	const copy = (text: string) => navigator.clipboard.writeText(text)

	return (
		<Box pt={4} pb={35} display='flex' flexDirection='column' space={2}>
			{/* ── Details ── */}
			<Box display='flex' flexDirection='column' space={3}>
				<SectionLabel>Details</SectionLabel>
				<GridInnerContainer spacing={1}>
					<GridItem xs={12} md={6}>
						<InfoRow icon={<PersonOutlined style={{ fontSize: 18 }} />} label='Manager'>
							<Text varient='body2'>
								{proposal.user.firstName} {proposal.user.lastName}
							</Text>
						</InfoRow>
					</GridItem>

					<GridItem xs={12} md={6}>
						<InfoRow
							icon={<BusinessOutlined style={{ fontSize: 18 }} />}
							label='Developer acc'
						>
							<Text varient='body2'>
								{proposal.account.firstName} {proposal.account.lastName}
							</Text>
						</InfoRow>
					</GridItem>

					<GridItem xs={12} md={12}>
						<InfoRow
							icon={<CalendarTodayOutlined style={{ fontSize: 18 }} />}
							label='PLatform'
						>
							<Text varient='body2'>{proposal.platform.title}</Text>
							<img
								src={proposal.platform.imageUrl}
								alt='platformIcon'
								style={{ maxWidth: 25 }}
							/>
						</InfoRow>
					</GridItem>

					<GridItem xs={12} md={6}>
						<InfoRow
							icon={<CalendarTodayOutlined style={{ fontSize: 18 }} />}
							label='Created'
						>
							<Text varient='body2'>{formatDate(proposal.createdAt)}</Text>
						</InfoRow>
					</GridItem>

					<GridItem xs={12} md={6}>
						<InfoRow icon={<SendOutlined style={{ fontSize: 18 }} />} label='Sent At'>
							<Text varient='body2'>
								{proposal.sentAt ? formatDate(proposal.sentAt) : '—'}
							</Text>
						</InfoRow>
					</GridItem>

					<GridItem xs={12} md={6}>
						<InfoRow icon={<FlashOnOutlined style={{ fontSize: 18 }} />} label='Connects'>
							<Chip
								label={String(proposal.connects)}
								skin='light'
								size='small'
								color='info'
								styles={{ color: '#000000' }}
							/>
						</InfoRow>
					</GridItem>

					<GridItem xs={12} md={6}>
						<InfoRow
							icon={<FlashOnOutlined style={{ fontSize: 18 }} />}
							label='Boosted connects'
						>
							<Chip
								label={String(proposal.boostedConnects)}
								skin='light'
								size='small'
								color='info'
								styles={{ color: '#000000' }}
							/>
						</InfoRow>
					</GridItem>

					{proposal.jobUrl && (
						<GridItem xs={12}>
							<InfoRow icon={<LinkOutlined style={{ fontSize: 18 }} />} label='Job URL'>
								<Box display='flex' align='center' space={1}>
									<a
										href={`${proposal.jobUrl}`}
										target='_blank'
										rel='noopener noreferrer'
										style={{ wordBreak: 'break-all' }}
									>
										<Text varient='body2' skinColor>
											{proposal.jobUrl}
										</Text>
									</a>
									<Tooltip title='Copy URL'>
										<span>
											<IconButton
												varient='text'
												size={26}
												fontSize={16}
												contentOpacity={5}
												onClick={() => copy(proposal.jobUrl!)}
											>
												<ContentCopy style={{ fontSize: 14 }} />
											</IconButton>
										</span>
									</Tooltip>
								</Box>
							</InfoRow>
						</GridItem>
					)}

					{proposal?.lead?.id && (
						<GridItem xs={12}>
							<InfoRow icon={<LinkOutlined style={{ fontSize: 18 }} />} label='Lead URL'>
								<Box display='flex' align='center' space={1}>
									<a
										href={`${import.meta.env.VITE_APP_URL}/leads/preview/${proposal.lead?.id}`}
										target='_blank'
										rel='noopener noreferrer'
										style={{ wordBreak: 'break-all' }}
									>
										<Text varient='body2' skinColor>
											{`${import.meta.env.VITE_APP_URL}/leads/preview/${proposal.lead?.id}`}
										</Text>
									</a>
									<Tooltip title='Copy URL'>
										<span>
											<IconButton
												varient='text'
												size={26}
												fontSize={16}
												contentOpacity={5}
												onClick={() =>
													copy(
														`${import.meta.env.VITE_APP_URL}/leads/preview/${proposal.lead?.id}`
													)
												}
											>
												<ContentCopy style={{ fontSize: 14 }} />
											</IconButton>
										</span>
									</Tooltip>
									<a
										href={`${import.meta.env.VITE_APP_URL}/leads/preview/${proposal.lead?.id}`}
										target='_blank'
										rel='noopener noreferrer'
									>
										<IconButton varient='text' size={26} fontSize={16} contentOpacity={5}>
											<OpenInNew style={{ fontSize: 14 }} />
										</IconButton>
									</a>
								</Box>
							</InfoRow>
						</GridItem>
					)}
				</GridInnerContainer>
			</Box>

			{/* ── Content sections ── */}
			{proposal.vacancy && (
				<>
					<Divider />
					<Box display='flex' flexDirection='column' space={1}>
						<SectionLabel>Vacancy Description</SectionLabel>
						<TextBlock>{proposal.vacancy}</TextBlock>
					</Box>
				</>
			)}

			{proposal.coverLetter && (
				<>
					<Divider />
					<Box display='flex' flexDirection='column' space={1}>
						<SectionLabel>Cover Letter</SectionLabel>
						<TextBlock>{proposal.coverLetter}</TextBlock>
					</Box>
				</>
			)}
		</Box>
	)
}

export default PreviewMain
