import Box from '../../box/Box'
import { Divider, Text } from '../../../ui'
import { useAppSelector } from '../../../hooks'
import ModelSwitcher from './ModelSwitcher'
import DetailsPopover from './DetailsPopover'

const ChatHeader = () => {
	const selectedId = useAppSelector((state) => state.apiChat.selectedChatId)
	const chat = useAppSelector((state) => state.apiChat.chatList.find((c) => c.id === selectedId))

	const lead = chat?.lead
	const title =
		chat?.proposal?.title ??
		(lead
			? [lead.firstName, lead.lastName].filter(Boolean).join(' ') ||
				lead.companyName ||
				`Lead #${lead.number}`
			: '')

	const subtitle = chat?.proposal?.user?.email ?? chat?.lead?.user?.email ?? ''

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
							name: 'Priyadarshan Joshi',
							email: 'priyadarshan.joshi@cityneeds.app',
							location: 'Greece 🇬🇷',
							totalSpent: '$123,400',
							avgRatePaid: '$50/h',
							hireRate: '$40/h',
							status: 'In Discussion',
							source: 'Upwork',
							company: 'CityNeeds',
							notes: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
						}}
						proposal={{
							title: 'CityNeeds Mobile App - MVP Delivery',
							status: 'Draft',
							version: 'v3',
							budget: '$6,000 - $8,000',
							summary:
								"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
						}}
						jobPost={{
							title: 'React Native / Mobile App Developer for City Services Platform',
							description:
								'React Native / Mobile App Developer for City Services Platform Native / Mobile App Developer for City Services Platform Native / Mobile App Developer for City Services Mobile App Developer for City Services Platform',
							score: '87%',
							budget: '$5k - $10k',
							timeline: '6-8 weeks',
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
