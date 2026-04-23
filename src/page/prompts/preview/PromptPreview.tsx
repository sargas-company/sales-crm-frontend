import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
	ArrowBackOutlined,
	CalendarTodayOutlined,
	UpdateOutlined,
	PersonOutlined,
	EditOutlined,
} from '@mui/icons-material'
import Card from '../../../components/card/Card'
import Box from '../../../components/box/Box'
import { Text, Chip, Button, Divider } from '../../../ui'
import PromptActiveChip from '../../../components/prompts/list/PromptActiveChip'
import PromptEditModal from '../../../components/prompts/form/PromptEditModal'
import { useGetPromptByIdQuery, useActivatePromptMutation } from '../../../store/prompts/promptsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import { formatDate } from '../../../utils/formatDate'
import styled from 'styled-components'

const PromptPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [editOpen, setEditOpen] = useState(false)

	const { data: prompt, isLoading, isError, refetch } = useGetPromptByIdQuery(id!, { skip: !id })
	const [activatePrompt, { isLoading: isActivating }] = useActivatePromptMutation()
	const { showToast } = useToast()

	const handleActivate = async () => {
		try {
			await activatePrompt(id!).unwrap()
			showToast('Prompt activated successfully', 'success')
			refetch()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	if (isLoading) {
		return (
			<Card padding='2rem'>
				<Text secondary>Loading…</Text>
			</Card>
		)
	}

	if (isError || !prompt) {
		return (
			<Card padding='2rem'>
				<Box display='flex' flexDirection='column' space={2}>
					<Text heading='h5'>Prompt not found</Text>
					<Button varient='outlined' onClick={() => navigate('/prompts/list')}>
						Back to list
					</Button>
				</Box>
			</Card>
		)
	}

	return (
		<>
			<Box display='flex' flexDirection='column' space={2}>
				{/* Toolbar */}
				<Box display='flex' justify='space-between' align='center'>
					<Button varient='text' onClick={() => navigate('/prompts/list')}>
						<Box display='flex' align='center' space={1}>
							<ArrowBackOutlined style={{ fontSize: 18 }} />
							<span>Back to list</span>
						</Box>
					</Button>
					<Box display='flex' align='center' space={1}>
						{!prompt.isActive && (
							<Button
								color='success'
								varient='outlined'
								onClick={handleActivate}
								disabled={isActivating}
							>
								{isActivating ? 'Activating…' : 'Activate'}
							</Button>
						)}
						<Button onClick={() => setEditOpen(true)}>
							<Box display='flex' align='center' space={1}>
								<EditOutlined style={{ fontSize: 16 }} />
								<span>Edit</span>
							</Box>
						</Button>
					</Box>
				</Box>

				{/* Main card */}
				<Card padding='2rem'>
					{/* Header */}
					<Box display='flex' flexDirection='column' space={2} mb={6}>
						<Box display='flex' align='center' space={2} style={{ flexWrap: 'wrap', gap: 10 }}>
							<Text heading='h4'>{prompt.title}</Text>
							<Chip
								label={prompt.type}
								skin='light'
								color='info'
								size='small'
								styles={{ fontSize: 11 }}
							/>
							<PromptActiveChip isActive={prompt.isActive} />
							<Chip
								label={`v${prompt.version}`}
								skin='light'
								color='secondary'
								size='small'
							/>
						</Box>

						{/* Meta */}
						<MetaRow>
							<MetaItem>
								<CalendarTodayOutlined style={{ fontSize: 15 }} />
								<Text varient='body2' secondary>
									Created: {formatDate(prompt.createdAt)}
								</Text>
							</MetaItem>
							<MetaItem>
								<UpdateOutlined style={{ fontSize: 15 }} />
								<Text varient='body2' secondary>
									Updated: {formatDate(prompt.updatedAt)}
								</Text>
							</MetaItem>
							<MetaItem>
								<PersonOutlined style={{ fontSize: 15 }} />
								<Text varient='body2' secondary>
									By: {prompt.createdBy}
									{prompt.updatedBy && ` · edited by ${prompt.updatedBy}`}
								</Text>
							</MetaItem>
						</MetaRow>
					</Box>

					<Divider styles={{ margin: '0 0 1.5rem' }} />

					{/* Content */}
					<Box display='flex' flexDirection='column' space={2}>
						<Text varient='subtitle1' weight='medium'>
							Content
						</Text>
						<ContentBlock>{prompt.content}</ContentBlock>
					</Box>
				</Card>
			</Box>

			{editOpen && (
				<PromptEditModal
					id={prompt.id}
					initialContent={prompt.content}
					onClose={() => setEditOpen(false)}
					onSuccess={refetch}
				/>
			)}
		</>
	)
}

export default PromptPreview

const MetaRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1.2rem;
`

const MetaItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.4rem;
	opacity: 0.75;
`

const ContentBlock = styled.pre`
	margin: 0;
	line-height: 1.75;
	white-space: pre-wrap;
	word-break: break-word;
	font-family: inherit;
	font-size: 0.95rem;
	background: rgba(0, 0, 0, 0.03);
	border-radius: 8px;
	padding: 1.2rem 1.4rem;
`
