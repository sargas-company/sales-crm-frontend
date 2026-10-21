import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { WorkOutline } from '@mui/icons-material'
import { TextField } from '../../../ui'
import {
	useGetPositionByIdQuery,
	useCreatePositionMutation,
	useUpdatePositionMutation,
} from '../../../store/positions/positionsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import { Field, FormHeader, FormLoading, FormNotFound, SectionHead } from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'

interface PositionFormProps {
	id?: string
}

interface FormFields {
	title: string
}

interface FormErrors {
	title?: string
}

const empty: FormFields = { title: '' }

/** Produce an URL-safe slug from a free-form title: lowercase,
 *  spaces → dashes, strips anything outside [a-z0-9-]. Mirrors
 *  PlatformForm's helper. */
const toSlug = (title: string) =>
	title
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')

const PositionFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createPosition, { isLoading: creating }] = useCreatePositionMutation()
	const [updatePosition, { isLoading: updating }] = useUpdatePositionMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const slug = useMemo(() => toSlug(fields.title), [fields.title])

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.title.trim()) next.title = 'Title is required'
		if (fields.title.trim() && !slug)
			next.title = 'Title must contain at least one latin letter or digit'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		try {
			if (isEdit) {
				await updatePosition({
					id: id!,
					body: {
						title: fields.title || undefined,
						slug: fields.title ? slug : undefined,
					},
				}).unwrap()
				showToast('Position updated successfully', 'success')
			} else {
				await createPosition({ title: fields.title, slug }).unwrap()
				showToast('Position created successfully', 'success')
			}
			navigate('/positions/list/')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/positions/list/'
					backLabel='Back to positions'
					icon={<WorkOutline />}
					title={isEdit ? 'Edit position' : 'New position'}
					subtitle={
						isEdit
							? 'Update the position details below'
							: 'Fill in the details to add a new position'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Basics'
							hint='Give your position a clear title — the slug is generated automatically'
						/>
						<FieldGrid>
							<Field label='Position title' required error={errors.title} span='two-thirds'>
								<TextField
									name='title'
									placeholder='e.g. Backend engineer'
									value={fields.title}
									onChange={(e) => setField('title', e.target.value)}
									error={!!errors.title}
									width='100%'
								/>
							</Field>
							<Field label='Slug' span='third' hint='auto-generated'>
								<SlugBox $dark={isDark}>
									<span className='slug-prefix'>/</span>
									<span className='slug-value'>{slug || 'position-slug'}</span>
								</SlugBox>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Changes are saved when you press Save'
								: 'Position will be added to the list right away'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/positions/list/')}
							>
								Cancel
							</PrimaryGhostButton>
							<PrimarySolidButton type='submit' disabled={isLoading}>
								{isLoading
									? isEdit
										? 'Saving…'
										: 'Creating…'
									: isEdit
										? 'Save changes'
										: 'Create position'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const PositionForm = ({ id }: PositionFormProps) => {
	const { data, isLoading } = useGetPositionByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading position…' />
	if (id && !data) return <FormNotFound label='Position not found' />

	const initial: FormFields = data ? { title: data.title } : empty

	return <PositionFormInner id={id} initial={initial} />
}

export default PositionForm

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
