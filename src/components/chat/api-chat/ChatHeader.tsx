import Box from '../../box/Box'
import { Divider, Text } from '../../../ui'
import { useAppSelector } from '../../../hooks'
import ModelSwitcher from './ModelSwitcher'
import DetailsPopover from './DetailsPopover'

const ChatHeader = () => {
	const selectedId = useAppSelector((state) => state.apiChat.selectedChatId)
	const chat = useAppSelector((state) => state.apiChat.chatList.find((c) => c.id === selectedId))
	const chatContext = useAppSelector((state) => state.apiChat.chatContext)

	const lead = chat?.lead
	const title =
		chat?.proposal?.title ??
		(lead
			? [lead.firstName, lead.lastName].filter(Boolean).join(' ') ||
				lead.companyName ||
				`Lead #${lead.number}`
			: '')

	const subtitle = chat?.proposal?.user?.email ?? chat?.lead?.user?.email ?? ''

	const email = chat?.lead?.user?.email ?? chat?.proposal?.user?.email ?? null

	return (
		<Box display='flex' flexDirection='column' style={{ zIndex: 900 }}>
			<Box
				display='flex'
				align='center'
				px={16}
				py={12}
				style={{ justifyContent: 'space-between' }}
			>
				<Box display='flex' flexDirection='column'>
					<Text varient='body2' weight='bold'>
						{title}
					</Text>
					{subtitle && (
						<Text varient='caption' secondary>
							{subtitle}
						</Text>
					)}
				</Box>
				<Box display='flex'>
					<DetailsPopover
						lead={{
							name: chatContext?.lead?.name,
							email,
							location: chatContext?.lead?.location,
							status: chatContext?.lead?.status,
							company: chatContext?.lead?.company,
						}}
						proposal={{
							title: chatContext?.proposal?.title,
							status: chatContext?.proposal?.status,
						}}
						jobPost={{
							title: chatContext?.jobPost?.title,
							description: chatContext?.jobPost?.description,
							score: chatContext?.jobPost?.score,
							gigRadarScore: chatContext?.jobPost?.gigRadarScore,
							budget: chatContext?.jobPost?.budget,
							source: chatContext?.jobPost?.source,
							totalSpent: chatContext?.jobPost?.totalSpent,
							avgRatePaid: chatContext?.jobPost?.avgRatePaid,
							hireRate: chatContext?.jobPost?.hireRate,
							location: chatContext?.jobPost?.location,
						}}
					/>
					<ModelSwitcher />
				</Box>
			</Box>
			<Divider />
		</Box>
	)
}

export default ChatHeader
