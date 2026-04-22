import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowBackOutlined, OpenInNewOutlined, RocketLaunchOutlined } from '@mui/icons-material'
import { Chip } from '@mui/material'
import Box from '../../../components/box/Box'
import Card from '../../../components/card/Card'
import JobPostDecisionChip from '../../../components/job-posts/list/JobPostDecisionChip'
import JobPostPriorityChip from '../../../components/job-posts/list/JobPostPriorityChip'
import JobPostToProposalModal from '../../../components/job-posts/JobPostToProposalModal'
import { Button, Text, IconButton } from '../../../ui'
import { useGetJobPostByIdQuery } from '../../../store/job-posts/jobPostsApi'
import { formatDate } from '../../../utils/formatDate'

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
	<Box display='flex' align='flex-start' space={2} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
		<Text secondary styles={{ minWidth: 180, flexShrink: 0 }}>{label}</Text>
		<Box>{value}</Box>
	</Box>
)

const JobPostPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [showModal, setShowModal] = useState(false)

	const { data: post, isLoading, isError } = useGetJobPostByIdQuery(id!, { skip: !id })

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
				<Box style={{ maxWidth: 900, margin: '0 auto' }} display='flex' flexDirection='column' align='center' space={3}>
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
				{/* Start Proposal button */}
				<Box display='flex' justify='flex-end' mb={3}>
					<Button
						styles={{ display: 'flex', alignItems: 'center', gap: 6 }}
						onClick={() => setShowModal(true)}
					>
						<RocketLaunchOutlined style={{ fontSize: 16 }} />
						Start Proposal
					</Button>
				</Box>

				{/* Header */}
				<Box display='flex' flexDirection='column' space={2} mb={4}>
					<Box display='flex' align='flex-start' space={3}>
						<IconButton varient='text' size={34} fontSize={20} onClick={() => navigate('/job-posts/list/')}>
							<ArrowBackOutlined />
						</IconButton>
						<Box style={{ flex: 1 }}>
							<Text heading='h5'>{post.title ?? 'Job Post'}</Text>
							<Text varient='caption' secondary styles={{ marginTop: 4, display: 'block' }}>
								{formatDate(post.createdAt)}
								{post.processedAt && ` · processed ${formatDate(post.processedAt)}`}
							</Text>
						</Box>
						{post.jobUrl && (
							<a href={post.jobUrl} target='_blank' rel='noreferrer'>
								<Button varient='outlined' color='info' styles={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<OpenInNewOutlined style={{ fontSize: 16 }} />
									Open Job
								</Button>
							</a>
						)}
					</Box>

					<Box display='flex' align='center' space={2} style={{ flexWrap: 'wrap', gap: 8, paddingLeft: 46 }}>
						<JobPostDecisionChip decision={post.decision} />
						<JobPostPriorityChip priority={post.priority} />
						{post.matchScore != null && (
							<Chip label={`Score: ${post.matchScore}`} size='small' variant='outlined' />
						)}
					</Box>
				</Box>

				{/* Main info */}
				<Box mb={4}>
					<Text heading='h6' styles={{ marginBottom: 8 }}>Details</Text>
					<Row label='Location' value={<Text>{post.location ?? '—'}</Text>} />
					<Row label='Budget' value={<Text>{post.budget ?? '—'}</Text>} />
					<Row label='Scanner' value={<Text>{post.scanner ?? '—'}</Text>} />
					<Row label='GigRadar Score' value={<Text>{post.gigRadarScore ?? '—'}</Text>} />
					<Row label='Total Spent' value={<Text>{post.totalSpent != null ? `$${post.totalSpent.toLocaleString()}` : '—'}</Text>} />
					<Row label='Avg Rate Paid' value={<Text>{post.avgRatePaid != null ? `$${post.avgRatePaid}/hr` : '—'}</Text>} />
					<Row label='Hire Rate' value={<Text>{post.hireRate != null ? `${post.hireRate}%` : '—'}</Text>} />
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
					<Box mb={4}>
						<Text heading='h6' styles={{ marginBottom: 8 }}>AI Analysis</Text>
						{ai.short_summary && (
							<Box mb={3}>
								<Text secondary styles={{ marginBottom: 4 }}>Summary</Text>
								<Text>{ai.short_summary}</Text>
							</Box>
						)}

						{ai.subscores && (
							<Box mb={3}>
								<Text secondary styles={{ marginBottom: 8 }}>Subscores</Text>
								{Object.entries(ai.subscores).map(([key, val]) => (
									<Box key={key} display='flex' align='center' justify='space-between' style={{ padding: '4px 0' }}>
										<Text styles={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Text>
										<Text>{String(val)}</Text>
									</Box>
								))}
							</Box>
						)}

						{ai.reasons && ai.reasons.length > 0 && (
							<Box mb={3}>
								<Text secondary styles={{ marginBottom: 4 }}>Reasons</Text>
								<ul style={{ margin: 0, paddingLeft: 20 }}>
									{ai.reasons.map((r: string, i: number) => (
										<li key={i}><Text>{r}</Text></li>
									))}
								</ul>
							</Box>
						)}

						{ai.red_flags && ai.red_flags.length > 0 && (
							<Box mb={3}>
								<Text secondary styles={{ marginBottom: 4 }}>Red Flags</Text>
								<ul style={{ margin: 0, paddingLeft: 20 }}>
									{ai.red_flags.map((r: string, i: number) => (
										<li key={i}><Text>{r}</Text></li>
									))}
								</ul>
							</Box>
						)}
					</Box>
				)}

				{/* Raw text */}
				{post.rawText && (
					<Box>
						<Text heading='h6' styles={{ marginBottom: 8 }}>Raw Text</Text>
						<Box style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: 16 }}>
							<Text styles={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{post.rawText}</Text>
						</Box>
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
