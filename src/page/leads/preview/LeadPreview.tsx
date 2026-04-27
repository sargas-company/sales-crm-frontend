import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
	InfoOutlined,
	ChatOutlined,
	ArrowBackOutlined,
	EditOutlined,
	ContentCopy,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import Box from '../../../components/box/Box'
import Card from '../../../components/card/Card'
import PreviewMain from '../../../components/leads/preview/PreviewMain'
import LeadChat from '../../../components/leads/preview/LeadChat'
import LeadListItemStatus from '../../../components/leads/list/LeadListItemStatus'
import LeadListItemClientType from '../../../components/leads/list/LeadListItemClientType'
import { Button, Tab, TabList, TabItem, TabContent, Text, IconButton } from '../../../ui'
import { useGetLeadByIdQuery } from '../../../store/leads/leadsApi'
import { formatDate, shortUuid } from '../../../utils/formatDate'
import ModelSwitcher from '../../../components/chat/api-chat/ModelSwitcher'
import DetailsPopover from '../../../components/chat/api-chat/DetailsPopover'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { fetchProposalHistory } from '../../../store/chats/apiChatSlice'

const LeadPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState(1)
	const [model, setModel] = useState('claude-sonnet-4-6')

	const dispatch = useAppDispatch()
	const chatContext = useAppSelector((state) => state.apiChat.chatContext)

	const { data: lead, isLoading, isError } = useGetLeadByIdQuery(id!, { skip: !id })

	useEffect(() => {
		if (lead?.proposalId) {
			dispatch(fetchProposalHistory(lead.proposalId))
		}
	}, [lead?.proposalId, dispatch])

	if (isLoading) {
		return (
			<Card py='2rem' px='2rem'>
				<Box style={{ maxWidth: 900, margin: '0 auto' }}>
					<Text secondary>Loading lead…</Text>
				</Box>
			</Card>
		)
	}

	if (isError || !lead) {
		return (
			<Card py='2rem' px='2rem'>
				<Box
					style={{ maxWidth: 900, margin: '0 auto' }}
					display='flex'
					flexDirection='column'
					align='center'
					space={3}
				>
					<Text heading='h6'>Lead not found</Text>
					<Button varient='outlined' color='info' onClick={() => navigate('/leads/list')}>
						Back to list
					</Button>
				</Box>
			</Card>
		)
	}

	return (
		<Card py='2rem' px='2rem'>
			<Box style={{ maxWidth: 900, margin: '0 auto' }}>
				{/* ── Header ── */}
				<Box display='flex' flexDirection='column' space={2} mb={4}>
					{/* Row 1: back button + title + subtitle */}
					<Box display='flex' align='center' space={3}>
						<IconButton
							varient='text'
							size={34}
							fontSize={20}
							onClick={() => navigate('/leads/list')}
						>
							<ArrowBackOutlined />
						</IconButton>
						<Box>
							<Text heading='h5'>
								{[lead.firstName, lead.lastName].filter(Boolean).join(' ') ||
									`Lead #${lead.number}`}
							</Text>
							<Box display='flex' align='center' space={1} style={{ marginTop: 2 }}>
								<Text varient='caption' secondary>
									#{lead.number} · {formatDate(lead.repliedAt)} ·
								</Text>
								<Tooltip title={lead.id} placement='top'>
									<span>
										<Text
											varient='caption'
											secondary
											styles={{ fontFamily: 'monospace' }}
										>
											{shortUuid(lead.id)}
										</Text>
									</span>
								</Tooltip>
								<IconButton
									varient='text'
									size={22}
									fontSize={13}
									contentOpacity={5}
									onClick={() => navigator.clipboard.writeText(lead.id)}
								>
									<ContentCopy style={{ fontSize: 12 }} />
								</IconButton>
							</Box>
						</Box>
					</Box>

					{/* Row 2: chips left, Edit button right */}
					<Box display='flex' align='center' justify='space-between'>
						<Box display='flex' align='center' space={2} style={{ flexWrap: 'wrap', gap: 8 }}>
							<LeadListItemStatus itemStatus={lead.status} />
							{lead.clientType && <LeadListItemClientType clientType={lead.clientType} />}
						</Box>
						<Button
							varient='outlined'
							color='info'
							onClick={() => navigate(`/leads/edit/${lead.id}`)}
							styles={{ display: 'flex', alignItems: 'center', gap: 6 }}
						>
							<EditOutlined style={{ fontSize: 16 }} />
							Edit
						</Button>
					</Box>
				</Box>

				{/* ── Tabs ── */}
				<Tab value={activeTab}>
					<TabList>
						<TabItem
							value={1}
							label='Info'
							icon={<InfoOutlined />}
							onClick={(v) => setActiveTab(v as number)}
						/>
						<TabItem
							value={2}
							label='Chat'
							icon={<ChatOutlined />}
							onClick={(v) => setActiveTab(v as number)}
						/>
					</TabList>

					<TabContent tabIndex={1}>
						<PreviewMain lead={lead} />
					</TabContent>

					<TabContent tabIndex={2}>
						<Box
							style={{
								border: '1px solid #dbe3ef',
								borderRadius: 25,
								padding: 15,
							}}
						>
							<Box
								display='flex'
								align='center'
								style={{
									marginBottom: 25,
									marginLeft: 'auto',
									width: 'fit-content',
								}}
							>
								<DetailsPopover
									lead={{
										name: [lead.firstName, lead.lastName].filter(Boolean).join(' ') || null,
										companyName: lead.companyName,
										status: lead.status,
										clientType: lead.clientType,
										location: lead.location,
									}}
									proposal={chatContext?.proposal ?? undefined}
									jobPost={chatContext?.jobPost ?? undefined}
								/>
								<ModelSwitcher value={model} onChange={setModel} />
							</Box>
							<LeadChat leadId={lead.id} proposalId={lead.proposalId} model={model} />
						</Box>
					</TabContent>
				</Tab>
			</Box>
		</Card>
	)
}

export default LeadPreview
