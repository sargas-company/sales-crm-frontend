import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { TextField, Button } from '../../../ui'
import {
	useGetPlatformByIdQuery,
	useCreatePlatformMutation,
	useUpdatePlatformMutation,
} from '../../../store/platforms/platformsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	InfoPanel,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'

interface PlatformFormProps {
	id?: string
}

interface FormFields {
	title: string
	imageUrl: string
}

interface FormErrors {
	title?: string
	imageUrl?: string
}

const empty: FormFields = { title: '', imageUrl: '' }

const toSlug = (title: string) =>
	title
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')

const isValidUrl = (value: string) => {
	if (!value) return true
	try {
		const u = new URL(value)
		return u.protocol === 'http:' || u.protocol === 'https:'
	} catch {
		return false
	}
}

const PlanetIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z'
			stroke='currentColor'
			strokeWidth='1.8'
		/>
		<path
			d='M3 12h18M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
		/>
	</svg>
)

const PlatformFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const primary = theme.primaryColor.color

	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createPlatform, { isLoading: creating }] = useCreatePlatformMutation()
	const [updatePlatform, { isLoading: updating }] = useUpdatePlatformMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const slug = useMemo(() => toSlug(fields.title), [fields.title])
	const previewInitial = fields.title.trim().charAt(0).toUpperCase() || '?'
	const showLogo = fields.imageUrl && isValidUrl(fields.imageUrl)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.title.trim()) next.title = 'Title is required'
		if (fields.imageUrl && !isValidUrl(fields.imageUrl))
			next.imageUrl = 'Enter a valid http(s) URL'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		try {
			if (isEdit) {
				await updatePlatform({
					id: id!,
					body: {
						title: fields.title || undefined,
						slug: fields.title ? slug : undefined,
						imageUrl: fields.imageUrl || undefined,
					},
				}).unwrap()
				showToast('Platform updated successfully', 'success')
			} else {
				await createPlatform({
					title: fields.title,
					slug,
					imageUrl: fields.imageUrl || undefined,
				}).unwrap()
				showToast('Platform created successfully', 'success')
			}
			navigate('/platforms/list/')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/platforms/list/'
					backLabel='Back to platforms'
					icon={<PlanetIcon />}
					title={isEdit ? 'Edit platform' : 'New platform'}
					subtitle={
						isEdit
							? 'Update the platform details below'
							: 'Fill in the details to add a new platform'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Basics'
							hint='Give your platform a recognizable name — the slug is generated automatically'
						/>
						<FieldGrid>
							<Field
								label='Platform title'
								required
								error={errors.title}
								span='two-thirds'
							>
								<TextField
									name='title'
									placeholder='e.g. Upwork'
									value={fields.title}
									onChange={(e) => setField('title', e.target.value)}
									error={!!errors.title}
									width='100%'
								/>
							</Field>
							<Field label='Slug' span='third' hint='auto-generated'>
								<SlugBox $dark={isDark}>
									<span className='slug-prefix'>/</span>
									<span className='slug-value'>{slug || 'platform-slug'}</span>
								</SlugBox>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Branding'
							hint='An optional logo helps users spot the platform across the CRM'
						/>
						<FieldGrid>
							<Field label='Image URL' error={errors.imageUrl} span='full'>
								<TextField
									name='imageUrl'
									placeholder='https://example.com/logo.png'
									value={fields.imageUrl}
									onChange={(e) => setField('imageUrl', e.target.value)}
									error={!!errors.imageUrl}
									width='100%'
								/>
							</Field>

							<InfoPanel
								$dark={isDark}
								$active={!!fields.title || !!fields.imageUrl}
								$tone='blue'
							>
								<PreviewLeft>
									<PreviewLogo $dark={isDark} $hasImage={!!showLogo} $primary={primary}>
										{showLogo ? (
											<img
												src={fields.imageUrl}
												alt=''
												onError={(e) => {
													;(e.target as HTMLImageElement).style.display = 'none'
												}}
											/>
										) : (
											<span>{previewInitial}</span>
										)}
									</PreviewLogo>
									<PreviewText>
										<PreviewTitle>
											{fields.title || 'Platform preview'}
										</PreviewTitle>
										<PreviewHint $dark={isDark}>
											{showLogo
												? 'Logo will appear next to the platform name'
												: fields.imageUrl
													? 'Provide a valid http(s) URL to see the logo'
													: 'No logo · a colored initial will be used as a fallback'}
										</PreviewHint>
									</PreviewText>
								</PreviewLeft>
							</InfoPanel>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Changes are saved when you press Save'
								: 'Platform will be added to the list right away'}
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/platforms/list/')}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading
									? isEdit
										? 'Saving…'
										: 'Creating…'
									: isEdit
										? 'Save changes'
										: 'Create platform'}
							</Button>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const PlatformForm = ({ id }: PlatformFormProps) => {
	const { data, isLoading } = useGetPlatformByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading platform…' />
	if (id && !data) return <FormNotFound label='Platform not found' />

	const initial: FormFields = data
		? { title: data.title, imageUrl: data.imageUrl ?? '' }
		: empty

	return <PlatformFormInner id={id} initial={initial} />
}

export default PlatformForm

/* ── Local styles ───────────────────────────────────────────────────────── */

const SlugBox = styled.div<{ $dark: boolean }>`
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 10px 12px;
	border-radius: 8px;
	background: ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.03)' : '#faf9fd')};
	border: 1px dashed ${({ $dark }) => ($dark ? '#3a4252' : '#dedaee')};
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 13px;
	min-height: 40px;
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

const PreviewLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	flex: 1;
	min-width: 0;
`

const PreviewLogo = styled.div<{ $dark: boolean; $hasImage: boolean; $primary: string }>`
	width: 44px;
	height: 44px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	overflow: hidden;
	background: ${({ $hasImage, $primary, $dark }) =>
		$hasImage ? ($dark ? '#1c2230' : '#ffffff') : `${$primary}15`};
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#ecebf5')};
	color: ${({ $primary }) => $primary};
	font-weight: 700;
	font-size: 18px;
	letter-spacing: -0.02em;

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 4px;
	}
`

const PreviewText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const PreviewTitle = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: inherit;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const PreviewHint = styled.span<{ $dark: boolean }>`
	font-size: 11px;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#8a85a3')};
`
