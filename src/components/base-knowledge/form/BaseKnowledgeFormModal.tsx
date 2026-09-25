import { FormEvent } from 'react'
import { TextField } from '../../../ui'
import { useCreateBaseKnowledgeMutation } from '../../../store/baseKnowledge/baseKnowledgeApi'
import { useToast } from '../../../context/toast/ToastContext'
import useBaseKnowledgeForm from './useBaseKnowledgeForm'
import parseServerError from '../../../utils/parseServerError'
import FormModal from '../../_shared/FormModal'
import { Field } from '../../_shared/FormShell'
import { FieldGrid, FieldStack } from '../../_shared/formShell.styled'

interface Props {
	onClose: () => void
	onSuccess: () => void
}

const BaseKnowledgeFormModal = ({ onClose, onSuccess }: Props) => {
	const { fields, errors, setField, runValidation } = useBaseKnowledgeForm()
	const [createBaseKnowledge, { isLoading }] = useCreateBaseKnowledgeMutation()
	const { showToast } = useToast()

	const handleSubmit = async (_e: FormEvent) => {
		if (!runValidation()) return
		try {
			await createBaseKnowledge({
				...(fields.title.trim() && { title: fields.title.trim() }),
				content: fields.content.trim(),
				...(fields.category.trim() && { category: fields.category.trim() }),
			}).unwrap()
			showToast('Knowledge entry created successfully', 'success')
			onSuccess()
			onClose()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<FormModal
			title='New knowledge entry'
			subtitle='Add a new record to the knowledge base'
			badgeLabel='Draft'
			badgeTone='draft'
			onClose={onClose}
			onSubmit={handleSubmit}
			submitLabel='Save'
			submitLoadingLabel='Saving…'
			isLoading={isLoading}
		>
			<FieldGrid>
				<Field label='Title (optional)' error={errors.title}>
					<TextField
						name='title'
						placeholder='Enter title'
						value={fields.title}
						onChange={(e) => setField('title', e.target.value)}
						error={!!errors.title}
						width='100%'
					/>
				</Field>
				<Field label='Category (optional)' error={errors.category}>
					<TextField
						name='category'
						placeholder='e.g. templates, scripts, objections'
						value={fields.category}
						onChange={(e) => setField('category', e.target.value)}
						error={!!errors.category}
						width='100%'
					/>
				</Field>
			</FieldGrid>

			<FieldStack>
				<Field
					label='Content'
					required
					error={errors.content}
					hint={`${fields.content.length} characters`}
				>
					<TextField
						name='content'
						placeholder='Enter the knowledge content…'
						value={fields.content}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							setField('content', e.target.value)
						}
						error={!!errors.content}
						multiRow
						width='100%'
						style={{ minHeight: 200, resize: 'vertical' }}
					/>
				</Field>
			</FieldStack>
		</FormModal>
	)
}

export default BaseKnowledgeFormModal
