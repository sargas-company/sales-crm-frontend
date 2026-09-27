import { FormEvent, useMemo, useState } from 'react'
import styled from 'styled-components'
import Modal from '../../ui/overlay/Modal'
import SectionCard from '../../ui/surface/SectionCard'
import Input from '../../ui/form/Input'
import Loading from '../../ui/state/Loading'
import { Button } from '../../ui'
import RolePermissionsMatrix from './RolePermissionsMatrix'
import { RESERVED_SLUGS, SLUG_REGEX, type Role } from '../../store/roles/types'
import { useCreateRoleMutation, useListPermissionsQuery } from '../../store/roles/rolesApi'
import { extractRoleErrorMessage } from './errorMessage'
import { useToast } from '../../context/toast/ToastContext'

interface Props {
	onClose: () => void
	onCreated: (role: Role) => void
}

interface FieldErrors {
	name?: string
	label?: string
}

const stubRole: Role = {
	id: '',
	name: 'new',
	label: '',
	description: null,
	system: false,
	createdAt: '',
	updatedAt: '',
	permissions: [],
	userCount: 0,
}

const validate = (name: string, label: string): FieldErrors => {
	const errors: FieldErrors = {}
	if (name.length === 0) {
		errors.name = 'Slug is required.'
	} else if (!SLUG_REGEX.test(name)) {
		errors.name = 'Lowercase letters, digits, underscores; starts with a letter.'
	} else if (RESERVED_SLUGS.has(name)) {
		errors.name = 'This slug is reserved for a system role.'
	}
	if (label.trim().length === 0) {
		errors.label = 'Label is required.'
	}
	return errors
}

const CreateRoleModal = ({ onClose, onCreated }: Props) => {
	const [name, setName] = useState('')
	const [label, setLabel] = useState('')
	const [description, setDescription] = useState('')
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [touched, setTouched] = useState<Record<string, boolean>>({})

	const permsQuery = useListPermissionsQuery()
	const [createRole, { isLoading }] = useCreateRoleMutation()
	const toast = useToast()

	const normalizedName = name.trim()
	const errors = useMemo(() => validate(normalizedName, label), [normalizedName, label])
	const hasErrors = Boolean(errors.name || errors.label)

	const handleToggle = (key: string) => {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})
	}

	const showError = (field: keyof FieldErrors) => (touched[field] ? errors[field] : undefined)

	const handleSlugBlur = () => {
		if (name !== normalizedName) setName(normalizedName)
		setTouched((t) => ({ ...t, name: true }))
	}

	const handleLabelBlur = () => {
		setTouched((t) => ({ ...t, label: true }))
	}

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setTouched({ name: true, label: true })
		const trimmedName = normalizedName
		if (name !== trimmedName) setName(trimmedName)
		const submitErrors = validate(trimmedName, label)
		if (submitErrors.name || submitErrors.label) return
		try {
			const created = await createRole({
				name: trimmedName,
				label: label.trim(),
				description: description.trim() || undefined,
				permissionKeys: Array.from(selected).sort(),
			}).unwrap()
			onCreated(created)
		} catch (err) {
			toast.showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	return (
		<Modal handleOutClick={onClose}>
			<Shell role='dialog' aria-labelledby='create-role-title'>
				<Header>
					<Title id='create-role-title'>Create role</Title>
					<Subtitle>
						System-role slugs are reserved. Pick a unique lowercase slug and grant an initial
						permission set — permissions can be adjusted later from the editor.
					</Subtitle>
				</Header>

				<Form onSubmit={handleSubmit} noValidate>
					<Body>
						<SectionCard title='Identity' padding='md'>
							<Field>
								<FieldLabel htmlFor='role-name'>Slug</FieldLabel>
								<Input
									type='text'
									name='role-name'
									id='role-name'
									placeholder='e.g. sales_lead'
									value={name}
									onChange={(e) => setName(e.target.value)}
									onBlur={handleSlugBlur}
									sizes='small'
								/>
								<Helper $error={Boolean(showError('name'))}>
									{showError('name') ??
										'Lowercase letters, digits, underscores; starts with a letter.'}
								</Helper>
							</Field>

							<Field>
								<FieldLabel htmlFor='role-label'>Label</FieldLabel>
								<Input
									type='text'
									name='role-label'
									id='role-label'
									placeholder='Human-readable name'
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									onBlur={handleLabelBlur}
									sizes='small'
								/>
								<Helper $error={Boolean(showError('label'))}>
									{showError('label') ?? 'Shown throughout the app in role pickers.'}
								</Helper>
							</Field>

							<Field>
								<FieldLabel htmlFor='role-desc'>Description</FieldLabel>
								<Input
									type='text'
									name='role-desc'
									id='role-desc'
									placeholder='Optional — what this role is for'
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									sizes='small'
								/>
								<Helper>Visible to Owners in the role editor only.</Helper>
							</Field>
						</SectionCard>

						<SectionCard title='Permissions' padding='md'>
							{permsQuery.isLoading && <Loading label='Loading permissions…' />}
							{permsQuery.isError && (
								<HelperCentered>Could not load the permission catalogue.</HelperCentered>
							)}
							{permsQuery.data && (
								<RolePermissionsMatrix
									role={stubRole}
									catalogue={permsQuery.data}
									selected={selected}
									onToggle={handleToggle}
								/>
							)}
						</SectionCard>
					</Body>

					<Actions>
						<Button type='button' varient='outlined' onClick={onClose}>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={isLoading || (hasErrors && (touched.name || touched.label))}
						>
							{isLoading ? 'Creating…' : 'Create role'}
						</Button>
					</Actions>
				</Form>
			</Shell>
		</Modal>
	)
}

export default CreateRoleModal

const Shell = styled.div`
	background: ${({ theme }) => theme.colors!.bg.surface};
	border: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ theme }) => theme.radius!.lg}px;
	box-shadow: ${({ theme }) => theme.shadow!.lg};
	width: min(780px, calc(100vw - 32px));
	max-height: calc(100vh - 64px);
	display: flex;
	flex-direction: column;
	overflow: hidden;
`

const Header = styled.div`
	padding: ${({ theme }) => theme.spacing!.lg}px ${({ theme }) => theme.spacing!.xl}px
		${({ theme }) => theme.spacing!.md}px;
	border-bottom: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
`

const Title = styled.h3`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.primary};
	font: ${({ theme }) => theme.typography!.h3.fontWeight}
		${({ theme }) => theme.typography!.h3.fontSize} /
		${({ theme }) => theme.typography!.h3.lineHeight}
		${({ theme }) => theme.typography!.h3.fontFamily};
`

const Subtitle = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
	line-height: 1.5;
`

const Form = styled.form`
	display: flex;
	flex-direction: column;
	min-height: 0;
	flex: 1;
`

const Body = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.md}px;
	padding: ${({ theme }) => theme.spacing!.lg}px ${({ theme }) => theme.spacing!.xl}px;
	overflow-y: auto;
	min-height: 0;
`

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
`

const FieldLabel = styled.label`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
	text-transform: uppercase;
	letter-spacing: ${({ theme }) => theme.typography!.caption.letterSpacing};
	font-weight: 600;
`

const Helper = styled.span<{ $error?: boolean }>`
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
	color: ${({ theme, $error }) =>
		$error ? theme.colors!.status.danger : theme.colors!.text.secondary};
`

const HelperCentered = styled(Helper)`
	text-align: center;
	padding: ${({ theme }) => theme.spacing!.md}px 0;
`

const Actions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	padding: ${({ theme }) => theme.spacing!.md}px ${({ theme }) => theme.spacing!.xl}px
		${({ theme }) => theme.spacing!.lg}px;
	border-top: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	background: ${({ theme }) => theme.colors!.bg.canvas};
`
