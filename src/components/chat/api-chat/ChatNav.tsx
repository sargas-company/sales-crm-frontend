import styled from 'styled-components'
import Box from '../../box/Box'
import { Divider, Text } from '../../../ui'
import ScrollContainer from '../../scroll-container/ScrollContainer'
import ChatList from './ChatList'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { setActiveTab, fetchChats } from '../../../store/chats/apiChatSlice'
import type { ChatTabType } from '../../../store/chats/apiChatSlice'
import useTheme from '../../../theme/useTheme'
import genColorShades from '../../../utils/genColorShades'

const TABS: { label: string; value: ChatTabType }[] = [
  { label: 'Proposals', value: 'proposal' },
  { label: 'Leads', value: 'lead' },
]

const ChatNav = () => {
  const dispatch = useAppDispatch()
  const activeTab = useAppSelector((state) => state.apiChat.activeTab)
  const { theme: { primaryColor: { color } } } = useTheme()

  const handleTabChange = (tab: ChatTabType) => {
    if (tab === activeTab) return
    dispatch(setActiveTab(tab))
    dispatch(fetchChats({ type: tab }))
  }

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" align="center" py={16} px={18}>
        <Text heading="h6" weight="bold">
          Chats
        </Text>
      </Box>
      <Divider />

      {/* Tab switcher */}
      <TabRow>
        {TABS.map((tab) => (
          <TabButton
            key={tab.value}
            active={activeTab === tab.value}
            primaryColor={color}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabRow>
      <Divider />

      <Box pl={12}>
        <ScrollContainer maxHeight="68vh">
          <ChatList />
        </ScrollContainer>
      </Box>
    </Box>
  )
}

export default ChatNav

const TabRow = styled.div`
  display: flex;
`

const TabButton = styled.button<{ active: boolean; primaryColor: string }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: ${({ active }) => (active ? 600 : 400)};
  color: ${({ active, primaryColor }) =>
    active ? primaryColor : 'var(--text-secondary, #8A8D93)'};
  border-bottom: 2px solid
    ${({ active, primaryColor }) => (active ? primaryColor : 'transparent')};
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: ${({ primaryColor }) => primaryColor};
  }
`
