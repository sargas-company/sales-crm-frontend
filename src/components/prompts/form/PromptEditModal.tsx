import { FormEvent, useEffect, useState } from 'react'
import { CloseOutlined } from '@mui/icons-material'
import Modal from '../../modal/Modal'
import ModalContentLayout from '../../users/layout/ModalContentLayout'
import Box from '../../box/Box'
import { Text, TextField, Button, Divider, IconButton } from '../../../ui'
import { useUpdatePromptMutation } from '../../../store/prompts/promptsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

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

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
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
		<Modal handleOutClick={onClose}>
			<ModalContentLayout maxWidth='680px'>
				<Box display='flex' justify='space-between' align='center' mb={4}>
					<Box>
						<Text heading='h5'>Edit Prompt</Text>
						<Text varient='body2' secondary>
							Editing creates a new version
						</Text>
					</Box>
					<IconButton varient='text' size={34} fontSize={20} onClick={onClose}>
						<CloseOutlined />
					</IconButton>
				</Box>

				<Divider styles={{ margin: '0 0 1.5rem' }} />

				<form onSubmit={handleSubmit}>
					<Box display='flex' flexDirection='column' space={2}>
						<Box display='flex' flexDirection='column' space={1}>
							<Text varient='body2' weight='medium'>
								Content *
							</Text>
							<TextField
								name='content'
								placeholder='Enter the prompt text…'
								value={content}
								onChange={(e) => {
									setContent(e.target.value)
									if (error) setError(undefined)
								}}
								error={!!error}
								hypertext={error}
								multiRow
								width='100%'
								style={{ minHeight: 260, resize: 'vertical' }}
							/>
						</Box>

						<Box display='flex' justify='flex-end' space={1} mt={2}>
							<Button varient='outlined' color='info' type='button' onClick={onClose}>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Saving…' : 'Save changes'}
							</Button>
						</Box>
					</Box>
				</form>
			</ModalContentLayout>
		</Modal>
	)
}

export default PromptEditModal
