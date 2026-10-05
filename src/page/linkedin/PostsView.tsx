import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	ArticleOutlined,
	EditOutlined,
	OpenInNewOutlined,
	ArrowBackRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import PermissionGate from '../../components/auth/PermissionGate'
import { useGetLinkedInPostByIdQuery } from '../../store/linkedin-posts/linkedInPostsApi'
import type { LinkedInPostStatus } from '../../store/linkedin-posts/linkedInPostsApi'

const STATUS_META: Record<
	LinkedInPostStatus,
	{ label: string; bg: string; color: string }
> = {
	DRAFT: { label: 'Draft', bg: 'rgba(15, 23, 42, 0.08)', color: '#64748b' },
	READY: { label: 'Ready', bg: 'rgba(3, 105, 161, 0.14)', color: '#0369a1' },
	SCHEDULED: {
		label: 'Scheduled',
		bg: 'rgba(217, 119, 6, 0.15)',
		color: '#b45309',
	},
	PUBLISHED: {
		label: 'Published',
		bg: 'rgba(16, 185, 129, 0.15)',
		color: '#059669',
	},
	ARCHIVED: {
		label: 'Archived',
		bg: 'rgba(217, 34, 113, 0.10)',
		color: '#9d174d',
	},
}

const fmtDate = (iso: string | null | undefined): string => {
	if (!iso) return '—'
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return '—'
	return d.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

const PostView = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { data: post, isLoading, isError } = useGetLinkedInPostByIdQuery(id!, {
		skip: !id,
	})

	if (isLoading) return <Shell>Loading…</Shell>
	if (isError || !post) return <Shell>Post not found.</Shell>

	return (
		<Shell>
			<TopBar>
				<BackBtn type='button' onClick={() => navigate('/linkedin/posts')}>
					<ArrowBackRounded style={{ fontSize: 16 }} /> Back to posts
				</BackBtn>
				<TopActions>
					{post.linkedInUrl && (
						<GhostBtn
							as='a'
							href={post.linkedInUrl}
							target='_blank'
							rel='noreferrer noopener'
						>
							<OpenInNewOutlined style={{ fontSize: 16 }} /> Open on LinkedIn
						</GhostBtn>
					)}
					<PermissionGate permission='linkedin_posts:update'>
						<PrimaryBtn
							type='button'
							onClick={() => navigate(`/linkedin/posts/edit/${post.id}`)}
						>
							<EditOutlined style={{ fontSize: 16 }} /> Edit
						</PrimaryBtn>
					</PermissionGate>
				</TopActions>
			</TopBar>

			<HeroCard>
				<HeroHead>
					<HeroIcon>
						<ArticleOutlined />
					</HeroIcon>
					<HeroMeta>
						<HeroLabel>LinkedIn post</HeroLabel>
						<HeroTitle>{post.internalTitle}</HeroTitle>
					</HeroMeta>
					<StatusPill
						$bg={STATUS_META[post.status].bg}
						$color={STATUS_META[post.status].color}
					>
						{STATUS_META[post.status].label}
					</StatusPill>
				</HeroHead>

				<KVGrid>
					<KV>
						<KLabel>Account</KLabel>
						<KVal>{post.account?.displayName ?? '—'}</KVal>
					</KV>
					<KV>
						<KLabel>Format</KLabel>
						<KVal>
							{post.format.charAt(0) + post.format.slice(1).toLowerCase()}
						</KVal>
					</KV>
					<KV>
						<KLabel>Language</KLabel>
						<KVal>{post.language}</KVal>
					</KV>
					<KV>
						<KLabel>Author</KLabel>
						<KVal>
							{post.author
								? `${post.author.firstName} ${post.author.lastName}`
								: '—'}
						</KVal>
					</KV>
					<KV>
						<KLabel>Scheduled</KLabel>
						<KVal>{fmtDate(post.scheduledAt)}</KVal>
					</KV>
					<KV>
						<KLabel>Published</KLabel>
						<KVal>{fmtDate(post.publishedAt)}</KVal>
					</KV>
					<KV>
						<KLabel>Audience</KLabel>
						<KVal>{post.targetAudience ?? '—'}</KVal>
					</KV>
					<KV>
						<KLabel>Pillar</KLabel>
						<KVal>{post.contentPillar ?? '—'}</KVal>
					</KV>
				</KVGrid>

				{post.idea && (
					<IdeaLink type='button' onClick={() => navigate(`/linkedin/ideas/${post.idea!.id}`)}>
						<span>Source idea</span>
						<strong>{post.idea.title}</strong>
					</IdeaLink>
				)}
			</HeroCard>

			{post.hook && (
				<SectionCard>
					<SectionTitle>Hook</SectionTitle>
					<Hook>“{post.hook}”</Hook>
				</SectionCard>
			)}

			<SectionCard>
				<SectionTitle>Body</SectionTitle>
				<ContentBody>{post.body}</ContentBody>
			</SectionCard>

			{post.firstComment && (
				<SectionCard>
					<SectionTitle>First comment</SectionTitle>
					<ContentBody>{post.firstComment}</ContentBody>
				</SectionCard>
			)}

			{post.hashtags.length > 0 && (
				<SectionCard>
					<SectionTitle>Hashtags</SectionTitle>
					<TagsRow>
						{post.hashtags.map((t) => (
							<TagChip key={t}>#{t}</TagChip>
						))}
					</TagsRow>
				</SectionCard>
			)}

			<SectionCard>
				<SectionTitle>Performance</SectionTitle>
				<PerfGrid>
					<PerfCell>
						<PerfLabel>Impressions</PerfLabel>
						<PerfVal>{post.impressions.toLocaleString('en-US')}</PerfVal>
					</PerfCell>
					<PerfCell>
						<PerfLabel>Reactions</PerfLabel>
						<PerfVal>{post.reactions.toLocaleString('en-US')}</PerfVal>
					</PerfCell>
					<PerfCell>
						<PerfLabel>Comments</PerfLabel>
						<PerfVal>{post.comments.toLocaleString('en-US')}</PerfVal>
					</PerfCell>
					<PerfCell>
						<PerfLabel>Reposts</PerfLabel>
						<PerfVal>{post.reposts.toLocaleString('en-US')}</PerfVal>
					</PerfCell>
					<PerfCell>
						<PerfLabel>Clicks</PerfLabel>
						<PerfVal>{post.clicks.toLocaleString('en-US')}</PerfVal>
					</PerfCell>
					<PerfCell>
						<PerfLabel>Followers gained</PerfLabel>
						<PerfVal>{post.followersGained.toLocaleString('en-US')}</PerfVal>
					</PerfCell>
					<PerfCell>
						<PerfLabel>Leads generated</PerfLabel>
						<PerfVal>{post.leadsGenerated.toLocaleString('en-US')}</PerfVal>
					</PerfCell>
					<PerfCell $primary>
						<PerfLabel>Engagement rate</PerfLabel>
						<PerfVal $primary>
							{post.impressions > 0
								? `${post.engagementRate.toFixed(2)}%`
								: '—'}
						</PerfVal>
					</PerfCell>
				</PerfGrid>
			</SectionCard>

			{post.note && (
				<SectionCard>
					<SectionTitle>Internal note</SectionTitle>
					<NoteBody>{post.note}</NoteBody>
				</SectionCard>
			)}
		</Shell>
	)
}

export default PostView

const Shell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
	max-width: 960px;
	margin: 0 auto;
`

const TopBar = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
`

const BackBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 999px;
	background: transparent;
	border: 1.5px solid rgba(15, 23, 42, 0.08);
	color: ${T.textSecondary};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	text-transform: none;
	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`

const TopActions = styled.div`
	display: inline-flex;
	gap: 8px;
`

const PrimaryBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 10px 18px;
	border-radius: 999px;
	border: none;
	background: ${T.primary};
	color: #ffffff;
	font: inherit;
	font-size: 13.5px;
	font-weight: 600;
	cursor: pointer;
	text-transform: none;
	text-decoration: none;
	transition: transform 200ms ease;
	&:hover {
		transform: translateY(-1px);
	}
`

const GhostBtn = styled(PrimaryBtn)`
	background: transparent;
	color: ${T.primary};
	border: 1.5px solid ${T.primary};
`

const HeroCard = styled.section`
	background: #ffffff;
	border-radius: 18px;
	padding: 26px 30px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 10px 26px rgba(15, 23, 42, 0.06);
`

const HeroHead = styled.div`
	display: flex;
	gap: 14px;
	align-items: flex-start;
`

const HeroIcon = styled.div`
	width: 44px;
	height: 44px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;
`

const HeroMeta = styled.div`
	flex: 1;
	min-width: 0;
`

const HeroLabel = styled.div`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.7px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const HeroTitle = styled.h1`
	margin: 4px 0 0;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 26px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.6px;
	line-height: 1.2;
`

const StatusPill = styled.span<{ $bg: string; $color: string }>`
	align-self: flex-start;
	padding: 4px 12px;
	border-radius: 999px;
	background: ${({ $bg }) => $bg};
	color: ${({ $color }) => $color};
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
`

const KVGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 14px 20px;
	margin-top: 22px;
	padding-top: 20px;
	border-top: 1px solid rgba(15, 23, 42, 0.08);
`

const KV = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
`

const KLabel = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const KVal = styled.span`
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
`

const IdeaLink = styled.button`
	display: flex;
	flex-direction: column;
	gap: 3px;
	margin-top: 22px;
	padding: 12px 16px;
	border-radius: 10px;
	background: ${T.primaryTint};
	border: none;
	text-align: left;
	cursor: pointer;
	font: inherit;
	transition: background 160ms ease;
	& > span {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.55px;
		text-transform: uppercase;
		color: ${T.primary};
	}
	& > strong {
		font-size: 14px;
		font-weight: 600;
		color: ${T.textStrong};
	}
	&:hover {
		background: rgba(3, 105, 161, 0.16);
	}
`

const SectionCard = styled.section`
	background: #ffffff;
	border-radius: 16px;
	padding: 22px 26px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 6px 18px rgba(15, 23, 42, 0.05);
`

const SectionTitle = styled.h2`
	margin: 0 0 14px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 16px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.3px;
`

const Hook = styled.blockquote`
	margin: 0;
	padding: 12px 16px;
	border-left: 3px solid ${T.primary};
	background: ${T.primaryTint};
	color: ${T.textStrong};
	font-style: italic;
	font-size: 15px;
	line-height: 1.5;
	border-radius: 4px;
`

const ContentBody = styled.div`
	font-size: 14px;
	line-height: 1.6;
	color: ${T.textStrong};
	white-space: pre-wrap;
`

const NoteBody = styled(ContentBody)`
	color: ${T.textSecondary};
	font-size: 13.5px;
`

const TagsRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const TagChip = styled.span`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${T.primaryTint};
	color: ${T.primary};
	font-size: 12px;
	font-weight: 600;
`

const PerfGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 12px;
`

const PerfCell = styled.div<{ $primary?: boolean }>`
	padding: 14px 16px;
	border-radius: 12px;
	background: ${({ $primary }) => ($primary ? T.primaryTint : '#f8fafc')};
	border: 1.5px solid
		${({ $primary }) =>
			$primary ? 'rgba(3, 105, 161, 0.3)' : 'transparent'};
`

const PerfLabel = styled.div`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const PerfVal = styled.div<{ $primary?: boolean }>`
	margin-top: 4px;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 18px;
	font-weight: 700;
	color: ${({ $primary }) => ($primary ? T.primary : T.textStrong)};
	letter-spacing: -0.3px;
`
