import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorkspacePremiumOutlined } from '@mui/icons-material'

import { Checkbox, TextField } from '../../../ui'
import useTheme from '../../../theme/useTheme'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../../components/_shared/FormShell'
import {
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	DotMini,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../../components/_shared/formShell.styled'
import {
	useCreateUpworkProfileMutation,
	useGetUpworkProfileQuery,
	useUpdateUpworkProfileMutation,
} from '../../../store/upwork/upworkApi'

interface Props {
	mode: 'create' | 'edit'
}

interface FormState {
	firstName: string
	lastName: string
	title: string
	url: string
	note: string
	active: boolean
}

const empty: FormState = {
	firstName: '',
	lastName: '',
	title: '',
	url: '',
	note: '',
	active: true,
}

const UpworkProfileForm = ({ mode }: Props) => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const isEdit = mode === 'edit'

	const {
		data: existing,
		isLoading: loadingExisting,
		isError: notFound,
	} = useGetUpworkProfileQuery(id ?? '', { skip: !isEdit || !id })

	const [create, { isLoading: creating }] = useCreateUpworkProfileMutation()
	const [update, { isLoading: updating }] = useUpdateUpworkProfileMutation()
	const isLoading = creating || updating

	const [fields, setFields] = useState<FormState>(empty)
	const [errors, setErrors] = useState<{ firstName?: string }>({})

	useEffect(() => {
		if (isEdit && existing) {
			setFields({
				firstName: existing.firstName,
				lastName: existing.lastName ?? '',
				title: existing.title ?? '',
				url: existing.url ?? '',
				note: existing.note ?? '',
				active: existing.active,
			})
		}
	}, [isEdit, existing])

	const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setFields((p) => ({ ...p, [k]: v }))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const firstName = fields.firstName.trim()
		if (!firstName) {
			setErrors({ firstName: 'First name is required' })
			return
		}
		setErrors({})
		const payload = {
			firstName,
			lastName: fields.lastName.trim() || undefined,
			title: fields.title.trim() || undefined,
			url: fields.url.trim() || undefined,
			note: fields.note.trim() || undefined,
			active: fields.active,
		}
		if (isEdit && id) {
			await update({ id, patch: payload }).unwrap()
			nav('/upwork/profiles')
		} else {
			await create(payload as never).unwrap()
			nav('/upwork/profiles')
		}
	}

	if (isEdit && loadingExisting) return <FormLoading label='Loading profile…' />
	if (isEdit && notFound) return <FormNotFound label='Profile not found' />

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/upwork/profiles'
					backLabel='Back to profiles'
					icon={<WorkspacePremiumOutlined />}
					title={isEdit ? 'Edit profile' : 'New profile'}
					subtitle={
						isEdit
							? 'Update profile details.'
							: 'Create a new Upwork profile. Data in this module is entered manually.'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Basics'
							hint='Owner name, profile title and link.'
						/>
						<FieldGrid>
							<Field label='First name' required error={errors.firstName}>
								<TextField
									name='firstName'
									value={fields.firstName}
									onChange={(e) => setField('firstName', e.target.value)}
									error={!!errors.firstName}
									width='100%'
								/>
							</Field>
							<Field label='Last name'>
								<TextField
									name='lastName'
									value={fields.lastName}
									onChange={(e) => setField('lastName', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Title' span='two-thirds' hint='e.g. Senior Full-Stack · React + Node'>
								<TextField
									name='title'
									value={fields.title}
									onChange={(e) => setField('title', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Status' span='third'>
								<label
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 10,
										height: 40,
									}}
								>
									<Checkbox
										checked={fields.active}
										onChange={(v) => setField('active', !!v)}
									/>
									<span style={{ fontSize: 14, color: '#3a3541' }}>
										Active
									</span>
								</label>
							</Field>
							<Field label='URL' span='full'>
								<TextField
									name='url'
									value={fields.url}
									onChange={(e) => setField('url', e.target.value)}
									placeholder='https://upwork.com/freelancers/…'
									width='100%'
								/>
							</Field>
							<Field label='Note' span='full' hint='Optional free-text context.'>
								<TextField
									name='note'
									value={fields.note}
									onChange={(e) => setField('note', e.target.value)}
									multiline
									multiRow
									width='100%'
									style={{ minHeight: 120, resize: 'vertical' }}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Changes save on submit.'
								: 'The profile appears in the list immediately.'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => nav('/upwork/profiles')}
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
										: 'Create profile'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default UpworkProfileForm
