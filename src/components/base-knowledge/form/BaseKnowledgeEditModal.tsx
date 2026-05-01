import { FormEvent, useEffect } from 'react'
import { CloseOutlined } from '@mui/icons-material'
import Modal from '../../modal/Modal'
import ModalContentLayout from '../../users/layout/ModalContentLayout'
import Box from '../../box/Box'
import { Text, TextField, Button, Divider, IconButton } from '../../../ui'
import {
	useGetBaseKnowledgeItemQuery,
	useUpdateBaseKnowledgeMutation,
} from '../../../store/baseKnowledge/baseKnowledgeApi'
import { useToast } from '../../../context/toast/ToastContext'
import useBaseKnowledgeForm from './useBaseKnowledgeForm'
import parseServerError from '../../../utils/parseServerError'

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

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
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
		<Modal handleOutClick={onClose}>
			<ModalContentLayout maxWidth='560px'>
				<Box display='flex' justify='space-between' align='center' mb={4}>
					<Box>
						<Text heading='h5'>Edit Knowledge Entry</Text>
						<Text varient='body2' secondary>
							Update the record details
						</Text>
					</Box>
					<IconButton varient='text' size={34} fontSize={20} onClick={onClose}>
						<CloseOutlined />
					</IconButton>
				</Box>

				<Divider styles={{ margin: '0 0 1.5rem' }} />

				{isFetching ? (
					<Box padding={20}>
						<Text secondary>Loading…</Text>
					</Box>
				) : (
					<form onSubmit={handleSubmit}>
						<Box display='flex' flexDirection='column' space={2}>
							<TextField
								name='title'
								label='Title (optional)'
								placeholder='Enter title'
								value={fields.title}
								onChange={(e) => setField('title', e.target.value)}
								error={!!errors.title}
								hypertext={errors.title}
								width='100%'
							/>

							<TextField
								name='category'
								label='Category (optional)'
								placeholder='e.g. templates, scripts, objections'
								value={fields.category}
								onChange={(e) => setField('category', e.target.value)}
								error={!!errors.category}
								hypertext={errors.category}
								width='100%'
							/>

							<Box display='flex' flexDirection='column' space={1}>
								<Text varient='body2' weight='medium'>
									Content
								</Text>
								<TextField
									name='content'
									placeholder='Enter the knowledge content…'
									value={fields.content}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										setField('content', e.target.value)
									}
									error={!!errors.content}
									hypertext={errors.content}
									multiRow
									width='100%'
									style={{ minHeight: 180, resize: 'vertical' }}
								/>
							</Box>

							<Box display='flex' justify='flex-end' space={1} mt={2}>
								<Button varient='outlined' color='info' onClick={onClose} type='button'>
									Cancel
								</Button>
								<Button type='submit' disabled={isSaving}>
									{isSaving ? 'Saving…' : 'Save changes'}
								</Button>
							</Box>
						</Box>
					</form>
				)}
			</ModalContentLayout>
		</Modal>
	)
}

export default BaseKnowledgeEditModal
