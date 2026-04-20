import { FormEvent } from 'react'
import { CloseOutlined } from '@mui/icons-material'
import Modal from '../../modal/Modal'
import ModalContentLayout from '../../users/layout/ModalContentLayout'
import Box from '../../box/Box'
import { Text, TextField, Button, Divider, IconButton } from '../../../ui'
import { useCreateBaseKnowledgeMutation } from '../../../store/baseKnowledge/baseKnowledgeApi'
import { useToast } from '../../../context/toast/ToastContext'
import useBaseKnowledgeForm from './useBaseKnowledgeForm'
import parseServerError from '../../../utils/parseServerError'

interface Props {
	onClose: () => void
	onSuccess: () => void
}

const BaseKnowledgeFormModal = ({ onClose, onSuccess }: Props) => {
	const { fields, errors, setField, runValidation } = useBaseKnowledgeForm()
	const [createBaseKnowledge, { isLoading }] = useCreateBaseKnowledgeMutation()
	const { showToast } = useToast()

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!runValidation()) return
		try {
			await createBaseKnowledge({
				title: fields.title.trim(),
				description: fields.description.trim(),
				category: fields.category.trim(),
			}).unwrap()
			showToast('Knowledge entry created successfully', 'success')
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
						<Text heading='h5'>New Knowledge Entry</Text>
						<Text varient='body2' secondary>
							Add a new record to the knowledge base
						</Text>
					</Box>
					<IconButton varient='text' size={34} fontSize={20} onClick={onClose}>
						<CloseOutlined />
					</IconButton>
				</Box>

				<Divider styles={{ margin: '0 0 1.5rem' }} />

				<form onSubmit={handleSubmit}>
					<Box display='flex' flexDirection='column' space={2}>
						<TextField
							name='title'
							label='Title'
							placeholder='Enter title'
							value={fields.title}
							onChange={(e) => setField('title', e.target.value)}
							error={!!errors.title}
							hypertext={errors.title}
							width='100%'
						/>

						<TextField
							name='category'
							label='Category'
							placeholder='e.g. templates, scripts, objections'
							value={fields.category}
							onChange={(e) => setField('category', e.target.value)}
							error={!!errors.category}
							hypertext={errors.category}
							width='100%'
						/>

						<Box display='flex' flexDirection='column' space={1}>
							<Text varient='body2' weight='medium'>
								Description
							</Text>
							<TextField
								name='description'
								placeholder='Describe what this entry is about…'
								value={fields.description}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
									setField('description', e.target.value)
								}
								error={!!errors.description}
								hypertext={errors.description}
								multiRow
								width='100%'
								style={{ minHeight: 180, resize: 'vertical' }}
							/>
						</Box>

						<Box display='flex' justify='flex-end' space={1} mt={2}>
							<Button varient='outlined' color='info' onClick={onClose} type='button'>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Saving…' : 'Save'}
							</Button>
						</Box>
					</Box>
				</form>
			</ModalContentLayout>
		</Modal>
	)
}

export default BaseKnowledgeFormModal
