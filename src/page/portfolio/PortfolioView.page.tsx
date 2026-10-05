import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	CloseRounded,
	EditOutlined,
	FileDownloadOutlined,
	FiberManualRecord,
	InsertDriveFileOutlined,
	LaunchRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import PermissionGate from '../../components/auth/PermissionGate'
import {
	BackGhostButton,
	EditSolidButton,
	PrimaryGhostButton,
} from '../../components/_shared/formShell.styled'
import { pickFileIcon } from './pickFileIcon'
import { useGetPortfolioItemQuery } from '../../store/portfolio/portfolioApi'
import { renderMarkdown } from './markdown'
import axiosInstance from '../../api/axiosInstance'

const PortfolioView = () => {
	const { slug } = useParams()
	const { data: item, isLoading, isError } = useGetPortfolioItemQuery(slug!)

	// Resolve a short-lived signed URL for every asset upfront. The
	// signed URL carries B2's own `?Authorization=` token (not our
	// JWT), so it is safe to embed in `<img src>` / `<a href>`.
	const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
	useEffect(() => {
		if (!item?.assets) return
		let cancelled = false
		Promise.all(
			item.assets.map((a) =>
				axiosInstance
					.get<{ url: string }>(`/portfolio/assets/${a.id}/signed-url`)
					.then((r) => [a.id, r.data.url] as const)
					.catch(() => [a.id, ''] as const),
			),
		).then((entries) => {
			if (!cancelled) {
				setAssetUrls(Object.fromEntries(entries.filter(([, u]) => u)))
			}
		})
		return () => {
			cancelled = true
		}
	}, [item?.assets])
	const assetUrl = (id: string) => assetUrls[id] ?? ''

	// Download the exported portfolio PDF through the authenticated
	// axios client, then open the resulting blob in a new tab.
	const openExport = async () => {
		if (!item) return
		const res = await axiosInstance.get<Blob>(
			`/portfolio/${item.slug}/export`,
			{ responseType: 'blob' },
		)
		const objectUrl = URL.createObjectURL(res.data)
		const w = window.open(objectUrl, '_blank', 'noopener,noreferrer')
		// Chrome keeps object URLs alive until the originating document
		// is closed; releasing after a small delay avoids revoking it
		// before the new tab reads the bytes.
		window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
		if (!w) URL.revokeObjectURL(objectUrl)
	}

	const html = useMemo(
		() => renderMarkdown(item?.contentMarkdown ?? ''),
		[item],
	)

	const [lightbox, setLightbox] = useState<{
		url: string
		name: string
	} | null>(null)
	const [lightboxClosing, setLightboxClosing] = useState(false)
	const closeLightbox = () => {
		setLightboxClosing(true)
		window.setTimeout(() => {
			setLightbox(null)
			setLightboxClosing(false)
		}, 220)
	}

	useEffect(() => {
		if (!lightbox) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeLightbox()
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lightbox])

	if (isLoading) return <EmptyShell>Loading portfolio item…</EmptyShell>
	if (isError || !item)
		return <EmptyShell>Portfolio item not found.</EmptyShell>

	const images = item.assets.filter((a) => a.kind === 'IMAGE')
	const files = item.assets.filter((a) => a.kind === 'FILE')
	const coverUrl = item.coverAsset ? assetUrl(item.coverAsset.id) : null

	return (
		<Page>
			<TopBar>
				<BackGhostButton as={Link} to='/portfolio'>
					<ArrowBackRounded />
					Back to portfolio
				</BackGhostButton>
				<Actions>
					<PermissionGate permission='portfolio:export'>
						<PrimaryGhostButton type='button' onClick={openExport}>
							<FileDownloadOutlined />
							Download PDF
						</PrimaryGhostButton>
					</PermissionGate>
					<PermissionGate permission='portfolio:update'>
						<EditSolidButton
							as={Link}
							to={`/portfolio/${item.slug}/edit`}
						>
							<EditOutlined />
							Edit
						</EditSolidButton>
					</PermissionGate>
				</Actions>
			</TopBar>

			<Terminal>
				<TermBar>
					<Dots>
						<i style={{ background: '#ff5f57' }} />
						<i style={{ background: '#febc2e' }} />
						<i style={{ background: '#28c840' }} />
					</Dots>
					<TermTitle>portfolio / {item.slug}.md</TermTitle>
					<TermMeta>
						<FiberManualRecord
							style={{
								fontSize: 7,
								color:
									item.status === 'READY'
										? '#15803d'
										: item.status === 'ARCHIVED'
											? '#64748b'
											: '#b45309',
							}}
						/>
						{item.status.toLowerCase()}
					</TermMeta>
				</TermBar>

				<Head>
					<Prompt>
						<em>~/portfolio</em>
						<span>$</span>
						<i>cat {item.slug}.md</i>
					</Prompt>
					<Title>{item.title}</Title>
					{item.shortSummary && <Lead>&gt; {item.shortSummary}</Lead>}
					{item.tags.length > 0 && (
						<TagLine>
							{item.tags.map((t) => (
								<Tag key={t.tag.id}>
									#{t.tag.displayName.toLowerCase()}
								</Tag>
							))}
						</TagLine>
					)}
				</Head>

				{coverUrl && (
					<CoverWrap
						onClick={() =>
							item.coverAsset &&
							setLightbox({
								url: coverUrl,
								name: item.coverAsset.fileName,
							})
						}
					>
						<img src={coverUrl} alt='' />
						<CoverCaption>cover.jpg</CoverCaption>
					</CoverWrap>
				)}

				<Section>
					<SectionLabel>## Content</SectionLabel>
					<Markdown dangerouslySetInnerHTML={{ __html: html }} />
				</Section>

				<Foot>
					<span>updated {new Date(item.updatedAt).toLocaleDateString()}</span>
					<span>·</span>
					<span>created {new Date(item.createdAt).toLocaleDateString()}</span>
					<span>·</span>
					<span>{item.assets.length} assets</span>
				</Foot>
			</Terminal>

			{images.length > 0 && (
				<Terminal>
					<TermBar>
						<Dots>
							<i style={{ background: '#ff5f57' }} />
							<i style={{ background: '#febc2e' }} />
							<i style={{ background: '#28c840' }} />
						</Dots>
						<TermTitle>gallery / {images.length} items</TermTitle>
						<TermMeta>
							<FiberManualRecord
								style={{ fontSize: 7, color: '#15803d' }}
							/>
							images
						</TermMeta>
					</TermBar>
					<Section>
						<SectionLabel>## Gallery</SectionLabel>
						<Gallery>
							{images.map((a) => (
								<Thumb
									key={a.id}
									onClick={() =>
										setLightbox({
											url: assetUrl(a.id),
											name: a.fileName,
										})
									}
								>
									<img src={assetUrl(a.id)} alt='' />
									<ThumbCap>{a.fileName}</ThumbCap>
								</Thumb>
							))}
						</Gallery>
					</Section>
				</Terminal>
			)}

			{files.length > 0 && (
				<Terminal>
					<TermBar>
						<Dots>
							<i style={{ background: '#ff5f57' }} />
							<i style={{ background: '#febc2e' }} />
							<i style={{ background: '#28c840' }} />
						</Dots>
						<TermTitle>attachments / {files.length} files</TermTitle>
						<TermMeta>
							<FiberManualRecord
								style={{ fontSize: 7, color: '#15803d' }}
							/>
							files
						</TermMeta>
					</TermBar>
					<Section>
						<SectionLabel>## Attachments</SectionLabel>
						<FileLog>
							{files.map((a) => {
								const ic = pickFileIcon(a.fileName)
								return (
									<FileLine
										key={a.id}
										href={assetUrl(a.id)}
										target='_blank'
										rel='noreferrer'
									>
										<FileIconWrap
											style={{
												background: ic.bg,
												color: ic.color,
											}}
										>
											<ic.Icon style={{ fontSize: 20 }} />
										</FileIconWrap>
										<FileMainMeta>
											<FileName>{a.fileName}</FileName>
											<FileSubRow>
												<FileExtBadge
													style={{ background: ic.color }}
												>
													{ic.label}
												</FileExtBadge>
												<FileSize>
													{(a.size / 1024).toFixed(0)} KB
												</FileSize>
											</FileSubRow>
										</FileMainMeta>
										<FileArrow>
											<LaunchRounded style={{ fontSize: 14 }} />
										</FileArrow>
									</FileLine>
								)
							})}
						</FileLog>
					</Section>
				</Terminal>
			)}

			{lightbox && (
				<LightboxBackdrop
					$closing={lightboxClosing}
					onClick={closeLightbox}
				>
					<LightboxCard
						$closing={lightboxClosing}
						onClick={(e) => e.stopPropagation()}
					>
						<LightboxImg src={lightbox.url} alt={lightbox.name} />
						<LightboxClose
							type='button'
							onClick={closeLightbox}
							aria-label='Close preview'
						>
							<CloseRounded style={{ fontSize: 20 }} />
						</LightboxClose>
						<LightboxName>{lightbox.name}</LightboxName>
					</LightboxCard>
				</LightboxBackdrop>
			)}
		</Page>
	)
}

export default PortfolioView

/* ─── Styles ──────────────────────────────────── */

const EmptyShell = styled.div`
	padding: 60px 20px;
	color: ${T.textSecondary};
	text-align: center;
	font-size: 14px;
`
const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`
const Page = styled.div`
	max-width: 980px;
	margin: 0 auto;
	padding: 20px 20px 60px;
	display: flex;
	flex-direction: column;
	gap: 20px;
`

/* ─── Top bar ─── */
const TopBar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
	animation: ${fadeUp} 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
`
const Actions = styled.div`
	display: inline-flex;
	gap: 8px;
	flex-wrap: wrap;
`

/* ─── Terminal card (light) ─── */
const Terminal = styled.section`
	background: #ffffff;
	border-radius: 14px;
	overflow: hidden;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
`
const TermBar = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 14px;
	background: #f8fafc;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
`
const Dots = styled.div`
	display: inline-flex;
	gap: 6px;
	i {
		display: inline-block;
		width: 11px;
		height: 11px;
		border-radius: 50%;
	}
`
const TermTitle = styled.span`
	flex: 1;
	text-align: center;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	color: ${T.textMuted};
	letter-spacing: 0.3px;
`
const TermMeta = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 10.5px;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.4px;
`

/* ─── Head ─── */
const Head = styled.div`
	padding: 24px 32px 18px;
`
const Prompt = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 12px;
	margin-bottom: 20px;
	em {
		font-style: normal;
		color: ${T.primary};
	}
	span {
		color: ${T.textMuted};
	}
	i {
		font-style: normal;
		color: ${T.textStrong};
	}
`
const Title = styled.h1`
	margin: 0 0 10px;
	font-family: 'Fraunces', Georgia, serif;
	font-size: clamp(28px, 3.6vw, 40px);
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.02em;
	line-height: 1.15;
`
const Lead = styled.p`
	margin: 0 0 16px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	line-height: 1.65;
	color: ${T.textSecondary};
	padding-left: 14px;
	border-left: 2px solid ${T.primary};
`
const TagLine = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
`
const Tag = styled.span`
	color: ${T.primary};
	font-weight: 600;
`

/* ─── Cover ─── */
const CoverWrap = styled.button`
	position: relative;
	margin: 0 32px 20px;
	border-radius: 10px;
	overflow: hidden;
	border: 1px solid rgba(15, 23, 42, 0.08);
	display: block;
	width: calc(100% - 64px);
	padding: 0;
	cursor: zoom-in;
	background: #f1f5f9;
	img {
		width: 100%;
		display: block;
		max-height: 420px;
		object-fit: cover;
		transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover img {
		transform: scale(1.02);
	}
`
const CoverCaption = styled.span`
	position: absolute;
	bottom: 8px;
	right: 10px;
	padding: 3px 8px;
	border-radius: 4px;
	background: rgba(15, 23, 42, 0.72);
	color: rgba(255, 255, 255, 0.9);
	font-family: 'JetBrains Mono', monospace;
	font-size: 10.5px;
`

/* ─── Section ─── */
const Section = styled.div`
	padding: 18px 32px 24px;
`
const SectionLabel = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-size: 12.5px;
	color: ${T.primary};
	font-weight: 700;
	margin-bottom: 14px;
`
const Markdown = styled.div`
	font-family: 'Fraunces', Georgia, serif;
	font-size: 16px;
	line-height: 1.72;
	color: #241e16;

	h1, h2, h3 {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		color: ${T.textStrong};
		margin: 1.4em 0 0.4em;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	h1 { font-size: 1.6em; }
	h2 { font-size: 1.3em; }
	h3 { font-size: 1.12em; }
	p { margin: 0.6em 0; }
	code {
		font-family: 'JetBrains Mono', monospace;
		background: rgba(15, 23, 42, 0.06);
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 13px;
		color: #b45309;
	}
	pre {
		background: #f8fafc;
		border: 1px solid rgba(15, 23, 42, 0.08);
		padding: 14px 16px;
		border-radius: 10px;
		overflow-x: auto;
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		line-height: 1.5;
		color: #241e16;
	}
	a {
		color: ${T.primary};
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-thickness: 1.5px;
	}
	blockquote {
		margin: 1em 0;
		padding: 2px 14px;
		border-left: 3px solid ${T.primary};
		color: ${T.textSecondary};
		font-style: italic;
	}
	ul, ol { padding-left: 1.5em; }
	li { margin: 0.3em 0; }
	img {
		max-width: 100%;
		border-radius: 10px;
		margin: 1em 0;
	}
`

/* ─── Gallery ─── */
const Gallery = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 8px;
`
const Thumb = styled.button`
	position: relative;
	aspect-ratio: 1;
	border-radius: 8px;
	overflow: hidden;
	border: 1px solid rgba(15, 23, 42, 0.08);
	cursor: zoom-in;
	padding: 0;
	background: #f1f5f9;
	transition: transform 180ms ease, box-shadow 180ms ease;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
	}
	&:hover img {
		transform: scale(1.06);
	}
`
const ThumbCap = styled.div`
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 6px 8px;
	background: linear-gradient(
		to top,
		rgba(15, 23, 42, 0.75),
		transparent
	);
	font-family: 'JetBrains Mono', monospace;
	font-size: 10px;
	color: #ffffff;
	text-overflow: ellipsis;
	white-space: nowrap;
	overflow: hidden;
	text-align: left;
`

/* ─── Files ─── */
const FileLog = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`
const FileLine = styled.a`
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 8px;
	color: ${T.textStrong};
	text-decoration: none;
	border: 1px solid transparent;
	transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
	&:hover {
		background: rgba(3, 105, 161, 0.04);
		border-color: rgba(3, 105, 161, 0.14);
		transform: translateX(2px);
	}
`
const FileIconWrap = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 38px;
	height: 38px;
	border-radius: 8px;
	flex-shrink: 0;
`
const FileMainMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`
const FileName = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: ${T.textStrong};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const FileSubRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`
const FileExtBadge = styled.span`
	padding: 1px 7px;
	border-radius: 4px;
	color: #ffffff;
	font-family: 'JetBrains Mono', monospace;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.4px;
`
const FileSize = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	color: ${T.textMuted};
	letter-spacing: 0.3px;
`
const FileArrow = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${T.primary};
`

/* ─── Foot ─── */
const Foot = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 32px;
	border-top: 1px solid rgba(15, 23, 42, 0.06);
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	color: ${T.textMuted};
	background: #fafafa;
`

/* ─── Lightbox ─── */
const lightboxFadeIn = keyframes`
	from { opacity: 0; backdrop-filter: blur(0px); }
	to { opacity: 1; backdrop-filter: blur(4px); }
`
const lightboxFadeOut = keyframes`
	from { opacity: 1; backdrop-filter: blur(4px); }
	to { opacity: 0; backdrop-filter: blur(0px); }
`
const lightboxZoomIn = keyframes`
	from { opacity: 0; transform: scale(0.9) translateY(8px); }
	to { opacity: 1; transform: scale(1) translateY(0); }
`
const lightboxZoomOut = keyframes`
	from { opacity: 1; transform: scale(1) translateY(0); }
	to { opacity: 0; transform: scale(0.92) translateY(4px); }
`
const LightboxBackdrop = styled.div<{ $closing?: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.78);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32px;
	z-index: 10000;
	animation: ${(p) => (p.$closing ? lightboxFadeOut : lightboxFadeIn)}
		220ms cubic-bezier(0.22, 1, 0.36, 1) both;
`
const LightboxCard = styled.div<{ $closing?: boolean }>`
	position: relative;
	max-width: min(1100px, 94vw);
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	animation: ${(p) => (p.$closing ? lightboxZoomOut : lightboxZoomIn)}
		${(p) => (p.$closing ? '200ms' : '280ms')}
		cubic-bezier(0.22, 1, 0.36, 1) both;
`
const LightboxImg = styled.img`
	max-width: 100%;
	max-height: 82vh;
	border-radius: 12px;
	box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
	object-fit: contain;
	background: #0f172a;
`
const LightboxClose = styled.button`
	position: absolute;
	top: -44px;
	right: -4px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	min-width: 36px;
	min-height: 36px;
	flex-shrink: 0;
	box-sizing: border-box;
	aspect-ratio: 1 / 1;
	border-radius: 50%;
	border: 0;
	padding: 0;
	line-height: 0;
	background: rgba(255, 255, 255, 0.14);
	backdrop-filter: blur(6px);
	color: #ffffff;
	cursor: pointer;
	transition:
		background 180ms ease,
		transform 240ms cubic-bezier(0.34, 1.4, 0.64, 1),
		box-shadow 180ms ease;
	svg {
		display: block;
		transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover {
		background: rgba(255, 255, 255, 0.28);
		transform: scale(1.1);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
	}
	&:hover svg {
		transform: rotate(90deg);
	}
	&:active {
		transform: scale(0.95);
	}
`
const LightboxName = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	color: rgba(255, 255, 255, 0.75);
	letter-spacing: 0.3px;
	max-width: 90vw;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
