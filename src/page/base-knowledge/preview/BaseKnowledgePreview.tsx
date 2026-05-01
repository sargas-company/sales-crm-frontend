import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
	ArrowBackOutlined,
	CalendarTodayOutlined,
	UpdateOutlined,
	CategoryOutlined,
	EditOutlined,
	DeleteOutline,
} from '@mui/icons-material'
import { useGetBaseKnowledgeItemQuery } from '../../../store/baseKnowledge/baseKnowledgeApi'
import BaseKnowledgeEditModal from '../../../components/base-knowledge/form/BaseKnowledgeEditModal'
import BaseKnowledgeDeleteModal from '../../../components/base-knowledge/form/BaseKnowledgeDeleteModal'
import Card from '../../../components/card/Card'
import Box from '../../../components/box/Box'
import { Text, Chip, Button, Divider } from '../../../ui'
import styled from 'styled-components'

const formatDate = (iso: string) =>
	new Date(iso).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})

const BaseKnowledgePreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [editOpen, setEditOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)

	const { data: item, isLoading, isError, refetch } = useGetBaseKnowledgeItemQuery(id!)

	if (isLoading) {
		return (
			<Card padding='2rem'>
				<Text secondary>Loading…</Text>
			</Card>
		)
	}

	if (isError || !item) {
		return (
			<Card padding='2rem'>
				<Box display='flex' flexDirection='column' space={2}>
					<Text heading='h5'>Record not found</Text>
					<Button varient='outlined' onClick={() => navigate('/knowledge/list')}>
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
					<Button varient='text' onClick={() => navigate('/knowledge/list')}>
						<Box display='flex' align='center' space={1}>
							<ArrowBackOutlined style={{ fontSize: 18 }} />
							<span>Back to list</span>
						</Box>
					</Button>
					<Box display='flex' space={1}>
						<Button onClick={() => setEditOpen(true)}>
							<Box display='flex' align='center' space={1}>
								<EditOutlined style={{ fontSize: 16 }} />
								<span>Edit</span>
							</Box>
						</Button>
						<Button color='error' varient='outlined' onClick={() => setDeleteOpen(true)}>
							<Box display='flex' align='center' space={1}>
								<DeleteOutline style={{ fontSize: 16 }} />
								<span>Delete</span>
							</Box>
						</Button>
					</Box>
				</Box>

				{/* Main card */}
				<Card padding='2rem'>
					{/* Header */}
					<Box display='flex' flexDirection='column' space={2} mb={8}>
						<Box display='flex' align='center' space={2}>
							<Text heading='h4'>{item.title}</Text>
							{item.category && (
								<Chip label={item.category} skin='light' color='info' size='small' />
							)}
						</Box>

						{/* Meta */}
						<MetaRow>
							<MetaItem>
								<CalendarTodayOutlined style={{ fontSize: 15 }} />
								<Text varient='body2' secondary>
									Created: {formatDate(item.createdAt)}
								</Text>
							</MetaItem>
							<MetaItem>
								<UpdateOutlined style={{ fontSize: 15 }} />
								<Text varient='body2' secondary>
									Updated: {formatDate(item.updatedAt)}
								</Text>
							</MetaItem>
							{item.category && (
								<MetaItem>
									<CategoryOutlined style={{ fontSize: 15 }} />
									<Text varient='body2' secondary>
										{item.category}
									</Text>
								</MetaItem>
							)}
						</MetaRow>
					</Box>

					<Divider styles={{ margin: '0 0 1.5rem' }} />

					{/* Content */}
					{item.content ? (
						<Box display='flex' flexDirection='column' space={2}>
							<Text varient='subtitle1' weight='medium'>
								Content
							</Text>
							<DescriptionText>{item.content}</DescriptionText>
						</Box>
					) : (
						<Text secondary>No content provided.</Text>
					)}
				</Card>
			</Box>

			{editOpen && (
				<BaseKnowledgeEditModal
					id={item.id}
					onClose={() => setEditOpen(false)}
					onSuccess={refetch}
				/>
			)}
			{deleteOpen && (
				<BaseKnowledgeDeleteModal
					id={item.id}
					title={item.title}
					onClose={() => setDeleteOpen(false)}
					onSuccess={() => navigate('/knowledge/list')}
				/>
			)}
		</>
	)
}

export default BaseKnowledgePreview

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

const DescriptionText = styled.p`
	margin: 0;
	line-height: 1.75;
	white-space: pre-wrap;
	font-size: 0.95rem;
`
