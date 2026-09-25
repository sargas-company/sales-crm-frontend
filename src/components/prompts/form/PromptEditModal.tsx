import { FormEvent, useEffect, useState } from 'react'
import { TextField } from '../../../ui'
import { useUpdatePromptMutation } from '../../../store/prompts/promptsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import FormModal from '../../_shared/FormModal'
import { Field } from '../../_shared/FormShell'
import { FieldStack } from '../../_shared/formShell.styled'

interface Props {
	id: string
	initialContent: string
	onClose: () => void
	onSuccess: () => void
}

const PromptEditModal = ({ id, initialContent, onClose, onSuccess }: Props) => {
	const { showToast } = useToast()
	const [updatePrompt, { isLoading }] = useUpdatePromptMutation()
	const [content, setContent] = useState(initialContent)
	const [error, setError] = useState<string | undefined>()

	useEffect(() => {
		setContent(initialContent)
	}, [initialContent])

	const handleSubmit = async (_e: FormEvent) => {
		if (!content.trim()) {
			setError('Content is required')
			return
		}
		if (content.trim().length < 10) {
			setError('Content must be at least 10 characters')
			return
		}
		try {
			await updatePrompt({ id, body: { content: content.trim() } }).unwrap()
			showToast('Prompt updated successfully', 'success')
			onSuccess()
			onClose()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<FormModal
			title='Edit prompt'
			subtitle='Editing creates a new version'
			badgeLabel='Editing'
			badgeTone='edit'
			onClose={onClose}
			onSubmit={handleSubmit}
			submitLabel='Save changes'
			submitLoadingLabel='Saving…'
			isLoading={isLoading}
			maxWidth={720}
		>
			<FieldStack>
				<Field
					label='Content'
					required
					error={error}
					hint={`${content.length} characters`}
				>
					<TextField
						name='content'
						placeholder='Enter the prompt text…'
						value={content}
						onChange={(e) => {
							setContent(e.target.value)
							if (error) setError(undefined)
						}}
						error={!!error}
						multiRow
						width='100%'
						style={{
							minHeight: 280,
							resize: 'vertical',
							fontFamily:
								"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
							fontSize: 13,
						}}
					/>
				</Field>
			</FieldStack>
		</FormModal>
	)
}

export default PromptEditModal
