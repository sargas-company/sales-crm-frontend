import { FormEvent, useState } from 'react'
import styled from 'styled-components'
import Modal from '../../ui/overlay/Modal'
import Input from '../../ui/form/Input'
import { Button } from '../../ui'
import { RESERVED_SLUGS, SLUG_REGEX, type Role } from '../../store/roles/types'
import { useCreateRoleMutation } from '../../store/roles/rolesApi'
import { extractRoleErrorMessage } from './errorMessage'
import { useToast } from '../../context/toast/ToastContext'

interface Props {
	onClose: () => void
	onCreated: (role: Role) => void
}

const CreateRoleModal = ({ onClose, onCreated }: Props) => {
	const [name, setName] = useState('')
	const [label, setLabel] = useState('')
	const [description, setDescription] = useState('')
	const [clientError, setClientError] = useState<string | null>(null)
	const [createRole, { isLoading }] = useCreateRoleMutation()
	const toast = useToast()

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setClientError(null)
		if (!SLUG_REGEX.test(name)) {
			setClientError('Slug must be lowercase [a-z0-9_] starting with a letter.')
			return
		}
		if (RESERVED_SLUGS.has(name)) {
			setClientError('This slug is reserved for a system role.')
			return
		}
		if (label.trim().length === 0) {
			setClientError('Label is required.')
			return
		}
		try {
			const created = await createRole({
				name,
				label: label.trim(),
				description: description.trim() || undefined,
				permissionKeys: [],
			}).unwrap()
			onCreated(created)
		} catch (err) {
			toast.showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	return (
		<Modal handleOutClick={onClose}>
			<Card>
				<Title>Create custom role</Title>
				<Hint>Grant permissions after creating the role from the editor page.</Hint>
				<form onSubmit={handleSubmit}>
					<Field>
						<label>Slug</label>
						<Input
							type='text'
							name='role-name'
							placeholder='e.g. sales_lead'
							value={name}
							onChange={(e) => setName(e.target.value)}
							sizes='small'
						/>
					</Field>
					<Field>
						<label>Label</label>
						<Input
							type='text'
							name='role-label'
							placeholder='Human-readable name'
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							sizes='small'
						/>
					</Field>
					<Field>
						<label>Description</label>
						<Input
							type='text'
							name='role-desc'
							placeholder='Optional'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							sizes='small'
						/>
					</Field>
					{clientError && <ErrorText>{clientError}</ErrorText>}
					<Actions>
						<Button type='button' varient='outlined' onClick={onClose}>
							Cancel
						</Button>
						<Button type='submit' disabled={isLoading}>
							{isLoading ? 'Creating…' : 'Create'}
						</Button>
					</Actions>
				</form>
			</Card>
		</Modal>
	)
}

export default CreateRoleModal

const Card = styled.div`
	background: ${({ theme }) => theme.colors!.bg.surface};
	border: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ theme }) => theme.radius!.lg}px;
	box-shadow: ${({ theme }) => theme.shadow!.lg};
	padding: ${({ theme }) => theme.spacing!.xl}px;
	width: min(480px, calc(100vw - ${({ theme }) => theme.spacing!.xl * 2}px));
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.md}px;
`

const Title = styled.h3`
	margin: 0;
	font: ${({ theme }) => theme.typography!.h3.fontWeight}
		${({ theme }) => theme.typography!.h3.fontSize} /
		${({ theme }) => theme.typography!.h3.lineHeight}
		${({ theme }) => theme.typography!.h3.fontFamily};
	color: ${({ theme }) => theme.colors!.text.primary};
`

const Hint = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
`

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
	margin-bottom: ${({ theme }) => theme.spacing!.sm}px;

	label {
		color: ${({ theme }) => theme.colors!.text.secondary};
		font-size: ${({ theme }) => theme.typography!.caption.fontSize};
		text-transform: uppercase;
		letter-spacing: ${({ theme }) => theme.typography!.caption.letterSpacing};
	}
`

const ErrorText = styled.div`
	color: ${({ theme }) => theme.colors!.status.danger};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
	margin-bottom: ${({ theme }) => theme.spacing!.sm}px;
`

const Actions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	margin-top: ${({ theme }) => theme.spacing!.md}px;
`
