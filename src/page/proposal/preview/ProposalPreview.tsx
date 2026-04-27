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
import PreviewMain from '../../../components/proposal/preview/PreviewMain'
import ProposalChat from '../../../components/proposal/preview/ProposalChat'
import { Button, Tab, TabList, TabItem, TabContent, Text, IconButton } from '../../../ui'
import ProposalListItemStatus from '../../../components/proposal/list/ProposalListItemStatus'
import ProposalListItemType from '../../../components/proposal/list/ProposalListItemType'
import ProposalListItemBoosted from '../../../components/proposal/list/ProposalListItemBoosted'
import { useGetProposalByIdQuery } from '../../../store/proposals/proposalsApi'
import { shortUuid, formatDate } from '../../../utils/formatDate'
import ModelSwitcher from '../../../components/chat/api-chat/ModelSwitcher'
import DetailsPopover from '../../../components/chat/api-chat/DetailsPopover'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { fetchProposalHistory } from '../../../store/chats/apiChatSlice'

const ProposalPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState(1)
	const [model, setModel] = useState('claude-sonnet-4-6')

	const dispatch = useAppDispatch()
	const chatContext = useAppSelector((state) => state.apiChat.chatContext)

	const { data: proposal, isLoading, isError } = useGetProposalByIdQuery(id!, { skip: !id })

	useEffect(() => {
		if (proposal?.id) {
			dispatch(fetchProposalHistory(proposal.id))
		}
	}, [proposal?.id, dispatch])

	if (isLoading) {
		return (
			<Card py='2rem' px='2rem'>
				<Box style={{ maxWidth: 900, margin: '0 auto' }}>
					<Text secondary>Loading proposal…</Text>
				</Box>
			</Card>
		)
	}

	if (isError || !proposal) {
		return (
			<Card py='2rem' px='2rem'>
				<Box
					style={{ maxWidth: 900, margin: '0 auto' }}
					display='flex'
					flexDirection='column'
					align='center'
					space={3}
				>
					<Text heading='h6'>Proposal not found</Text>
					<Button varient='outlined' color='info' onClick={() => navigate('/proposal/list')}>
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
				<Box display='flex' flexDirection='column' space={2} mb={20}>
					{/* Row 1: back button + title + subtitle */}
					<Box display='flex' align='center' space={3}>
						<IconButton
							varient='text'
							size={34}
							fontSize={20}
							onClick={() => navigate('/proposal/list')}
						>
							<ArrowBackOutlined />
						</IconButton>
						<Box>
							<Text heading='h5'>{proposal.title}</Text>
							<Box display='flex' align='center' space={1} style={{ marginTop: 2 }}>
								<Text varient='caption' secondary>
									{proposal.platform.title} · {formatDate(proposal.createdAt)} ·
								</Text>
								<Tooltip title={proposal.id} placement='top'>
									<span>
										<Text
											varient='caption'
											secondary
											styles={{ fontFamily: 'monospace' }}
										>
											#{shortUuid(proposal.id)}
										</Text>
									</span>
								</Tooltip>
								<IconButton
									varient='text'
									size={22}
									fontSize={13}
									contentOpacity={5}
									onClick={() => navigator.clipboard.writeText(proposal.id)}
								>
									<ContentCopy style={{ fontSize: 12 }} />
								</IconButton>
							</Box>
						</Box>
					</Box>

					{/* Row 2: chips left, Edit button right */}
					<Box display='flex' align='center' justify='space-between'>
						<Box display='flex' align='center' space={2} style={{ flexWrap: 'wrap', gap: 8 }}>
							<ProposalListItemStatus itemStatus={proposal.status} />
							<ProposalListItemType itemType={proposal.proposalType} />
							<ProposalListItemBoosted
								itemBoosted={proposal.boosted ? 'Boosted' : 'Not Boosted'}
							/>
						</Box>
						<Button
							varient='outlined'
							color='info'
							onClick={() => navigate(`/proposal/edit/${proposal.id}`)}
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
						<PreviewMain proposal={proposal} />
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
									proposal={{
										title: proposal.title,
										status: proposal.status,
										proposalType: proposal.proposalType,
										boosted: proposal.boosted,
										connects: proposal.connects,
										boostedConnects: proposal.boostedConnects,
										platform: { id: proposal.platform.id, name: proposal.platform.title },
										vacancy: proposal.vacancy,
										coverLetter: proposal.coverLetter,
									}}
									jobPost={chatContext?.jobPost ?? undefined}
									lead={chatContext?.lead ?? undefined}
								/>
								<ModelSwitcher value={model} onChange={setModel} />
							</Box>
							<ProposalChat proposalId={proposal.id} model={model} />
						</Box>
					</TabContent>
				</Tab>
			</Box>
		</Card>
	)
}

export default ProposalPreview
