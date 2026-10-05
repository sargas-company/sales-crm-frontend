import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { VpnKeyOutlined } from '@mui/icons-material'
import { TextField, Select, SelectItem } from '../../ui'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../../components/auth/PermissionGate'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../components/_shared/FormShell'
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
} from '../../components/_shared/formShell.styled'
import { useAppSelector } from '../../hooks'
import {
	type CredentialProfileType,
	useArchiveProfileMutation,
	useCreateProfileMutation,
	useGetProfileQuery,
	useHardDeleteProfileMutation,
	useUpdateProfileMutation,
} from '../../store/credentials/credentialsApi'
import HardDeleteModal from './HardDeleteModal'
import VaultSetupGate from './VaultSetupGate'

interface Props {
	mode: 'create' | 'edit'
}

interface FormFields {
	name: string
	type: CredentialProfileType
	description: string
	tagsText: string
	avatarUrl: string
}

interface FormErrors {
	name?: string
}

const empty: FormFields = {
	name: '',
	type: 'PERSON',
	description: '',
	tagsText: '',
	avatarUrl: '',
}

const parseTags = (text: string): string[] =>
	text
		.split(',')
		.map((t) => t.trim())
		.filter((t) => t.length > 0)

const CredentialsProfileFormInner = ({
	mode,
	id,
	initial,
	existingName,
	existingStatus,
}: {
	mode: 'create' | 'edit'
	id?: string
	initial: FormFields
	existingName?: string
	existingStatus?: 'ACTIVE' | 'ARCHIVED'
}) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createProfile, { isLoading: creating }] = useCreateProfileMutation()
	const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation()
	const [archive] = useArchiveProfileMutation()
	const [hardDelete] = useHardDeleteProfileMutation()
	const [showDelete, setShowDelete] = useState(false)
	const permissions = useAppSelector((s) => s.auth.permissions ?? [])
	const canHardDelete = permissions.includes('credentials:hard_delete')
	const isLoading = creating || updating
	const isEdit = mode === 'edit'

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = () => {
		const next: FormErrors = {}
		if (!fields.name.trim()) next.name = 'Name is required'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const payload = {
			name: fields.name.trim(),
			type: fields.type,
			description: fields.description.trim() || undefined,
			tags: parseTags(fields.tagsText),
			avatarUrl: fields.avatarUrl.trim() || undefined,
		}
		try {
			if (isEdit && id) {
				await updateProfile({ id, body: payload }).unwrap()
				showToast('Profile updated', 'success')
				navigate(`/credentials/profiles/${id}`)
			} else {
				const result = await createProfile(payload as never).unwrap()
				showToast('Profile created', 'success')
				navigate(`/credentials/profiles/${result.id}`)
			}
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<VaultSetupGate />
			<Surface $dark={isDark}>
				<FormHeader
					backTo={
						isEdit
							? `/credentials/profiles/${id}`
							: '/credentials'
					}
					backLabel={isEdit ? 'Back to profile' : 'Back to vault'}
					icon={<VpnKeyOutlined />}
					title={isEdit ? 'Edit profile' : 'New profile'}
					subtitle={
						isEdit
							? 'Update identity, description and tags'
							: 'A container for one person, team or company and their accounts'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>
				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint='Who this profile represents'
						/>
						<FieldGrid>
							<Field label='Name' required error={errors.name}>
								<TextField
									name='name'
									placeholder='e.g. Vadym, Sarah, Sargas Agency'
									value={fields.name}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('name', e.target.value)
									}
									width='100%'
									error={!!errors.name}
								/>
							</Field>
							<Field label='Type' required>
								<Select
									label='Type'
									defaultValue={fields.type}
									onChange={(value) =>
										setField('type', value as CredentialProfileType)
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Person' value='PERSON' />
									<SelectItem label='Company' value='COMPANY' />
									<SelectItem label='Other' value='OTHER' />
								</Select>
							</Field>
							<Field label='Avatar URL' span='full'>
								<TextField
									name='avatarUrl'
									placeholder='https://… (optional)'
									value={fields.avatarUrl}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('avatarUrl', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Context'
							hint='Short description and tags to organize profiles'
						/>
						<FieldGrid>
							<Field
								label='Description'
								hint='One-line note about this profile (optional)'
								span='full'
							>
								<TextField
									name='description'
									placeholder='e.g. External sales contractor'
									value={fields.description}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('description', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field
								label='Tags'
								hint='Comma-separated (e.g. "owner, founder")'
								span='full'
							>
								<TextField
									name='tags'
									placeholder='owner, founder, contractor'
									value={fields.tagsText}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('tagsText', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Editing profile'
								: 'Profile will be created immediately'}
						</FootLeft>
						<FootActions>
							{isEdit && existingStatus === 'ACTIVE' && id && (
								<PrimaryGhostButton
									type='button'
									onClick={async () => {
										if (!confirm('Archive this profile?')) return
										try {
											await archive(id).unwrap()
											showToast('Profile archived', 'success')
											navigate('/credentials')
										} catch (err) {
											showToast(parseServerError(err), 'error')
										}
									}}
								>
									Archive
								</PrimaryGhostButton>
							)}
							{isEdit && canHardDelete && id && (
								<PrimaryGhostButton
									type='button'
									onClick={() => setShowDelete(true)}
								>
									Hard delete
								</PrimaryGhostButton>
							)}
							<PrimaryGhostButton
								type='button'
								onClick={() =>
									navigate(
										isEdit && id
											? `/credentials/profiles/${id}`
											: '/credentials',
									)
								}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={
									isEdit ? 'credentials:update' : 'credentials:create'
								}
							>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading
										? 'Saving…'
										: isEdit
											? 'Save changes'
											: 'Create profile'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>

			{showDelete && id && existingName && (
				<HardDeleteModal
					title='Permanently delete profile'
					description='This also removes every account and attachment inside. Audit entries remain forever.'
					confirmationLabel={existingName}
					expectedConfirmation={existingName}
					onClose={() => setShowDelete(false)}
					onConfirm={async ({ confirmation, mfa }) => {
						await hardDelete({ id, confirmation, mfa }).unwrap()
						showToast('Profile deleted', 'success')
						navigate('/credentials')
					}}
				/>
			)}
		</Shell>
	)
}

const CredentialsProfileForm = ({ mode }: Props) => {
	const { id } = useParams()
	const { data, isLoading, isError } = useGetProfileQuery(id!, {
		skip: mode !== 'edit' || !id,
	})

	if (mode === 'edit' && id && isLoading)
		return <FormLoading label='Loading profile…' />
	if (mode === 'edit' && id && (isError || !data))
		return <FormNotFound label='Profile not found' />

	const initial: FormFields =
		mode === 'edit' && data
			? {
					name: data.name,
					type: data.type,
					description: data.description ?? '',
					tagsText: data.tags.join(', '),
					avatarUrl: data.avatarUrl ?? '',
				}
			: empty

	return (
		<CredentialsProfileFormInner
			mode={mode}
			id={id}
			initial={initial}
			existingName={data?.name}
			existingStatus={data?.status}
		/>
	)
}

export default CredentialsProfileForm
