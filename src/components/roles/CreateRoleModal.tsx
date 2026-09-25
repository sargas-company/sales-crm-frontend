import { FC, useEffect, useState } from 'react'
import { TextField } from '../../ui'
import FormModal from '../_shared/FormModal'
import { Field } from '../_shared/FormShell'
import { FieldStack } from '../_shared/formShell.styled'

interface Props {
	open: boolean
	onClose: () => void
	onCreate: (name: string, description: string) => void
}

const CreateRoleModal: FC<Props> = ({ open, onClose, onCreate }) => {
	const [name, setName] = useState('')
	const [desc, setDesc] = useState('')
	const [error, setError] = useState<string | undefined>()

	useEffect(() => {
		if (open) {
			setName('')
			setDesc('')
			setError(undefined)
		}
	}, [open])

	if (!open) return null

	const submit = () => {
		if (!name.trim()) {
			setError('Name is required')
			return
		}
		onCreate(name.trim(), desc.trim())
	}

	return (
		<FormModal
			title='New role'
			subtitle="Name and a short description. You'll set up the permissions on the next screen."
			badgeLabel='Draft'
			badgeTone='draft'
			onClose={onClose}
			onSubmit={submit}
			submitLabel='Create and configure'
			maxWidth={560}
		>
			<FieldStack>
				<Field label='Name' required error={error}>
					<TextField
						name='role-name'
						value={name}
						onChange={(e) => {
							setName(e.target.value)
							if (error) setError(undefined)
						}}
						placeholder='e.g. Sales Lead'
						width='100%'
						error={!!error}
					/>
				</Field>
				<Field label='Description' hint='optional'>
					<TextField
						name='role-desc'
						value={desc}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							setDesc(e.target.value)
						}
						placeholder='What this role does (for your team)'
						multiRow
						width='100%'
						style={{ minHeight: 120, resize: 'vertical' }}
					/>
				</Field>
			</FieldStack>
		</FormModal>
	)
}

export default CreateRoleModal
