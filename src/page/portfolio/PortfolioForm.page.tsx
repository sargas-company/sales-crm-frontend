import {
	ChangeEvent,
	CSSProperties,
	FormEvent,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { createPortal, flushSync } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import styled, { createGlobalStyle, css, keyframes } from 'styled-components'
import {
	AddPhotoAlternateOutlined,
	ArrowUpwardRounded,
	AttachmentOutlined,
	AudiotrackOutlined,
	AutoAwesomeMotionOutlined,
	AutoAwesomeOutlined,
	AutoFixHighOutlined,
	BackupOutlined,
	BurstModeOutlined,
	CheckCircleOutlineRounded,
	CloseRounded,
	CloudOutlined,
	CloudUploadRounded,
	CodeOutlined,
	DescriptionOutlined,
	FolderSpecialOutlined,
	FolderZipOutlined,
	ImageOutlined,
	InsertDriveFileOutlined,
	MovieOutlined,
	PictureAsPdfOutlined,
	RocketLaunchOutlined,
	SlideshowOutlined,
	TableChartOutlined,
	TaskAltOutlined,
	TopicOutlined,
	UploadFileRounded,
	VisibilityRounded,
	WallpaperOutlined,
} from '@mui/icons-material'
import axiosInstance from '../../api/axiosInstance'
import { TextField, Select, SelectItem } from '../../ui'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../components/_shared/FormShell'
import {
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../components/_shared/formShell.styled'
import {
	useCreatePortfolioItemMutation,
	useGetPortfolioItemQuery,
	useGetPortfolioTagsQuery,
	useRemovePortfolioAssetMutation,
	useUpdatePortfolioItemMutation,
	useUploadPortfolioAssetMutation,
	type PortfolioStatus,
} from '../../store/portfolio/portfolioApi'
import { slugifyServiceName } from '../../store/phone-numbers/phoneServicesApi'

const SUMMARY_MAX = 600
import { renderMarkdown } from './markdown'

interface Props {
	mode: 'create' | 'edit'
}

const PortfolioForm = ({ mode }: Props) => {
	const { slug } = useParams()
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const isEdit = mode === 'edit'

	const existingQuery = useGetPortfolioItemQuery(slug!, {
		skip: !isEdit || !slug,
	})
	const existing = existingQuery.data

	const [title, setTitle] = useState('')
	const [titleError, setTitleError] = useState<string | null>(null)
	/* Slug is auto-derived from the title (create flow). In edit mode we
	 * keep the stored slug visible but still disabled — same shape as
	 * the phone-services form so the user doesn't accidentally break
	 * existing URLs. */
	const [slugField, setSlugField] = useState('')
	const [shortSummary, setShortSummary] = useState('')
	const [status, setStatus] = useState<PortfolioStatus>('DRAFT')
	const [contentMarkdown, setContentMarkdown] = useState('')
	const [tags, setTags] = useState<string[]>([])
	const [tagInput, setTagInput] = useState('')
	/* On create we start in Edit so the user can begin typing right
	 * away; on existing items default to Preview so the content reads
	 * as a doc first and only switches to editing on intent. */
	const [previewOn, setPreviewOn] = useState(isEdit)
	/* Content terminal: measure the visible pane's intrinsic height so
	 * the whole block adapts (empty = compact, long = scrolls at cap). */
	const CONTENT_MIN = 220
	/* +30% headroom on both panes so scroll kicks in later when either
	 * reading or writing long markdown. */
	const CONTENT_MAX_PREVIEW = Math.round(620 * 1.3) // 806
	const CONTENT_MAX_EDITOR = Math.round(620 * 1.3) // 806
	const editorRef = useRef<HTMLTextAreaElement | null>(null)
	const previewRef = useRef<HTMLDivElement | null>(null)
	const [contentStackHeight, setContentStackHeight] = useState(CONTENT_MIN)

	// Short-lived signed URL cache keyed by asset id. Filled lazily on
	// demand so that embedding components (`<img>`, download anchors)
	// can look up a URL synchronously after the first paint.
	const signedAssetUrlCacheRef = useRef<Map<string, string>>(new Map())
	const [signedAssetUrls, setSignedAssetUrls] = useState<Record<string, string>>(
		{},
	)
	const ensureAssetUrl = (id: string) => {
		if (signedAssetUrlCacheRef.current.has(id)) return
		axiosInstance
			.get<{ url: string }>(`/portfolio/assets/${id}/signed-url`)
			.then((res) => {
				signedAssetUrlCacheRef.current.set(id, res.data.url)
				setSignedAssetUrls((p) => ({ ...p, [id]: res.data.url }))
			})
			.catch(() => {
				/* keep the cache miss — caller shows no preview */
			})
	}
	const assetDownloadUrl = (id: string) => {
		if (!signedAssetUrlCacheRef.current.has(id)) ensureAssetUrl(id)
		return signedAssetUrls[id] ?? ''
	}

	/* Pending assets for create-mode flow — Files + local preview URLs
	 * collected before the portfolio row exists. On successful create we
	 * loop through them and upload each. */
	type PendingAsset = {
		tempId: string
		file: File
		kind: 'COVER' | 'IMAGE' | 'FILE'
		fileName: string
		size: number
		previewUrl: string
	}
	const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([])

	useEffect(() => {
		return () => {
			pendingAssets.forEach((a) => URL.revokeObjectURL(a.previewUrl))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	/* View-Transitions wrapper — reflow neighbours smoothly instead of
	 * snapping to new positions when the item list changes. Chrome +
	 * Edge support it; other browsers just do a plain state update. */
	const withViewTransition = (fn: () => void) => {
		type DocWithVT = Document & {
			startViewTransition?: (cb: () => void) => void
		}
		const d = document as DocWithVT
		if (typeof d.startViewTransition === 'function') {
			d.startViewTransition(() => flushSync(fn))
		} else {
			fn()
		}
	}

	const addPendingAsset = (
		file: File,
		kind: 'COVER' | 'IMAGE' | 'FILE',
	) => {
		withViewTransition(() => {
			rawAddPendingAsset(file, kind)
		})
	}

	const rawAddPendingAsset = (
		file: File,
		kind: 'COVER' | 'IMAGE' | 'FILE',
	) => {
		setPendingAssets((prev) => {
			// Cover is single — replace previous
			if (kind === 'COVER') {
				const old = prev.find((p) => p.kind === 'COVER')
				if (old) URL.revokeObjectURL(old.previewUrl)
				const rest = prev.filter((p) => p.kind !== 'COVER')
				return [
					...rest,
					{
						tempId: `tmp-${Date.now()}-${Math.random()}`,
						file,
						kind,
						fileName: file.name,
						size: file.size,
						previewUrl: URL.createObjectURL(file),
					},
				]
			}
			return [
				...prev,
				{
					tempId: `tmp-${Date.now()}-${Math.random()}`,
					file,
					kind,
					fileName: file.name,
					size: file.size,
					previewUrl: URL.createObjectURL(file),
				},
			]
		})
	}

	const removePendingAsset = (tempId: string) => {
		withViewTransition(() => {
			setPendingAssets((prev) => {
				const target = prev.find((p) => p.tempId === tempId)
				if (target) URL.revokeObjectURL(target.previewUrl)
				return prev.filter((p) => p.tempId !== tempId)
			})
		})
	}
	const [lightbox, setLightbox] = useState<{
		url: string
		name: string
		size?: number
		kind: 'image' | 'file'
	} | null>(null)
	const [assetToRemove, setAssetToRemove] = useState<{
		id: string
		fileName: string
		kind: string
	} | null>(null)
	const [isRemovingAsset, setIsRemovingAsset] = useState(false)
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
	}, [lightbox])

	/* In create mode slug follows the title live. In edit mode the
	 * stored slug is kept to avoid URL churn. */
	const derivedSlug = useMemo(() => slugifyServiceName(title), [title])
	const effectiveSlug = isEdit ? slugField : derivedSlug

	useEffect(() => {
		if (existing) {
			setTitle(existing.title)
			setSlugField(existing.slug)
			setShortSummary(existing.shortSummary ?? '')
			setStatus(existing.status)
			setContentMarkdown(existing.contentMarkdown ?? '')
			setTags(existing.tags.map((t) => t.tag.displayName.toUpperCase()))
		}
	}, [existing])

	const { data: tagCatalog = [] } = useGetPortfolioTagsQuery()
	const [create, { isLoading: isCreating }] = useCreatePortfolioItemMutation()
	const [update, { isLoading: isUpdating }] = useUpdatePortfolioItemMutation()
	const [uploadAsset] = useUploadPortfolioAssetMutation()
	const [removeAsset] = useRemovePortfolioAssetMutation()

	/* Wrap state updates in startViewTransition so Chromium browsers
	 * animate the position shift of neighbouring tag pills (including
	 * row wraps) instead of snapping. Safely degrades on browsers
	 * without the API (Firefox today) — the state update still runs,
	 * just without the smooth reflow. */
	const smoothUpdate = (fn: () => void) => {
		const anyDoc = document as any
		if (typeof anyDoc.startViewTransition === 'function') {
			anyDoc.startViewTransition(fn)
		} else {
			fn()
		}
	}

	const handleAddTag = (raw: string) => {
		/* Tags are canonical UPPERCASE — compared case-insensitively on
		 * add so "aws", "AWS", "Aws" all land as the same chip. */
		const t = raw.trim().toUpperCase()
		if (!t) return
		if (tags.some((x) => x.toUpperCase() === t)) return
		smoothUpdate(() => {
			setTags((prev) => [...prev, t])
			setTagInput('')
		})
	}
	const handleRemoveTag = (t: string) => {
		const target = t.toUpperCase()
		smoothUpdate(() =>
			setTags((prev) => prev.filter((x) => x.toUpperCase() !== target)),
		)
	}

	const handleMarkdownFile = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = () => {
			setContentMarkdown(String(reader.result ?? ''))
			showToast('Markdown loaded', 'success')
		}
		reader.onerror = () => showToast('Could not read file', 'error')
		reader.readAsText(file)
		e.target.value = ''
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!title.trim()) {
			setTitleError('Title is required')
			// Jump focus/scroll to the first invalid control.
			const el = document.getElementById('pf-title') as HTMLInputElement | null
			el?.focus()
			el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
			return
		}
		setTitleError(null)
		try {
			if (isEdit && existing) {
				await update({
					id: existing.id,
					body: {
						title,
						// Keep the stored slug intact on edit — avoid URL
						// churn even if the title changed.
						slug: slugField || undefined,
						shortSummary,
						status,
						contentMarkdown,
						tags,
					} as any,
				}).unwrap()
				showToast('Portfolio item saved', 'success')
				navigate(`/portfolio/${slugField || existing.slug}`)
			} else {
				const created = await create({
					title,
					slug: derivedSlug || undefined,
					shortSummary,
					status,
					contentMarkdown,
					tags,
				}).unwrap()
				/* Upload any pending assets sequentially — if any fails,
				 * the portfolio item exists and the user can retry from
				 * the edit page. */
				for (const pa of pendingAssets) {
					try {
						await uploadAsset({
							itemId: created.id,
							file: pa.file,
							kind: pa.kind,
						}).unwrap()
					} catch (err) {
						showToast(
							`Failed to upload "${pa.fileName}": ${parseServerError(err)}`,
							'error',
						)
					}
				}
				pendingAssets.forEach((a) =>
					URL.revokeObjectURL(a.previewUrl),
				)
				showToast('Portfolio item created', 'success')
				navigate(`/portfolio/${created.slug}`)
			}
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const [uploading, setUploading] = useState<{
		kind: 'COVER' | 'IMAGE' | 'FILE'
		fileName: string
	} | null>(null)

	const handleAsset = async (
		e: ChangeEvent<HTMLInputElement>,
		kind: 'COVER' | 'IMAGE' | 'FILE',
	) => {
		const file = e.target.files?.[0]
		if (!file || !existing) return
		setUploading({ kind, fileName: file.name })
		try {
			await uploadAsset({ itemId: existing.id, file, kind }).unwrap()
			showToast('Asset uploaded', 'success')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		} finally {
			setUploading(null)
		}
		e.target.value = ''
	}

	const handleAssetDrop = async (
		file: File,
		kind: 'COVER' | 'IMAGE' | 'FILE',
	) => {
		if (!file || !existing) return
		setUploading({ kind, fileName: file.name })
		try {
			await uploadAsset({ itemId: existing.id, file, kind }).unwrap()
			showToast('Asset uploaded', 'success')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		} finally {
			setUploading(null)
		}
	}

	const previewHtml = useMemo(
		() => renderMarkdown(contentMarkdown),
		[contentMarkdown],
	)

	useLayoutEffect(() => {
		const el = previewOn ? previewRef.current : editorRef.current
		if (!el) return
		/* scrollHeight is the natural height the content needs, but a
		 * grid child inheriting the cell size reports the cell's height
		 * when content fits. Briefly reset `height: auto` so we measure
		 * the truly intrinsic size, then revert — synchronous within
		 * useLayoutEffect, no flicker. */
		const prev = (el as HTMLElement).style.height
		;(el as HTMLElement).style.height = 'auto'
		const natural = el.scrollHeight
		;(el as HTMLElement).style.height = prev
		const cap = previewOn ? CONTENT_MAX_PREVIEW : CONTENT_MAX_EDITOR
		const next = Math.min(cap, Math.max(CONTENT_MIN, natural))
		setContentStackHeight(next)
	}, [previewOn, previewHtml, contentMarkdown])

	if (isEdit && existingQuery.isLoading) return <FormLoading />
	if (isEdit && !existing) return <FormNotFound label='Portfolio item' />

	return (
		<Shell $dark={isDark}>
			<AssetTileVTStyles />
			<Surface $dark={isDark}>
				<FormHeader
					backTo={
						isEdit && existing ? `/portfolio/${existing.slug}` : '/portfolio'
					}
					backLabel='Back'
					icon={<FolderSpecialOutlined />}
					title={isEdit ? 'Edit portfolio item' : 'New portfolio item'}
					subtitle={
						isEdit
							? 'Update identity, tags, Markdown body and assets.'
							: 'Create a Markdown-powered case study.'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>
				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint='Title, slug and visibility'
						/>
						<FieldGrid>
							<Field
								label='Title'
								htmlFor='pf-title'
								required
								error={titleError ?? undefined}
							>
								<TextField
									id='pf-title'
									value={title}
									onChange={(e) => {
										setTitle(e.target.value)
										if (titleError && e.target.value.trim())
											setTitleError(null)
									}}
									placeholder='Project title'
									error={!!titleError}
								/>
							</Field>
							<Field label='Slug' hint='auto-generated'>
								<SlugBox $dark={isDark}>
									<span className='slug-prefix'>/</span>
									<span className='slug-value'>
										{effectiveSlug || 'portfolio-slug'}
									</span>
								</SlugBox>
							</Field>
							<Field label='Status' htmlFor='pf-status'>
								<Select
									id='pf-status'
									value={status}
									onChange={(value) =>
										setStatus(value as PortfolioStatus)
									}
								>
									<SelectItem value='DRAFT'>Draft</SelectItem>
									<SelectItem value='READY'>Ready</SelectItem>
									<SelectItem value='ARCHIVED'>Archived</SelectItem>
								</Select>
							</Field>
							<Field
								label='Short summary'
								htmlFor='pf-summary'
								span='full'
							>
								<SummaryWrap
									$over={shortSummary.length > SUMMARY_MAX}
								>
									<TextField
										id='pf-summary'
										value={shortSummary}
										onChange={(e) =>
											setShortSummary(
												e.target.value.slice(0, SUMMARY_MAX),
											)
										}
										placeholder='A short pitch: what, for whom, outcome'
										multiRow
										rows={3}
										maxLength={SUMMARY_MAX}
									/>
									<CharCounter
										$warn={shortSummary.length > SUMMARY_MAX * 0.9}
									>
										{shortSummary.length} / {SUMMARY_MAX}
									</CharCounter>
								</SummaryWrap>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Tags'
							hint='Technologies, industries, platforms — mixed'
						/>
						<V3TagBlock>
							<V3CatalogGrid>
								{(() => {
									/* Merge the server catalogue with any locally-
									 * created tags so the user instantly sees their
									 * new tag as a selected pill before Save. */
									const catalogUpper = tagCatalog.map((t) => ({
										key: t.id,
										upper: t.displayName.toUpperCase(),
									}))
									const localOnly = tags
										.map((t) => t.toUpperCase())
										.filter(
											(u) =>
												!catalogUpper.some(
													(c) => c.upper === u,
												),
										)
										.map((u) => ({ key: `local-${u}`, upper: u }))
									const pills = [...catalogUpper, ...localOnly]
									return pills.map(({ key, upper }) => {
										const active = tags.some(
											(x) => x.toUpperCase() === upper,
										)
										return (
											<V3Pill
												key={key}
												type='button'
												$active={active}
												style={
													{
														viewTransitionName: `tag-${key}`,
													} as CSSProperties
												}
												onClick={() =>
													active
														? handleRemoveTag(upper)
														: handleAddTag(upper)
												}
											>
												<PillCheck $active={active}>✓</PillCheck>
												<span>{upper}</span>
											</V3Pill>
										)
									})
								})()}
							</V3CatalogGrid>
							<V3Custom>
								<span className='hint'>Not in the list?</span>
								<TagTypeahead
									catalog={tagCatalog.map((t) =>
										t.displayName.toUpperCase(),
									)}
									current={tags}
									value={tagInput}
									onChange={setTagInput}
									onPick={(t) => handleAddTag(t)}
								/>
							</V3Custom>
						</V3TagBlock>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='Content'
							hint='Markdown. Upload a .md or edit inline.'
						/>

						<CV1Terminal>
							<CV1Head>
								<CV1Dots>
									<span className='r' />
									<span className='y' />
									<span className='g' />
								</CV1Dots>
								<CV1Path>portfolio@sargas:~/content.md</CV1Path>
								<CV1Tools>
									<CV1UploadBtn as='label'>
										<UploadFileRounded />
										Upload
										<input
											type='file'
											accept='.md,text/markdown'
											onChange={handleMarkdownFile}
											hidden
										/>
									</CV1UploadBtn>
									<CV1TogglePrimary
										type='button'
										onClick={() => setPreviewOn((v) => !v)}
									>
										<VisibilityRounded />
										<CV1Swap>
											<span
												className={previewOn ? 'cur' : 'hid'}
											>
												Edit
											</span>
											<span
												className={previewOn ? 'hid' : 'cur'}
											>
												Preview
											</span>
										</CV1Swap>
									</CV1TogglePrimary>
								</CV1Tools>
							</CV1Head>
							<CV1Stack
								style={{ height: `${contentStackHeight}px` }}
							>
								<CV1TextArea
									ref={editorRef}
									className={previewOn ? 'hid' : 'cur'}
									value={contentMarkdown}
									onChange={(e) =>
										setContentMarkdown(e.target.value)
									}
									placeholder={'# project overview\n\n- bullet 1\n- bullet 2'}
									rows={16}
								/>
								<CV1PreviewBody
									ref={previewRef}
									className={previewOn ? 'cur' : 'hid'}
									dangerouslySetInnerHTML={{ __html: previewHtml }}
								/>
							</CV1Stack>
							<CV1Status>
								<span>
									{contentMarkdown.split('\n').length} lines
								</span>
								<span>·</span>
								<span>{contentMarkdown.length} chars</span>
								<span>·</span>
								<span>markdown</span>
							</CV1Status>
						</CV1Terminal>
					</Section>

					{(() => {
						/* Build the items array for each kind. In edit mode
						 * it's the server-side assets; in create mode it's the
						 * local pending uploads with blob preview URLs. */
						type ZoneItem = {
							id: string
							fileName: string
							kind: string
							size: number
							url?: string
						}
						const inEdit = isEdit && existing
						const coverItems: ZoneItem[] = inEdit
							? (existing.assets.filter(
									(a) => a.kind === 'COVER',
								) as any)
							: pendingAssets
									.filter((p) => p.kind === 'COVER')
									.map((p) => ({
										id: p.tempId,
										fileName: p.fileName,
										kind: p.kind,
										size: p.size,
										url: p.previewUrl,
									}))
						const galleryItems: ZoneItem[] = inEdit
							? (existing.assets.filter(
									(a) => a.kind === 'IMAGE',
								) as any)
							: pendingAssets
									.filter((p) => p.kind === 'IMAGE')
									.map((p) => ({
										id: p.tempId,
										fileName: p.fileName,
										kind: p.kind,
										size: p.size,
										url: p.previewUrl,
									}))
						const fileItems: ZoneItem[] = inEdit
							? (existing.assets.filter(
									(a) => a.kind === 'FILE',
								) as any)
							: pendingAssets
									.filter((p) => p.kind === 'FILE')
									.map((p) => ({
										id: p.tempId,
										fileName: p.fileName,
										kind: p.kind,
										size: p.size,
										url: p.previewUrl,
									}))

						const doDrop = (
							file: File,
							kind: 'COVER' | 'IMAGE' | 'FILE',
						) => {
							if (inEdit) {
								handleAssetDrop(file, kind)
							} else {
								addPendingAsset(file, kind)
							}
						}
						const doPick = (
							e: ChangeEvent<HTMLInputElement>,
							kind: 'COVER' | 'IMAGE' | 'FILE',
						) => {
							if (inEdit) {
								handleAsset(e, kind)
							} else {
								const f = e.target.files?.[0]
								if (f) addPendingAsset(f, kind)
								e.target.value = ''
							}
						}
						const doPreview = (it: ZoneItem) => {
							const isImg =
								it.kind === 'COVER' || it.kind === 'IMAGE'
							setLightbox({
								url: it.url ?? assetDownloadUrl(it.id),
								name: it.fileName,
								size: isImg ? undefined : it.size,
								kind: isImg ? 'image' : 'file',
							})
						}
						const doRemove = (it: ZoneItem) => {
							if (inEdit) {
								setAssetToRemove(it)
							} else {
								removePendingAsset(it.id)
							}
						}

						return (
							<Section $delay={260}>
								<SectionHead
									num='04'
									title='Assets'
									hint={
										inEdit
											? 'Drop files into the matching zone — cover, gallery or attachment'
											: 'Pending uploads — they persist after Create'
									}
								/>
								<DndTri>
									<AssetDropZone
										label='Cover'
										sub='Hero image, 1 only'
										icon={
											<AutoFixHighOutlined
												style={{ fontSize: 32 }}
											/>
										}
										kind='COVER'
										accept='image/*'
										maxCount={1}
										items={coverItems}
										uploading={
											uploading?.kind === 'COVER'
												? uploading.fileName
												: null
										}
										onDrop={(f) => doDrop(f, 'COVER')}
										onPick={(e) => doPick(e, 'COVER')}
										onPreview={doPreview}
										onRemove={doRemove}
									/>
									<AssetDropZone
										label='Gallery'
										sub='Multiple images'
										icon={
											<AutoAwesomeMotionOutlined
												style={{ fontSize: 32 }}
											/>
										}
										kind='IMAGE'
										accept='image/*'
										maxCount={10}
										items={galleryItems}
										uploading={
											uploading?.kind === 'IMAGE'
												? uploading.fileName
												: null
										}
										onDrop={(f) => doDrop(f, 'IMAGE')}
										onPick={(e) => doPick(e, 'IMAGE')}
										onPreview={doPreview}
										onRemove={doRemove}
									/>
									<AssetDropZone
										label='Files'
										sub='pdf · doc · any'
										icon={
											<BackupOutlined
												style={{ fontSize: 32 }}
											/>
										}
										kind='FILE'
										accept='*'
										maxCount={10}
										maxTotalBytes={50 * 1024 * 1024}
										items={fileItems}
										uploading={
											uploading?.kind === 'FILE'
												? uploading.fileName
												: null
										}
										onDrop={(f) => doDrop(f, 'FILE')}
										onPick={(e) => doPick(e, 'FILE')}
										onPreview={doPreview}
										onRemove={doRemove}
									/>
								</DndTri>
							</Section>
						)
					})()}

					<FootBar $dark={isDark}>
						<FootLeft />
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/portfolio')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={isEdit ? 'portfolio:update' : 'portfolio:create'}
							>
								<PrimarySolidButton
									type='submit'
									disabled={isCreating || isUpdating}
								>
									{isCreating || isUpdating
										? 'Saving…'
										: isEdit
											? 'Save changes'
											: 'Create'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
			{assetToRemove && (
				<ConfirmModal
					icon={<InsertDriveFileOutlined />}
					iconTone='danger'
					confirmColor='error'
					title='Remove this asset?'
					description={
						<>
							This will permanently delete{' '}
							<strong>{assetToRemove.fileName}</strong>
							{assetToRemove.kind === 'COVER'
								? ' and unlink the portfolio cover.'
								: '.'}{' '}
							You can re-upload it from the same zone.
						</>
					}
					confirmLabel='Remove'
					confirmLoadingLabel='Removing…'
					cancelLabel='Cancel'
					isLoading={isRemovingAsset}
					onConfirm={async () => {
						if (!assetToRemove) return
						setIsRemovingAsset(true)
						try {
							await removeAsset(assetToRemove.id).unwrap()
							showToast('Asset removed', 'success')
							setAssetToRemove(null)
						} catch (err) {
							showToast(parseServerError(err), 'error')
						} finally {
							setIsRemovingAsset(false)
						}
					}}
					onClose={() => {
						if (!isRemovingAsset) setAssetToRemove(null)
					}}
				/>
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
						{lightbox.kind === 'image' ? (
							<LightboxImg src={lightbox.url} alt={lightbox.name} />
						) : (
							<LightboxFileCore>
								<InsertDriveFileOutlined style={{ fontSize: 80 }} />
								<strong>{lightbox.name}</strong>
								{lightbox.size !== undefined && (
									<small>{(lightbox.size / 1024).toFixed(0)} KB</small>
								)}
								<a
									href={lightbox.url}
									download={lightbox.name}
									target='_blank'
									rel='noreferrer'
								>
									Download
								</a>
							</LightboxFileCore>
						)}
						<LightboxClose
							type='button'
							onClick={closeLightbox}
							aria-label='Close preview'
						>
							<CloseRounded style={{ fontSize: 18 }} />
						</LightboxClose>
						<LightboxName>{lightbox.name}</LightboxName>
					</LightboxCard>
				</LightboxBackdrop>
			)}
		</Shell>
	)
}

export default PortfolioForm

/**
 * Upwork-style skills input. Filters the shared tag catalog as the
 * user types, shows a floating dropdown of matches, lets them click
 * one to add. If the typed string is new, offers "Create 'xxx'" as the
 * top option. Keyboard: ArrowDown/Up to navigate, Enter to pick, Esc
 * closes the dropdown.
 */
const TagTypeahead = ({
	catalog,
	current,
	value,
	onChange,
	onPick,
}: {
	catalog: string[]
	current: string[]
	value: string
	onChange: (v: string) => void
	onPick: (t: string) => void
}) => {
	const [open, setOpen] = useState(false)
	const [cursor, setCursor] = useState(0)
	const wrapRef = useRef<HTMLDivElement>(null)
	const dropRef = useRef<HTMLDivElement>(null)
	const [portalPos, setPortalPos] = useState<CSSProperties>({})

	const query = value.trim().toLowerCase()
	const currentLower = new Set(current.map((c) => c.toLowerCase()))
	const matches = catalog
		.filter(
			(c) =>
				!currentLower.has(c.toLowerCase()) &&
				(!query || c.toLowerCase().includes(query)),
		)
		.slice(0, 8)
	const exactHit = matches.some((m) => m.toLowerCase() === query)
	/* Tags are always stored and displayed in UPPERCASE regardless of
	 * what the user typed — same canonical casing everywhere. */
	const createdValue = value.trim().toUpperCase()
	const showCreate = query && !exactHit && !currentLower.has(query)
	const items: Array<{ label: string; value: string; create?: boolean }> = [
		...(showCreate
			? [{ label: `Create "${createdValue}"`, value: createdValue, create: true }]
			: []),
		...matches.map((m) => ({ label: m.toUpperCase(), value: m.toUpperCase() })),
	]

	useEffect(() => {
		if (cursor >= items.length) setCursor(0)
	}, [items.length, cursor])

	useEffect(() => {
		const onDoc = (evt: MouseEvent) => {
			const target = evt.target as Node
			if (wrapRef.current && wrapRef.current.contains(target)) return
			if (dropRef.current && dropRef.current.contains(target)) return
			setOpen(false)
		}
		document.addEventListener('mousedown', onDoc)
		return () => document.removeEventListener('mousedown', onDoc)
	}, [])

	useLayoutEffect(() => {
		if (!open || !wrapRef.current) return
		const update = () => {
			const r = wrapRef.current!.getBoundingClientRect()
			setPortalPos({
				position: 'fixed',
				top: r.bottom + 4,
				left: r.left,
				minWidth: r.width,
			})
		}
		update()
		window.addEventListener('scroll', update, true)
		window.addEventListener('resize', update)
		return () => {
			window.removeEventListener('scroll', update, true)
			window.removeEventListener('resize', update)
		}
	}, [open])

	const pick = (v: string) => {
		if (!v) return
		onPick(v)
		setCursor(0)
	}

	return (
		<TagInputWrap ref={wrapRef}>
			<input
				placeholder='Search or create a tag'
				value={value}
				onFocus={() => setOpen(true)}
				onChange={(e) => {
					onChange(e.target.value)
					setOpen(true)
				}}
				onKeyDown={(e) => {
					if (e.key === 'ArrowDown') {
						e.preventDefault()
						setOpen(true)
						setCursor((c) => Math.min(items.length - 1, c + 1))
					} else if (e.key === 'ArrowUp') {
						e.preventDefault()
						setCursor((c) => Math.max(0, c - 1))
					} else if (e.key === 'Enter' || e.key === ',') {
						e.preventDefault()
						const item = items[cursor]
						if (item) pick(item.value)
						else pick(value.trim())
					} else if (e.key === 'Escape') {
						setOpen(false)
					}
				}}
			/>
			{open &&
				items.length > 0 &&
				createPortal(
					<TagDropdown ref={dropRef} style={portalPos}>
						{items.map((it, idx) => (
							<TagOption
								key={`${it.value}-${idx}`}
								type='button'
								$active={idx === cursor}
								$create={!!it.create}
								onMouseEnter={() => setCursor(idx)}
								onClick={() => pick(it.value)}
							>
								{it.create && <span className='prefix'>+</span>}
								{it.label}
							</TagOption>
						))}
					</TagDropdown>,
					document.body,
				)}
		</TagInputWrap>
	)
}

const Toggle = styled.label`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	font-size: 13px;
	input {
		accent-color: #0369a1;
		width: 18px;
		height: 18px;
	}
`
/* ─── Catalog grid toggles ─── */
const tagBlockIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to { opacity: 1; transform: translateY(0); }
`
const pillPop = keyframes`
	from { opacity: 0; transform: scale(0.9); }
	to { opacity: 1; transform: scale(1); }
`
const dropdownIn = keyframes`
	from { opacity: 0; transform: translateY(-4px); }
	to { opacity: 1; transform: translateY(0); }
`
const V3TagBlock = styled.div`
	animation: ${tagBlockIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}

	/* View Transitions: tune the cross-fade timing for every tag pill so
	 * row re-wraps animate smoothly in Chromium/Safari. Firefox ignores
	 * this and falls back to the instant snap. */
	::view-transition-group(*) {
		animation-duration: 320ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
	}
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px 18px;
	border-radius: 12px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`
const V3CatalogGrid = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;

	/* Stagger — pills pop in one after another. 16 steps, then wrap. */
	> button {
		animation: ${pillPop} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	> button:nth-child(1)  { animation-delay: 20ms; }
	> button:nth-child(2)  { animation-delay: 40ms; }
	> button:nth-child(3)  { animation-delay: 60ms; }
	> button:nth-child(4)  { animation-delay: 80ms; }
	> button:nth-child(5)  { animation-delay: 100ms; }
	> button:nth-child(6)  { animation-delay: 120ms; }
	> button:nth-child(7)  { animation-delay: 140ms; }
	> button:nth-child(8)  { animation-delay: 160ms; }
	> button:nth-child(9)  { animation-delay: 180ms; }
	> button:nth-child(10) { animation-delay: 200ms; }
	> button:nth-child(11) { animation-delay: 220ms; }
	> button:nth-child(12) { animation-delay: 240ms; }
	> button:nth-child(13) { animation-delay: 260ms; }
	> button:nth-child(14) { animation-delay: 280ms; }
	> button:nth-child(15) { animation-delay: 300ms; }
	> button:nth-child(16) { animation-delay: 320ms; }

	@media (prefers-reduced-motion: reduce) {
		> button {
			animation: none;
		}
	}
`
const V3Pill = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0;
	padding: 6px 14px;
	border-radius: 999px;
	border: 1.5px solid
		${(p) => (p.$active ? '#0369a1' : 'rgba(15, 23, 42, 0.1)')};
	background: ${(p) => (p.$active ? '#0369a1' : '#ffffff')};
	color: ${(p) => (p.$active ? '#ffffff' : '#475569')};
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.3px;
	cursor: pointer;
	transition: background 220ms cubic-bezier(0.22, 1, 0.36, 1),
		color 220ms cubic-bezier(0.22, 1, 0.36, 1),
		border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 180ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		border-color: #0369a1;
		color: ${(p) => (p.$active ? '#ffffff' : '#0369a1')};
		transform: translateY(-1px);
	}
	&:active {
		transform: translateY(0) scale(0.98);
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
		&:hover {
			transform: none;
		}
	}
`
const PillCheck = styled.span<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${(p) => (p.$active ? '14px' : '0')};
	margin-right: ${(p) => (p.$active ? '6px' : '0')};
	overflow: hidden;
	opacity: ${(p) => (p.$active ? 1 : 0)};
	font-weight: 700;
	transition: width 280ms cubic-bezier(0.22, 1, 0.36, 1),
		margin-right 280ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`
const V3Custom = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding-top: 12px;
	border-top: 1px dashed rgba(15, 23, 42, 0.1);

	.hint {
		font-size: 11.5px;
		color: #64748b;
		font-weight: 600;
		letter-spacing: 0.3px;
		text-transform: uppercase;
		white-space: nowrap;
	}
`

const TagInputWrap = styled.div`
	position: relative;
	display: flex;
	flex: 1 1 240px;
	min-width: 160px;

	input {
		flex: 1;
		padding: 6px 10px;
		border: 0;
		background: transparent;
		font: inherit;
		font-size: 13px;
		outline: none;
	}
	input::placeholder {
		color: #94a3b8;
	}
`
const TagDropdown = styled.div`
	/* position comes from the portal's inline style (fixed, top, left,
	 * minWidth) so the dropdown lives on top of every other section
	 * regardless of stacking contexts. */
	max-height: 280px;
	overflow-y: auto;
	background: #ffffff;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
	padding: 4px 0;
	z-index: 9500;
	animation: ${dropdownIn} 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
	transform-origin: top left;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`
const TagOption = styled.button<{ $active: boolean; $create: boolean }>`
	display: flex;
	align-items: center;
	gap: 6px;
	width: 100%;
	padding: 8px 14px;
	border: 0;
	background: ${(p) =>
		p.$active ? 'rgba(3, 105, 161, 0.08)' : 'transparent'};
	color: ${(p) => (p.$create ? '#0369a1' : '#0f172a')};
	font: inherit;
	font-size: 12.5px;
	font-weight: ${(p) => (p.$create ? 700 : 500)};
	text-align: left;
	cursor: pointer;
	transition: background 120ms ease;

	.prefix {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 700;
		color: #0369a1;
	}
`
/* ─── Terminal-style content editor (light theme) ─── */
const CV1Terminal = styled.div`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 12px;
	overflow: hidden;
	font-family: 'JetBrains Mono', monospace;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
`
const CV1Head = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 14px;
	background: #f8fafc;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
`
const CV1Dots = styled.span`
	display: inline-flex;
	gap: 6px;
	span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.r { background: #ff5f56; }
	.y { background: #ffbd2e; }
	.g { background: #27c93f; }
`
const CV1Path = styled.span`
	flex: 1;
	font-size: 11.5px;
	color: #64748b;
`
const CV1Tools = styled.div`
	display: inline-flex;
	gap: 6px;
`
const uploadBounce = keyframes`
	0%   { translate: 0 0; }
	50%  { translate: 0 -3px; }
	100% { translate: 0 0; }
`
const CV1UploadBtn = styled(PrimaryGhostButton)`
	padding: 7px 13px;
	font-size: 12.5px;
	border-radius: 8px;
	svg { font-size: 15px !important; transition: translate 220ms ease; }
	&:hover:not(:disabled) svg {
		animation: ${uploadBounce} 520ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg { animation: none; }
	}
`
const togglePulse = keyframes`
	0%   { scale: 1; }
	50%  { scale: 1.18; }
	100% { scale: 1; }
`
const CV1TogglePrimary = styled(PrimarySolidButton)`
	padding: 7px 13px;
	font-size: 12.5px;
	border-radius: 8px;
	svg {
		font-size: 15px !important;
		transition: transform 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}
	&:hover:not(:disabled) svg {
		animation: ${togglePulse} 520ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg { animation: none; }
	}
`

const CV1Swap = styled.span`
	/* Both labels stack in the same grid cell → container sizes to the
	 * longer one, so the button width never changes AND we get a true
	 * crossfade (old fades out while new fades in simultaneously). */
	display: inline-grid;
	grid-template-areas: 'stack';
	align-items: center;

	> span {
		grid-area: stack;
		transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.cur {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
	}
	.hid {
		opacity: 0;
		transform: translateY(-3px);
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		> span {
			transition: none;
		}
	}
`
const CV1Stack = styled.div`
	/* Both the editor and the preview live in the same grid cell so
	 * they can crossfade without a layout jump. Height is driven by a
	 * dynamic measurement of the currently visible pane's natural
	 * content height, clamped between min and max — this way the
	 * container shrinks on empty content and only grows up to the
	 * cap before internal scroll kicks in. */
	position: relative;
	display: grid;
	grid-template-areas: 'stack';
	grid-template-rows: 1fr;
	overflow: hidden;
	transition: height 240ms cubic-bezier(0.22, 1, 0.36, 1);

	> * {
		grid-area: stack;
		transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.cur {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
		z-index: 2;
	}
	.hid {
		opacity: 0;
		transform: translateY(4px);
		pointer-events: none;
		z-index: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		> * {
			transition: none;
		}
	}
`
const CV1TextArea = styled.textarea`
	display: block;
	box-sizing: border-box;
	width: 100%;
	height: 100%;
	min-height: 0;
	padding: 18px 22px;
	border: 0;
	background: transparent;
	color: #0f172a;
	font: inherit;
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	line-height: 1.65;
	outline: none;
	resize: none;
	overflow-y: auto;
	caret-color: #e85d2f;
	&::placeholder {
		color: #a29fb5;
	}

	&::-webkit-scrollbar { width: 8px; }
	&::-webkit-scrollbar-track { background: transparent; }
	&::-webkit-scrollbar-thumb {
		background: rgba(15, 23, 42, 0.14);
		border-radius: 999px;
	}
	&::-webkit-scrollbar-thumb:hover { background: rgba(15, 23, 42, 0.24); }
	scrollbar-color: rgba(15, 23, 42, 0.14) transparent;
	scrollbar-width: thin;
`
const CV1PreviewBody = styled.div`
	box-sizing: border-box;
	padding: 18px 22px;
	color: #241e16;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 13.5px;
	line-height: 1.65;
	height: 100%;
	min-height: 0;
	overflow-y: auto;
	h1, h2, h3 {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		color: #0f172a;
		margin: 1em 0 0.3em;
	}
	code {
		font-family: 'JetBrains Mono', monospace;
		background: rgba(15, 23, 42, 0.06);
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 12.5px;
	}
	a { color: #0369a1; }
	ul, ol { padding-left: 1.4em; }
	p { margin: 0.6em 0; }

	&::-webkit-scrollbar { width: 8px; }
	&::-webkit-scrollbar-track { background: transparent; }
	&::-webkit-scrollbar-thumb {
		background: rgba(15, 23, 42, 0.14);
		border-radius: 999px;
	}
	&::-webkit-scrollbar-thumb:hover { background: rgba(15, 23, 42, 0.24); }
	scrollbar-color: rgba(15, 23, 42, 0.14) transparent;
	scrollbar-width: thin;
`
const CV1Status = styled.div`
	display: flex;
	gap: 8px;
	padding: 8px 14px;
	background: #f8fafc;
	border-top: 1px solid rgba(15, 23, 42, 0.06);
	color: #94a3b8;
	font-size: 11px;
	letter-spacing: 0.3px;
`


const SummaryWrap = styled.div<{ $over?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 4px;

	textarea {
		resize: vertical;
		min-height: 108px;
	}
	${(p) =>
		p.$over &&
		`
			textarea, input {
				border-color: #dc2626 !important;
			}
		`}
`
const CharCounter = styled.span<{ $warn?: boolean }>`
	align-self: flex-end;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	letter-spacing: 0.3px;
	color: ${(p) => (p.$warn ? '#dc2626' : '#8c8aa0')};
	font-variant-numeric: tabular-nums;
`

const SlugBox = styled.div<{ $dark: boolean }>`
	display: flex;
	align-items: center;
	gap: 4px;
	box-sizing: border-box;
	padding: 1rem 0.8rem;
	border-radius: 8px;
	background: ${({ $dark }) =>
		$dark ? 'rgba(255, 255, 255, 0.03)' : '#faf9fd'};
	border: 1.5px dashed
		${({ $dark }) => ($dark ? '#3a4252' : '#dedaee')};
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 13px;
	line-height: 1.4;
	overflow: hidden;

	.slug-prefix {
		color: ${({ $dark }) => ($dark ? '#5a6070' : '#a29fb5')};
	}
	.slug-value {
		color: ${({ $dark }) => ($dark ? '#c7c9d3' : '#5a5476')};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`

/* ─── Three drag-and-drop zones ─── */
type AssetKindUI = 'COVER' | 'IMAGE' | 'FILE'
interface AssetDropZoneItem {
	id: string
	fileName: string
	kind: string
	size: number
	url?: string
}
type FileIconDef = {
	Icon: React.ComponentType<{ style?: React.CSSProperties }>
	color: string
	bg: string
	label: string
}
const pickFileIcon = (fileName: string): FileIconDef => {
	const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
	/* Muted, desaturated palette — professional, not toxic.
	 * Low-chroma versions of the semantic hues (reddish / bluish / etc.)
	 * sit well against the neutral tile background. */
	if (ext === 'pdf')
		return {
			Icon: PictureAsPdfOutlined,
			color: '#9a5a5a',
			bg: 'rgba(154, 90, 90, 0.09)',
			label: 'PDF',
		}
	if (['doc', 'docx', 'rtf', 'odt', 'txt', 'md'].includes(ext))
		return {
			Icon: DescriptionOutlined,
			color: '#5c7391',
			bg: 'rgba(92, 115, 145, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext))
		return {
			Icon: TableChartOutlined,
			color: '#5e7f6b',
			bg: 'rgba(94, 127, 107, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['ppt', 'pptx', 'key', 'odp'].includes(ext))
		return {
			Icon: SlideshowOutlined,
			color: '#a07d4e',
			bg: 'rgba(160, 125, 78, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz'].includes(ext))
		return {
			Icon: FolderZipOutlined,
			color: '#7a6f8a',
			bg: 'rgba(122, 111, 138, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext))
		return {
			Icon: MovieOutlined,
			color: '#8c6478',
			bg: 'rgba(140, 100, 120, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext))
		return {
			Icon: AudiotrackOutlined,
			color: '#5e7f8c',
			bg: 'rgba(94, 127, 140, 0.09)',
			label: ext.toUpperCase(),
		}
	if (
		[
			'js', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go',
			'rs', 'java', 'c', 'cpp', 'h', 'json', 'xml',
			'html', 'css', 'scss', 'yml', 'yaml', 'sh',
		].includes(ext)
	)
		return {
			Icon: CodeOutlined,
			color: '#6a6d8d',
			bg: 'rgba(106, 109, 141, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext))
		return {
			Icon: ImageOutlined,
			color: '#597794',
			bg: 'rgba(89, 119, 148, 0.09)',
			label: ext.toUpperCase(),
		}
	return {
		Icon: InsertDriveFileOutlined,
		color: '#64748b',
		bg: 'rgba(100, 116, 139, 0.08)',
		label: ext ? ext.toUpperCase() : 'FILE',
	}
}

const AssetDropZone = ({
	label,
	sub,
	icon,
	kind,
	accept,
	items,
	maxCount,
	maxTotalBytes,
	uploading,
	onDrop,
	onPick,
	onPreview,
	onRemove,
}: {
	label: string
	sub: string
	icon: React.ReactNode
	kind: AssetKindUI
	accept: string
	items: AssetDropZoneItem[]
	maxCount?: number
	maxTotalBytes?: number
	uploading?: string | null
	onDrop: (file: File) => void
	onPick: (e: ChangeEvent<HTMLInputElement>) => void
	onPreview: (item: AssetDropZoneItem) => void
	onRemove: (item: AssetDropZoneItem) => void
}) => {
	const [over, setOver] = useState(false)
	const { showToast } = useToast()
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const isImageKind = kind === 'COVER' || kind === 'IMAGE'
	const currentCount = items.length
	const currentBytes = items.reduce((s, it) => s + (it.size || 0), 0)
	const countFull = maxCount !== undefined && currentCount >= maxCount
	const sizeFull =
		maxTotalBytes !== undefined && currentBytes >= maxTotalBytes
	const isFull = countFull || sizeFull

	// Resolve signed URLs for saved items lazily. Pending (local-blob)
	// items carry their own `it.url` from `URL.createObjectURL` and do
	// not need a backend round-trip.
	const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
	useEffect(() => {
		let cancelled = false
		const idsToFetch = items
			.filter((it) => it.id && !it.url && !signedUrls[it.id])
			.map((it) => it.id!)
		idsToFetch.forEach((id) => {
			axiosInstance
				.get<{ url: string }>(`/portfolio/assets/${id}/signed-url`)
				.then((r) => {
					if (!cancelled)
						setSignedUrls((p) =>
							p[id] ? p : { ...p, [id]: r.data.url },
						)
				})
				.catch(() => {
					/* swallow — preview stays empty */
				})
		})
		return () => {
			cancelled = true
		}
	}, [items, signedUrls])
	const assetUrl = (id: string) => signedUrls[id] ?? ''

	const fmtMb = (b: number) => `${(b / (1024 * 1024)).toFixed(1)} MB`

	/* Pre-check a candidate file against the limits. If it would exceed
	 * them, surface a toast and tell the caller to refuse. */
	const canAccept = (f: File): boolean => {
		if (maxCount !== undefined && currentCount + 1 > maxCount) {
			showToast(
				`${label} limit reached — ${maxCount} max`,
				'warning',
			)
			return false
		}
		if (
			maxTotalBytes !== undefined &&
			currentBytes + f.size > maxTotalBytes
		) {
			showToast(
				`"${f.name}" would exceed the ${fmtMb(maxTotalBytes)} total limit (${fmtMb(currentBytes)} used)`,
				'warning',
			)
			return false
		}
		return true
	}

	let lockedTitle = ''
	let lockedSub = ''
	if (isFull) {
		if (kind === 'COVER') {
			lockedTitle = 'Cover is set'
			lockedSub = 'Remove the current cover to replace it'
		} else if (kind === 'IMAGE') {
			lockedTitle = `Gallery is full (${currentCount}/${maxCount})`
			lockedSub = 'Remove an image to add more'
		} else {
			if (sizeFull && !countFull) {
				lockedTitle = `Storage full — ${fmtMb(currentBytes)} / ${fmtMb(maxTotalBytes!)}`
				lockedSub = 'Remove a file to free up space'
			} else {
				lockedTitle = `Files limit reached (${currentCount}/${maxCount})`
				lockedSub = 'Remove a file to add more'
			}
		}
	}

	/* Compact usage ratio in the header subtitle. */
	let usageSub = sub
	if (maxCount !== undefined) {
		usageSub += ` · ${currentCount}/${maxCount}`
	}
	if (maxTotalBytes !== undefined) {
		usageSub += ` · ${fmtMb(currentBytes)}/${fmtMb(maxTotalBytes)}`
	}
	return (
		<DzWrap>
			<DzLabel>
				<DzIcon>{icon}</DzIcon>
				<div>
					<strong>{label}</strong>
					<small>{usageSub}</small>
				</div>
			</DzLabel>
			<DzDrop
				$over={over && !isFull && !uploading}
				$disabled={isFull || !!uploading}
				onClick={() => {
					if (isFull || uploading) return
					fileInputRef.current?.click()
				}}
				onDragEnter={(e) => {
					if (isFull || uploading) return
					e.preventDefault()
					setOver(true)
				}}
				onDragOver={(e) => {
					if (isFull || uploading) return
					e.preventDefault()
					setOver(true)
				}}
				onDragLeave={() => setOver(false)}
				onDrop={(e) => {
					if (isFull || uploading) return
					e.preventDefault()
					setOver(false)
					const f = e.dataTransfer.files?.[0]
					if (f && canAccept(f)) onDrop(f)
				}}
			>
				<input
					ref={fileInputRef}
					type='file'
					accept={accept}
					onChange={(e) => {
						const f = e.target.files?.[0]
						if (f && !canAccept(f)) {
							e.target.value = ''
							return
						}
						onPick(e)
					}}
					disabled={isFull || !!uploading}
					style={{ display: 'none' }}
				/>
				<DzHintStack>
					<DzHint
						$visible={!isFull && !uploading}
						aria-hidden={isFull || !!uploading}
					>
						<DzBigWord>
							<span>D</span>
							<span>R</span>
							<span>O</span>
							<span>P</span>
						</DzBigWord>
						<DzFullHint>or click to browse</DzFullHint>
					</DzHint>
					<DzHint
						$visible={isFull && !uploading}
						aria-hidden={!isFull || !!uploading}
					>
						<DzLockedWord>
							{(kind === 'COVER' ? 'SET' : 'FULL')
								.split('')
								.map((ch, i) => (
									<span key={i}>{ch}</span>
								))}
						</DzLockedWord>
						<DzFullHint>{lockedSub}</DzFullHint>
					</DzHint>
					<DzHint
						$visible={!!uploading}
						aria-hidden={!uploading}
					>
						<DzSpinner />
						<span>Uploading…</span>
						<DzFullHint>
							{uploading
								? uploading.length > 42
									? uploading.slice(0, 40) + '…'
									: uploading
								: ''}
						</DzFullHint>
					</DzHint>
				</DzHintStack>
			</DzDrop>
			{items.length > 0 && (
				<DzGrid>
					{items.map((it) => {
						const icon = !isImageKind
							? pickFileIcon(it.fileName)
							: null
						return (
							<DzTileWrap
								key={it.id}
								style={{
									viewTransitionName: `asset-${it.id.replace(
										/[^a-zA-Z0-9]/g,
										'',
									)}`,
								}}
							>
								<DzTile
									$file={!isImageKind}
									onClick={() => onPreview(it)}
								>
									{isImageKind ? (
										<img src={it.url ?? assetUrl(it.id)} alt='' />
									) : (
										icon && (
											<DzFileCore
												style={{
													background: icon.bg,
													color: icon.color,
												}}
											>
												<icon.Icon style={{ fontSize: 34 }} />
												<DzFileBadge
													style={{
														background: icon.color,
													}}
												>
													{icon.label}
												</DzFileBadge>
											</DzFileCore>
										)
									)}
									<DzRemove
										type='button'
										onClick={(e) => {
											e.stopPropagation()
											onRemove(it)
										}}
										aria-label={`Remove ${it.fileName}`}
									>
										<CloseRounded style={{ fontSize: 16 }} />
									</DzRemove>
								</DzTile>
								{!isImageKind && (
									<DzTileCaption title={it.fileName}>
										{it.fileName}
									</DzTileCaption>
								)}
							</DzTileWrap>
						)
					})}
				</DzGrid>
			)}
		</DzWrap>
	)
}

const DndTri = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`
const DzWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 16px;
	border-radius: 12px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`
const DzLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;

	div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	strong {
		font-size: 14px;
		font-weight: 700;
		color: #0f172a;
	}
	small {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: #94a3b8;
		letter-spacing: 0.3px;
	}
`
const DzIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: rgba(3, 105, 161, 0.08);
	color: #0369a1;
	flex-shrink: 0;
`
const DzDrop = styled.div<{ $over: boolean; $disabled?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 180px;
	padding: 28px;
	border-radius: 12px;
	border: 2px dashed
		${(p) =>
			p.$disabled
				? 'rgba(100, 116, 139, 0.28)'
				: p.$over
					? '#0369a1'
					: 'rgba(3, 105, 161, 0.22)'};
	background: ${(p) =>
		p.$over && !p.$disabled
			? 'rgba(3, 105, 161, 0.045)'
			: '#ffffff'};
	transition: border-color 320ms cubic-bezier(0.22, 1, 0.36, 1),
		background 320ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
	text-align: center;
	cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};

	&:hover {
		${(p) =>
			!p.$disabled &&
			`
			transform: scale(1.01);
			border-color: rgba(3, 105, 161, 0.42);
		`}
	}

	${(p) =>
		p.$disabled &&
		`
		cursor: not-allowed;
		& *,
		& label,
		& input {
			cursor: not-allowed !important;
			pointer-events: none;
		}
	`}
`
const DzFullHint = styled.div`
	font-size: 12px;
	color: #475569;
	font-style: italic;
	line-height: 1.4;
`

/* Locked state — muted outlined word ("SET" / "FULL") mirroring the
 * active-state DROP typographic. */
const DzLockedWord = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 56px;
	font-weight: 800;
	letter-spacing: -0.03em;
	line-height: 1;
	color: transparent;
	-webkit-text-stroke: 2px #94a3b8;
	white-space: nowrap;

	&& > span {
		display: inline-block;
		font-size: 56px !important;
		font-weight: 800 !important;
		line-height: 1 !important;
		color: transparent !important;
		-webkit-text-stroke: 2px #94a3b8;
		letter-spacing: inherit;
	}
`

/* Idle drop zone — giant outlined "DROP" typographic callout.
 * On drop-zone hover each letter does a staggered up-nudge + wiggle. */
const letterJump = keyframes`
	0%   { translate: 0 0; rotate: 0deg; }
	30%  { translate: 0 -6px; rotate: -4deg; }
	60%  { translate: 0 -2px; rotate: 3deg; }
	100% { translate: 0 0; rotate: 0deg; }
`
const DzBigWord = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 64px;
	font-weight: 800;
	letter-spacing: -0.03em;
	line-height: 1;
	color: transparent;
	-webkit-text-stroke: 2px #e85d2f;
	text-stroke: 2px #e85d2f;
	white-space: nowrap;

	&& > span {
		display: inline-block;
		font-size: 64px !important;
		font-weight: 800 !important;
		line-height: 1 !important;
		color: transparent !important;
		-webkit-text-stroke: 2px #e85d2f;
		transform-origin: center bottom;
		letter-spacing: inherit;
	}

	${DzDrop}:hover & span {
		animation: ${letterJump} 520ms cubic-bezier(0.34, 1.3, 0.64, 1);
	}
	${DzDrop}:hover & span:nth-child(1) { animation-delay: 0ms; }
	${DzDrop}:hover & span:nth-child(2) { animation-delay: 70ms; }
	${DzDrop}:hover & span:nth-child(3) { animation-delay: 140ms; }
	${DzDrop}:hover & span:nth-child(4) { animation-delay: 210ms; }

	@media (prefers-reduced-motion: reduce) {
		${DzDrop}:hover & span { animation: none; }
	}
`
const spin = keyframes`
	to { transform: rotate(360deg); }
`
const DzSpinner = styled.div`
	width: 30px;
	height: 30px;
	border-radius: 50%;
	border: 3px solid rgba(3, 105, 161, 0.14);
	border-top-color: #0369a1;
	animation: ${spin} 820ms linear infinite;
`
const DzHintStack = styled.div`
	display: grid;
	grid-template-areas: 'stack';
	place-items: center;
	& > * {
		grid-area: stack;
	}
`
const DzHint = styled.div<{ $visible?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 7px;
	color: #64748b;
	font-size: 13.5px;
	opacity: ${(p) => (p.$visible === false ? 0 : 1)};
	transform: ${(p) =>
		p.$visible === false
			? 'translateY(-4px) scale(0.96)'
			: 'translateY(0) scale(1)'};
	filter: ${(p) =>
		p.$visible === false ? 'blur(2px)' : 'blur(0)'};
	pointer-events: ${(p) => (p.$visible === false ? 'none' : 'auto')};
	transition:
		opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
		filter 320ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		font-size: 28px !important;
		color: #0369a1;
	}
	span {
		font-weight: 400;
		font-size: 14px;
		color: #0f172a;
	}
`
const idleFloat = keyframes`
	0%   { translate: 0 0; rotate: 0deg; }
	50%  { translate: 0 -4px; rotate: -3deg; }
	100% { translate: 0 0; rotate: 0deg; }
`
const sparkleTwinkle = keyframes`
	0%   { opacity: 0.75; scale: 1; }
	35%  { opacity: 1; scale: 1.12; }
	65%  { opacity: 0.85; scale: 1.02; }
	100% { opacity: 0.75; scale: 1; }
`
const DzIdleIcon = styled.span<{ $muted?: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 50%;
	/* Warm clay accent — complements the blue brand palette without
	 * joining the sea of blue elsewhere in the form. */
	background: ${(p) =>
		p.$muted
			? 'rgba(100, 116, 139, 0.1)'
			: 'rgba(194, 113, 75, 0.12)'};
	color: ${(p) => (p.$muted ? '#64748b' : '#c2714b')};
	animation: ${(p) =>
		p.$muted
			? 'none'
			: css`${idleFloat} 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite`};

	svg {
		font-size: 26px !important;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`
const DzOrLabel = styled.label`
	cursor: pointer;
	em {
		color: #0369a1;
		font-style: normal;
		font-weight: 400;
		text-decoration: underline;
	}
	input {
		display: none;
	}
`
const tileIn = keyframes`
	from {
		opacity: 0;
		transform: scale(0.86) translateY(-4px);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
`

/* Per-tile View Transition tuning: slower fade so remove/add reads
 * clearly, plus a slight slide for the "new" layer and shrink for the
 * "old" layer. Scoped globally since ::view-transition-* lives at
 * the document root (not inside components). */
const AssetTileVTStyles = createGlobalStyle`
	::view-transition-old(*)[name^='asset-'] {
		animation: assetTileOut 320ms cubic-bezier(0.4, 0, 0.2, 1) both;
	}
	::view-transition-new(*)[name^='asset-'] {
		animation: assetTileIn 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	@keyframes assetTileIn {
		from { opacity: 0; transform: scale(0.9) translateY(-6px); }
		to   { opacity: 1; transform: scale(1) translateY(0); }
	}
	@keyframes assetTileOut {
		from { opacity: 1; transform: scale(1); }
		to   { opacity: 0; transform: scale(0.85); }
	}
`
const DzGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
	gap: 8px;
`
const DzTileWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	animation: ${tileIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	min-width: 0;
`
const DzTile = styled.div<{ $file: boolean }>`
	position: relative;
	aspect-ratio: 1;
	border-radius: 8px;
	overflow: hidden;
	background: ${(p) => (p.$file ? '#f8fafc' : '#e2e8f0')};
	border: 1px solid rgba(15, 23, 42, 0.06);
	cursor: pointer;
	transition: border-color 180ms ease, background 180ms ease;
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover {
		border-color: rgba(15, 23, 42, 0.14);
	}
	&:hover img {
		transform: scale(1.03);
	}
	&:hover > button {
		opacity: 1;
		transform: scale(1) rotate(0deg);
	}
`
const DzTileCaption = styled.div`
	font-size: 12.5px;
	font-weight: 500;
	color: #0f172a;
	line-height: 1.35;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	padding: 2px 2px 0;
`
const DzFileBadge = styled.span`
	position: absolute;
	bottom: 8px;
	padding: 2px 7px;
	border-radius: 4px;
	color: #ffffff;
	font-family: 'JetBrains Mono', monospace;
	font-size: 9.5px;
	font-weight: 700;
	letter-spacing: 0.4px;
`
const DzFileCore = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 12px 8px 32px;
`
const DzRemove = styled.button`
	position: absolute;
	top: 5px;
	right: 5px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	min-width: 26px;
	min-height: 26px;
	flex-shrink: 0;
	box-sizing: border-box;
	aspect-ratio: 1 / 1;
	border-radius: 50%;
	border: 0;
	padding: 0;
	line-height: 0;
	background: rgba(15, 23, 42, 0.55);
	backdrop-filter: blur(6px);
	color: #ffffff;
	cursor: pointer;
	opacity: 0;
	transform: scale(0.7) rotate(-90deg);
	transform-origin: center center;
	transition:
		opacity 180ms ease,
		transform 220ms cubic-bezier(0.34, 1.4, 0.64, 1),
		background 180ms ease,
		box-shadow 180ms ease;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);

	svg {
		display: block;
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover {
		background: #dc2626;
		box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
		transform: scale(1.1) rotate(0deg);
	}
	&:hover svg {
		transform: rotate(90deg);
	}
	&:active {
		transform: scale(0.95) rotate(0deg);
	}
`

/* ─── Lightbox popup ─── */
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

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
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

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`
const LightboxImg = styled.img`
	max-width: 100%;
	max-height: 82vh;
	border-radius: 12px;
	box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
	object-fit: contain;
	background: #0f172a;
`
const LightboxFileCore = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 48px 56px;
	border-radius: 12px;
	background: #ffffff;
	color: #475569;
	box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);

	strong {
		font-size: 15px;
		font-weight: 700;
		color: #0f172a;
		max-width: 320px;
		text-align: center;
		word-break: break-all;
	}
	small {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11.5px;
		color: #94a3b8;
		letter-spacing: 0.3px;
	}
	a {
		margin-top: 8px;
		padding: 8px 20px;
		border-radius: 8px;
		background: #e85d2f;
		color: #ffffff;
		font-size: 12.5px;
		font-weight: 700;
		letter-spacing: 0.3px;
		text-decoration: none;
		box-shadow: 0 2px 6px rgba(232, 93, 47, 0.3);
		transition: background 160ms ease, transform 160ms ease;
	}
	a:hover {
		background: #d04a1f;
		transform: translateY(-1px);
	}
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
	border-radius: 50%;
	border: 0;
	padding: 0;
	background: rgba(255, 255, 255, 0.14);
	backdrop-filter: blur(6px);
	color: #ffffff;
	cursor: pointer;
	transition:
		background 180ms ease,
		transform 240ms cubic-bezier(0.34, 1.4, 0.64, 1),
		box-shadow 180ms ease;

	svg {
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
