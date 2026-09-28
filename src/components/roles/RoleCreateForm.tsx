import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { AdminPanelSettingsOutlined } from '@mui/icons-material'
import { TextField, Button } from '../../ui'
import Loading from '../../ui/state/Loading'
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
import RolePermissionsMatrix from './RolePermissionsMatrix'
import { RESERVED_SLUGS, SLUG_REGEX, type Role } from '../../store/roles/types'
import { useCreateRoleMutation, useListPermissionsQuery } from '../../store/roles/rolesApi'
import { extractRoleErrorMessage } from './errorMessage'
import { useToast } from '../../context/toast/ToastContext'

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

/**
 * Auto-slug from label: "Sales Lead" → "sales_lead", "AB CD 2" → "ab_cd_2".
 * Lowercases, keeps only [a-z0-9_], collapses runs of whitespace/underscores
 * to a single underscore, and strips any leading non-letter.
 */
const slugifyLabel = (input: string): string =>
	input
		.toLowerCase()
		.replace(/[^a-z0-9_\s-]/g, '')
		.trim()
		.replace(/[\s-]+/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_+/, '')
		.replace(/^[^a-z]+/, '')

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

const RoleCreateForm = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const [label, setLabel] = useState('')
	const [description, setDescription] = useState('')
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [labelTouched, setLabelTouched] = useState(false)

	const permsQuery = useListPermissionsQuery()
	const [createRole, { isLoading }] = useCreateRoleMutation()

	const derivedSlug = useMemo(() => slugifyLabel(label), [label])
	const errors = useMemo(() => validate(derivedSlug, label), [derivedSlug, label])
	const hasErrors = Boolean(errors.name || errors.label)

	const handleToggle = (key: string) => {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})
	}

	const labelError = labelTouched ? errors.label : undefined
	const slugError = labelTouched ? errors.name : undefined

	const handleLabelBlur = () => setLabelTouched(true)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setLabelTouched(true)
		const submitErrors = validate(derivedSlug, label)
		if (submitErrors.name || submitErrors.label) return
		try {
			const created = await createRole({
				name: derivedSlug,
				label: label.trim(),
				description: description.trim() || undefined,
				permissionKeys: Array.from(selected).sort(),
			}).unwrap()
			showToast(`Role "${created.label}" created`, 'success')
			navigate(`/roles/${created.id}`)
		} catch (err) {
			showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	const pickedCount = selected.size
	const submitDisabled = isLoading || (labelTouched && hasErrors)

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/roles'
					backLabel='Back to roles'
					icon={<AdminPanelSettingsOutlined />}
					title='New role'
					subtitle='Pick a unique slug, add a label, and grant an initial permission set. Permissions can be adjusted later from the editor.'
					badgeLabel='Draft'
					badgeTone='draft'
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint='How this role appears in role pickers and audit logs.'
						/>
						<IdentityGrid>
							<Field
								label='Label'
								required
								error={labelError}
								hint='Human-readable name shown in pickers'
							>
								<TextField
									name='role-label'
									placeholder='e.g. Sales Lead'
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									onBlur={handleLabelBlur}
									error={!!labelError}
									sizes='small'
									width='100%'
								/>
							</Field>

							<Field
								label='Slug'
								required
								error={slugError}
								hint='Auto-generated from Label — not editable.'
							>
								<TextField
									name='role-name'
									placeholder='auto — e.g. sales_lead'
									value={derivedSlug}
									disable
									error={!!slugError}
									sizes='small'
									width='100%'
								/>
							</Field>
						</IdentityGrid>

						<DescriptionStack>
							<Field
								label='Description'
								hint='Optional — visible to Owners in the role editor.'
							>
								<TextField
									name='role-desc'
									placeholder='What is this role for?'
									value={description}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										setDescription(e.target.value)
									}
									multiRow
									sizes='small'
									width='100%'
									style={{ minHeight: 80, resize: 'vertical' }}
								/>
							</Field>
						</DescriptionStack>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Permissions'
							hint={
								pickedCount > 0
									? `${pickedCount} permission${pickedCount === 1 ? '' : 's'} selected. Tick modules to grant access.`
									: 'Tick modules to grant access. The set can be adjusted later from the editor.'
							}
						/>
						<MatrixHost>
							{permsQuery.isLoading && <Loading label='Loading permissions…' />}
							{permsQuery.isError && (
								<PermissionsError>
									Could not load the permission catalogue.
								</PermissionsError>
							)}
							{permsQuery.data && (
								<RolePermissionsMatrix
									role={stubRole}
									catalogue={permsQuery.data}
									selected={selected}
									onToggle={handleToggle}
								/>
							)}
						</MatrixHost>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							Role will appear in the list right away.
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/roles')}
							>
								Cancel
							</Button>
							<PrimarySolidButton type='submit' disabled={submitDisabled}>
								{isLoading ? 'Creating…' : 'Create role'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default RoleCreateForm

const IdentityGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 22px 20px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`

const DescriptionStack = styled.div`
	display: flex;
	flex-direction: column;
	margin-top: 22px;
`

const MatrixHost = styled.div`
	margin-top: 4px;
`

const PermissionsError = styled.div`
	padding: 24px;
	text-align: center;
	color: #c94b4b;
	font-size: 13px;
`
