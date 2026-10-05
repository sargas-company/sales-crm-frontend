import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	LightbulbOutlined,
	EditOutlined,
	ArrowForwardRounded,
	OpenInNewOutlined,
	ArrowBackRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import PermissionGate from '../../components/auth/PermissionGate'
import { useGetLinkedInIdeaByIdQuery } from '../../store/linkedin-ideas/linkedInIdeasApi'
import type {
	LinkedInIdeaPriority,
	LinkedInIdeaStatus,
} from '../../store/linkedin-ideas/linkedInIdeasApi'

const STATUS_META: Record<
	LinkedInIdeaStatus,
	{ label: string; bg: string; color: string }
> = {
	NEW: { label: 'New', bg: 'rgba(3, 105, 161, 0.14)', color: '#0369a1' },
	IN_PROGRESS: {
		label: 'In progress',
		bg: 'rgba(217, 119, 6, 0.14)',
		color: '#b45309',
	},
	CONVERTED: {
		label: 'Converted',
		bg: 'rgba(16, 185, 129, 0.15)',
		color: '#059669',
	},
	ARCHIVED: {
		label: 'Archived',
		bg: 'rgba(15, 23, 42, 0.06)',
		color: '#64748b',
	},
}

const PRIORITY_LABEL: Record<LinkedInIdeaPriority, string> = {
	LOW: 'Low',
	MEDIUM: 'Medium',
	HIGH: 'High',
}

const fmtDate = (iso: string | null | undefined): string => {
	if (!iso) return '—'
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return '—'
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

const IdeaView = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { data: idea, isLoading, isError } = useGetLinkedInIdeaByIdQuery(id!, {
		skip: !id,
	})

	if (isLoading) return <Shell>Loading…</Shell>
	if (isError || !idea) return <Shell>Idea not found.</Shell>

	return (
		<Shell>
			<TopBar>
				<BackBtn type='button' onClick={() => navigate('/linkedin/ideas')}>
					<ArrowBackRounded style={{ fontSize: 16 }} /> Back to ideas
				</BackBtn>
				<TopActions>
					<PermissionGate permission='linkedin_posts:create'>
						<PrimaryBtn
							type='button'
							onClick={() => navigate(`/linkedin/posts/add?ideaId=${idea.id}`)}
						>
							<ArrowForwardRounded style={{ fontSize: 16 }} />
							Create post from idea
						</PrimaryBtn>
					</PermissionGate>
					<PermissionGate permission='linkedin_ideas:update'>
						<GhostBtn
							type='button'
							onClick={() => navigate(`/linkedin/ideas/edit/${idea.id}`)}
						>
							<EditOutlined style={{ fontSize: 16 }} /> Edit
						</GhostBtn>
					</PermissionGate>
				</TopActions>
			</TopBar>

			<HeroCard>
				<HeroHead>
					<HeroIcon>
						<LightbulbOutlined />
					</HeroIcon>
					<HeroMeta>
						<HeroLabel>LinkedIn idea</HeroLabel>
						<HeroTitle>{idea.title}</HeroTitle>
					</HeroMeta>
					<StatusPill
						$bg={STATUS_META[idea.status].bg}
						$color={STATUS_META[idea.status].color}
					>
						{STATUS_META[idea.status].label}
					</StatusPill>
				</HeroHead>

				{idea.hook && <Hook>“{idea.hook}”</Hook>}

				<KVGrid>
					<KV>
						<KLabel>Priority</KLabel>
						<KVal>{PRIORITY_LABEL[idea.priority]}</KVal>
					</KV>
					<KV>
						<KLabel>Language</KLabel>
						<KVal>{idea.language}</KVal>
					</KV>
					<KV>
						<KLabel>Format</KLabel>
						<KVal>
							{idea.suggestedFormat
								? idea.suggestedFormat.charAt(0) +
									idea.suggestedFormat.slice(1).toLowerCase()
								: '—'}
						</KVal>
					</KV>
					<KV>
						<KLabel>Planned date</KLabel>
						<KVal>{fmtDate(idea.plannedDate)}</KVal>
					</KV>
					<KV>
						<KLabel>Audience</KLabel>
						<KVal>{idea.targetAudience ?? '—'}</KVal>
					</KV>
					<KV>
						<KLabel>Content pillar</KLabel>
						<KVal>{idea.contentPillar ?? '—'}</KVal>
					</KV>
					<KV>
						<KLabel>Owner</KLabel>
						<KVal>
							{idea.owner
								? `${idea.owner.firstName} ${idea.owner.lastName}`
								: '—'}
						</KVal>
					</KV>
					<KV>
						<KLabel>Updated</KLabel>
						<KVal>{fmtDate(idea.updatedAt)}</KVal>
					</KV>
				</KVGrid>
			</HeroCard>

			<SectionCard>
				<SectionTitle>Content</SectionTitle>
				<ContentBody>{idea.content}</ContentBody>
			</SectionCard>

			{idea.tags.length > 0 && (
				<SectionCard>
					<SectionTitle>Tags</SectionTitle>
					<TagsRow>
						{idea.tags.map((t) => (
							<TagChip key={t}>#{t}</TagChip>
						))}
					</TagsRow>
				</SectionCard>
			)}

			{idea.referenceLinks.length > 0 && (
				<SectionCard>
					<SectionTitle>Reference links</SectionTitle>
					<LinkList>
						{idea.referenceLinks.map((l) => (
							<LinkRow key={l}>
								<a href={l} target='_blank' rel='noreferrer noopener'>
									{l}
								</a>
								<OpenInNewOutlined style={{ fontSize: 14, color: T.primary }} />
							</LinkRow>
						))}
					</LinkList>
				</SectionCard>
			)}

			{idea.note && (
				<SectionCard>
					<SectionTitle>Note</SectionTitle>
					<NoteBody>{idea.note}</NoteBody>
				</SectionCard>
			)}

			<SectionCard>
				<SectionTitle>Related posts</SectionTitle>
				{idea.posts && idea.posts.length > 0 ? (
					<PostsList>
						{idea.posts.map((p) => (
							<PostRow
								key={p.id}
								type='button'
								onClick={() => navigate(`/linkedin/posts/${p.id}`)}
							>
								<PostRowMain>
									<PostRowTitle>{p.internalTitle}</PostRowTitle>
									<PostRowMeta>
										{p.publishedAt
											? `Published ${fmtDate(p.publishedAt)}`
											: p.scheduledAt
												? `Scheduled ${fmtDate(p.scheduledAt)}`
												: 'Not scheduled'}
									</PostRowMeta>
								</PostRowMain>
								<PostRowStatus>{p.status}</PostRowStatus>
							</PostRow>
						))}
					</PostsList>
				) : (
					<Empty>No posts yet — turn this idea into a post to see it here.</Empty>
				)}
			</SectionCard>
		</Shell>
	)
}

export default IdeaView

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

const Hook = styled.blockquote`
	margin: 18px 0 0;
	padding: 12px 16px;
	border-left: 3px solid ${T.primary};
	background: ${T.primaryTint};
	color: ${T.textStrong};
	font-style: italic;
	font-size: 15px;
	line-height: 1.5;
	border-radius: 4px;
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

const LinkList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const LinkRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	a {
		color: ${T.primary};
		text-decoration: none;
		max-width: 640px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	a:hover {
		text-decoration: underline;
	}
`

const PostsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const PostRow = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	padding: 12px 14px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	background: #ffffff;
	text-align: left;
	cursor: pointer;
	font: inherit;
	transition: all 160ms ease;
	&:hover {
		border-color: ${T.primary};
		background: ${T.primaryTint};
	}
`

const PostRowMain = styled.div`
	flex: 1;
	min-width: 0;
`

const PostRowTitle = styled.div`
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
`

const PostRowMeta = styled.div`
	font-size: 11.5px;
	color: ${T.textSecondary};
	margin-top: 2px;
`

const PostRowStatus = styled.span`
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: ${T.primary};
`

const Empty = styled.div`
	padding: 20px;
	text-align: center;
	color: ${T.textSecondary};
	font-size: 13px;
`
