import styled from 'styled-components'
import Box from '../../../components/box/Box'
import { Divider } from '../../../ui'
import ChatHeader from '../../../components/chat/api-chat/ChatHeader'
import Messages from '../../../components/chat/api-chat/Messages'
import ChatFooter from '../../../components/chat/api-chat/ChatFooter'
import { useAppSelector } from '../../../hooks'
import { ChatBubbleOutlineRounded } from '@mui/icons-material'
import { CustomAvatar, Text } from '../../../ui'
import useTheme from '../../../theme/useTheme'

interface Props {
	sendMessage: (proposalId: string, content: string, model: string) => void
}

const CHAT_HEIGHT = '85vh'

const ChatContent = ({ sendMessage }: Props) => {
	const selectedChatId = useAppSelector((state) => state.apiChat.selectedChatId)
	const {
		theme: { mode },
	} = useTheme()

	if (!selectedChatId) {
		return (
			<ContentRoot mode={mode.name}>
				<Divider className='xs-hidden md-visible' vertical />
				<Box
					display='flex'
					flexDirection='column'
					align='center'
					justify='center'
					flex={1}
					space={1.6}
				>
					<CustomAvatar size={100} color='info' skin='light'>
						<ChatBubbleOutlineRounded />
					</CustomAvatar>
					<Text heading='h6' skinColor>
						Select a chat to start
					</Text>
				</Box>
			</ContentRoot>
		)
	}

	return (
		<ContentRoot mode={mode.name}>
			<Divider className='xs-hidden md-visible' vertical />
			<ChatColumn chatHeight={CHAT_HEIGHT}>
				<HeaderWrap>
					<ChatHeader />
				</HeaderWrap>
				<Messages />
				<FooterWrap>
					<ChatFooter onSend={sendMessage} />
				</FooterWrap>
			</ChatColumn>
		</ContentRoot>
	)
}

export default ChatContent

const ContentRoot = styled.div<{ mode: string }>`
	display: flex;
	height: 100%;
	background: ${({ mode }) => (mode === 'dark' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)')};
`

const ChatColumn = styled.div<{ chatHeight: string }>`
	display: flex;
	flex-direction: column;
	flex: 1;
	height: ${({ chatHeight }) => chatHeight};
	overflow: hidden;
`

const HeaderWrap = styled.div`
	flex-shrink: 0;
`

const FooterWrap = styled.div`
	flex-shrink: 0;
	padding: 8px 0;
`
