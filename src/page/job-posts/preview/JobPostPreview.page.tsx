import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowBackOutlined, OpenInNewOutlined, RocketLaunchOutlined, ContentCopy } from '@mui/icons-material'
import { Chip, Tooltip } from '@mui/material'
import Box from '../../../components/box/Box'
import Card from '../../../components/card/Card'
import JobPostDecisionChip from '../../../components/job-posts/list/JobPostDecisionChip'
import JobPostPriorityChip from '../../../components/job-posts/list/JobPostPriorityChip'
import JobPostToProposalModal from '../../../components/job-posts/JobPostToProposalModal'
import { Button, Text, IconButton } from '../../../ui'
import { useGetJobPostByIdQuery } from '../../../store/job-posts/jobPostsApi'
import { formatDate } from '../../../utils/formatDate'


const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
	<Box
		display='flex'
		align='flex-start'
		space={2}
		style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
	>
		<Text secondary styles={{ minWidth: 180, flexShrink: 0 }}>
			{label}
		</Text>
		<Box>{value}</Box>
	</Box>
)

const JobPostPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [showModal, setShowModal] = useState(false)

	const { data: post, isLoading, isError } = useGetJobPostByIdQuery(id!, { skip: !id })

	const TextBlock = ({ children }: { children: string }) => (
		<Box style={{ borderLeft: '3px solid #e0e0e0', paddingLeft: 14, marginTop: 8 }}>
			<Text varient='body2' styles={{ whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>
				{children}
			</Text>
		</Box>
	)

	if (isLoading) {
		return (
			<Card py='2rem' px='2rem'>
				<Box style={{ maxWidth: 900, margin: '0 auto' }}>
					<Text secondary>Loading…</Text>
				</Box>
			</Card>
		)
	}

	if (isError || !post) {
		return (
			<Card py='2rem' px='2rem'>
				<Box
					style={{ maxWidth: 900, margin: '0 auto' }}
					display='flex'
					flexDirection='column'
					align='center'
					space={3}
				>
					<Text heading='h6'>Job post not found</Text>
					<Button varient='outlined' color='info' onClick={() => navigate('/job-posts/list/')}>
						Back to list
					</Button>
				</Box>
			</Card>
		)
	}

	const ai = post.aiResponse

	return (
		<Card py='2rem' px='2rem'>
			<Box style={{ maxWidth: 900, margin: '0 auto' }}>
				{/* Header */}
				<Box display='flex' flexDirection='column' space={2} mb={20}>
					{/* Row 1: back button + title + subtitle */}
					<Box display='flex' align='center' space={3}>
						<IconButton
							varient='text'
							size={34}
							fontSize={20}
							onClick={() => navigate('/job-posts/list/')}
						>
							<ArrowBackOutlined />
						</IconButton>
						<Box>
							<Text heading='h5'>{post.title ?? 'Job Post'}</Text>
							<Box display='flex' align='center' space={1} style={{ marginTop: 2 }}>
								<Text varient='caption' secondary>
									{formatDate(post.createdAt)}
									{post.processedAt && ` · processed ${formatDate(post.processedAt)}`}
								</Text>
							</Box>
						</Box>
					</Box>

					{/* Row 2: chips left, action buttons right */}
					<Box display='flex' align='center' justify='space-between'>
						<Box display='flex' align='center' space={2} style={{ flexWrap: 'wrap', gap: 8 }}>
							<JobPostDecisionChip decision={post.decision} />
							<JobPostPriorityChip priority={post.priority} />
							{post.matchScore != null && (
								<Chip label={`Score: ${post.matchScore}`} size='small' variant='outlined' />
							)}
						</Box>
						<Box display='flex' align='center' space={1}>
							{post.jobUrl && (
								<a href={post.jobUrl} target='_blank' rel='noreferrer'>
									<Button varient='outlined' color='info' styles={{ display: 'flex', alignItems: 'center', gap: 6 }}>
										<OpenInNewOutlined style={{ fontSize: 16 }} />
										Open Job
									</Button>
								</a>
							)}
							{!post.proposal?.id && (
								<Button
									styles={{ display: 'flex', alignItems: 'center', gap: 6 }}
									onClick={() => setShowModal(true)}
								>
									<RocketLaunchOutlined style={{ fontSize: 16 }} />
									Start Proposal
								</Button>
							)}
						</Box>
					</Box>
				</Box>

				{/* Main info */}
				<Box mb={15}>
					<Text heading='h6' styles={{ marginBottom: 8 }}>
						Details
					</Text>
					<Row label='Location' value={<Text varient='body2'>{post.location ?? '—'}</Text>} />
					<Row label='Budget' value={<Text varient='body2'>{post.budget ?? '—'}</Text>} />
					<Row label='Scanner' value={<Text varient='body2'>{post.scanner ?? '—'}</Text>} />
					<Row label='GigRadar Score' value={<Text varient='body2'>{post.gigRadarScore ?? '—'}</Text>} />
					<Row
						label='Total Spent'
						value={
							<Text varient='body2'>
								{post.totalSpent != null ? `$${post.totalSpent.toLocaleString()}` : '—'}
							</Text>
						}
					/>
					<Row
						label='Avg Rate Paid'
						value={<Text varient='body2'>{post.avgRatePaid != null ? `$${post.avgRatePaid}/hr` : '—'}</Text>}
					/>
					<Row
						label='Hire Rate'
						value={<Text varient='body2'>{post.hireRate != null ? `${post.hireRate}%` : '—'}</Text>}
					/>
					{post.proposal?.id && (
						<Row
							label='Proposal'
							value={
								<Box display='flex' align='center' space={1}>
									<a
										href={`${import.meta.env.VITE_APP_URL}/proposal/preview/${post.proposal.id}`}
										target='_blank'
										rel='noopener noreferrer'
										style={{ wordBreak: 'break-all' }}
									>
										<Text varient='body2' skinColor>
											{`${import.meta.env.VITE_APP_URL}/proposal/preview/${post.proposal.id}`}
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
													navigator.clipboard.writeText(
														`${import.meta.env.VITE_APP_URL}/proposals/preview/${post.proposal!.id}`
													)
												}
											>
												<ContentCopy style={{ fontSize: 14 }} />
											</IconButton>
										</span>
									</Tooltip>
								</Box>
							}
						/>
					)}
					{post.hSkillsKeywords.length > 0 && (
						<Row
							label='Keywords'
							value={
								<Box display='flex' style={{ flexWrap: 'wrap', gap: 6 }}>
									{post.hSkillsKeywords.map((kw) => (
										<Chip key={kw} label={kw} size='small' variant='outlined' />
									))}
								</Box>
							}
						/>
					)}
				</Box>

				{/* AI Analysis */}
				{ai && (
					<Box mb={20}>
						<Text heading='h6' styles={{ marginBottom: 8 }}>
							AI Analysis
						</Text>
						{ai.short_summary && (
							<Row
								label='Summary'
								value={<Text varient='body2' styles={{ whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>
									{ai.short_summary}
								</Text>}
							/>
						)}
						{ai.subscores && (
							<Row
								label='Subscores'
								value={
									<Box>
										{Object.entries(ai.subscores).map(([key, val]) => (
											<Box
												key={key}
												display='flex'
												align='center'
												justify='space-between'
												space={2}
												style={{ padding: '2px 0' }}
											>
												<Text varient='body2' styles={{ textTransform: 'capitalize', whiteSpace: 'pre-wrap', lineHeight: '1.75' }} >
													{key.replace(/_/g, ' ')}
												</Text>
												<Text varient='body2' styles={{ whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>{String(val)}</Text>
											</Box>
										))}
									</Box>
								}
							/>
						)}
						{ai.reasons && ai.reasons.length > 0 && (
							<Row
								label='Reasons'
								value={
									<ul style={{ margin: 0, paddingLeft: 0 }}>
										{ai.reasons.map((r: string, i: number) => (
											<Text varient='body2' styles={{ whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>
												{r}
											</Text>
										))}
									</ul>
								}
							/>
						)}
						{ai.red_flags && ai.red_flags.length > 0 && (
							<Row
								label='Red Flags'
								value={
									<ul style={{ margin: 0, paddingLeft: 0 }}>
										{ai.red_flags.map((r: string, i: number) => (
											<Text varient='body2' styles={{ whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>
												{r}
											</Text>
										))}
									</ul>
								}
							/>
						)}
					</Box>
				)}

				{/* Raw text */}
				{post.rawText && (
					<Box>
						<Text heading='h6' styles={{ marginBottom: 20 }}>
							Raw Text
						</Text>

							<TextBlock>{post.rawText}</TextBlock>

					</Box>
				)}
			</Box>

			{showModal && (
				<JobPostToProposalModal
					id={id!}
					onClose={() => setShowModal(false)}
					onSuccess={() => navigate('/proposals')}
				/>
			)}
		</Card>
	)
}

export default JobPostPreview
