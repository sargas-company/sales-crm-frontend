import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { HubOutlined, EditOutlined } from '@mui/icons-material'
import { TextField, Button } from '../../ui'
import Loading from '../../ui/state/Loading'
import ErrorState from '../../ui/state/ErrorState'
import useTheme from '../../theme/useTheme'
import { Field, FormHeader, SectionHead } from '../_shared/FormShell'
import {
	DotMini,
	FootActions,
	FootBar,
	FootLeft,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../_shared/formShell.styled'
import { useGetPlatformByIdQuery } from '../../store/platforms/platformsApi'
import { formatDate } from '../../utils/format'

const PlatformViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data: platform, isLoading, isError } = useGetPlatformByIdQuery(id, { skip: !id })

	if (isLoading) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<CenteredState>
						<Loading label='Loading platform…' />
					</CenteredState>
				</Surface>
			</Shell>
		)
	}

	if (isError || !platform) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<CenteredState>
						<ErrorState
							title='Platform not available'
							description='Could not load platform.'
							action={
								<Button onClick={() => navigate('/platforms/list/')}>Back to list</Button>
							}
						/>
					</CenteredState>
				</Surface>
			</Shell>
		)
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/platforms/list/'
					backLabel='Back to platforms'
					icon={<HubOutlined />}
					title={platform.title}
					subtitle={`Slug: ${platform.slug} · created ${formatDate(platform.createdAt, 'short')}`}
					badgeLabel='View'
					badgeTone='edit'
				/>

				<Section $delay={80}>
					<SectionHead
						num='01'
						title='Identity'
						hint='Read-only view. Use the edit action to change title or logo.'
					/>
					<IdentityGrid>
						<Field label='Title' hint='Human-readable name shown across the app.'>
							<TextField
								name='platform-title'
								value={platform.title}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>

						<Field label='Slug' hint='Immutable — assigned at creation time.'>
							<TextField
								name='platform-slug'
								value={platform.slug}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</IdentityGrid>
				</Section>

				<Section $delay={140}>
					<SectionHead
						num='02'
						title='Logo'
						hint='Optional visual mark rendered next to the platform title.'
					/>
					<LogoRow>
						<LogoTile $hasImage={!!platform.imageUrl}>
							{platform.imageUrl ? (
								<img src={platform.imageUrl} alt={platform.title} />
							) : (
								<span>{initials(platform.title)}</span>
							)}
						</LogoTile>
						<LogoMeta>
							<LogoMetaTitle>
								{platform.imageUrl ? 'Custom logo' : 'No logo set'}
							</LogoMetaTitle>
							<LogoMetaSub>
								{platform.imageUrl
									? platform.imageUrl
									: 'Falling back to platform initials.'}
							</LogoMetaSub>
						</LogoMeta>
					</LogoRow>
				</Section>

				<Section $delay={200}>
					<SectionHead
						num='03'
						title='Timestamps'
						hint='When this record was created and last modified.'
					/>
					<IdentityGrid>
						<Field label='Created at'>
							<TextField
								name='platform-created'
								value={formatDate(platform.createdAt, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Updated at'>
							<TextField
								name='platform-updated'
								value={formatDate(platform.updatedAt, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</IdentityGrid>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Viewing platform in read-only mode.
					</FootLeft>
					<FootActions>
						<Button
							varient='outlined'
							color='rgba(3, 105, 161, 1)'
							type='button'
							onClick={() => navigate('/platforms/list/')}
						>
							Back to list
						</Button>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate(`/platforms/edit/${platform.id}`)}
						>
							<EditOutlined />
							Edit platform
						</PrimarySolidButton>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default PlatformViewPage

function initials(title: string): string {
	const parts = title.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return '?'
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
	return (parts[0][0] + parts[1][0]).toUpperCase()
}

const CenteredState = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const IdentityGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 22px 20px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`

const LogoRow = styled.div`
	display: flex;
	align-items: center;
	gap: 18px;
	padding: 16px 18px;
	background: linear-gradient(135deg, #f8fafc 0%, #f4f2f8 100%);
	border: 1px solid #eeecf3;
	border-radius: 14px;
	flex-wrap: wrap;
`

const LogoTile = styled.span<{ $hasImage: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 60px;
	height: 60px;
	border-radius: 14px;
	background: ${({ $hasImage }) => ($hasImage ? '#fff' : '#f4f2f8')};
	border: 1px solid #eeecf3;
	color: #7a7686;
	font-size: 16px;
	font-weight: 700;
	letter-spacing: 0.4px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	overflow: hidden;
	flex-shrink: 0;

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 8px;
	}
`

const LogoMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
	flex: 1;
`

const LogoMetaTitle = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: #252d3a;
	line-height: 1.3;
`

const LogoMetaSub = styled.span`
	font-size: 12px;
	color: #7a7686;
	line-height: 1.4;
	word-break: break-all;
`
