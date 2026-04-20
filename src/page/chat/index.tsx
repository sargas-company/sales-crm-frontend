import { useEffect } from 'react'
import styled from 'styled-components'
import Card from '../../components/card/Card'
import { GridInnerContainer, GridItem } from '../../components/layout'
import { useAppDispatch } from '../../hooks'
import { fetchChats } from '../../store/chats/apiChatSlice'
import { useSocket } from '../../hooks/useSocket'
import ChatNav from '../../components/chat/api-chat/ChatNav'
import ChatContent from './chunk/ChatContent'

export const StatusColor: Record<string, string> = {
	Online: 'success',
	Away: 'warning',
	Dnd: 'error',
	Offline: 'gray',
}

const Chat = () => {
	const dispatch = useAppDispatch()
	const { sendMessage } = useSocket()

	useEffect(() => {
		dispatch(fetchChats({ type: 'proposal' }))
	}, [dispatch])

	return (
		<StyledChatContainer height='85vh' className='overflow-hidden'>
			<StretchGrid alignItems='stretch'>
				<GridItem md={5} lg={4} classes='xs-hidden md-visible'>
					<PanelFill>
						<ChatNav />
					</PanelFill>
				</GridItem>
				<GridItem xs={12} md={7} lg={8}>
					<PanelFill>
						<ChatContent sendMessage={sendMessage} />
					</PanelFill>
				</GridItem>
			</StretchGrid>
		</StyledChatContainer>
	)
}

export default Chat

const StyledChatContainer = styled(Card)`
	position: relative;
`

const StretchGrid = styled(GridInnerContainer)`
	height: 100%;
`

const PanelFill = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
`
