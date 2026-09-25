import { FormEvent, useEffect } from 'react'
import { TextField } from '../../../ui'
import {
	useGetBaseKnowledgeItemQuery,
	useUpdateBaseKnowledgeMutation,
} from '../../../store/baseKnowledge/baseKnowledgeApi'
import { useToast } from '../../../context/toast/ToastContext'
import useBaseKnowledgeForm from './useBaseKnowledgeForm'
import parseServerError from '../../../utils/parseServerError'
import FormModal from '../../_shared/FormModal'
import { Field } from '../../_shared/FormShell'
import { FieldGrid, FieldStack } from '../../_shared/formShell.styled'

interface Props {
	id: string
	onClose: () => void
	onSuccess: () => void
}

const BaseKnowledgeEditModal = ({ id, onClose, onSuccess }: Props) => {
	const { data: item, isLoading: isFetching } = useGetBaseKnowledgeItemQuery(id)
	const [updateBaseKnowledge, { isLoading: isSaving }] = useUpdateBaseKnowledgeMutation()
	const { showToast } = useToast()

	const { fields, errors, setField, runValidation, reset } = useBaseKnowledgeForm()

	useEffect(() => {
		if (item) {
			reset({
				title: item.title,
				content: item.content ?? '',
				category: item.category ?? '',
			})
		}
	}, [item])

	const handleSubmit = async (_e: FormEvent) => {
		if (!runValidation()) return
		try {
			await updateBaseKnowledge({
				id,
				body: {
					title: fields.title.trim(),
					content: fields.content.trim(),
					category: fields.category.trim(),
				},
			}).unwrap()
			showToast('Entry updated successfully', 'success')
			onSuccess()
			onClose()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<FormModal
			title='Edit knowledge entry'
			subtitle='Update the record details'
			badgeLabel='Editing'
			badgeTone='edit'
			onClose={onClose}
			onSubmit={handleSubmit}
			submitLabel='Save changes'
			submitLoadingLabel='Saving…'
			isLoading={isSaving}
			isSubmitDisabled={isFetching}
		>
			{isFetching ? (
				<div style={{ padding: 20 }}>Loading…</div>
			) : (
				<>
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
				</>
			)}
		</FormModal>
	)
}

export default BaseKnowledgeEditModal
