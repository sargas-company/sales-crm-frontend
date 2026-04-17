import styled from 'styled-components'
import Box from '../../box/Box'
import {Divider, Tab, TabContent, TabItem, TabList, Text} from '../../../ui'
import ScrollContainer from '../../scroll-container/ScrollContainer'
import ChatList from './ChatList'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { setActiveTab, fetchChats } from '../../../store/chats/apiChatSlice'
import type { ChatTabType } from '../../../store/chats/apiChatSlice'

const TAB_VALUES: Record<ChatTabType, number> = {
  proposal: 1,
  lead: 2,
}

const TAB_TYPES: Record<number, ChatTabType> = {
  1: 'proposal',
  2: 'lead',
}

const ChatNav = () => {
  const dispatch = useAppDispatch()
  const activeTab = useAppSelector((state) => state.apiChat.activeTab)

  const handleTabChange = (v: number) => {
    const tab = TAB_TYPES[v]
    if (!tab || tab === activeTab) return
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

      <Tab value={TAB_VALUES[activeTab]}>
        <FullWidthTabList>
          <TabList>
            <TabItem value={1} label="Proposals" onClick={(v) => handleTabChange(v as number)} />
            <TabItem value={2} label="Leads" onClick={(v) => handleTabChange(v as number)} />
          </TabList>
        </FullWidthTabList>

        <TabContent tabIndex={1}>
          <Box pl={12}>
            <ScrollContainer maxHeight="68vh">
              <ChatList />
            </ScrollContainer>
          </Box>
        </TabContent>

        <TabContent tabIndex={2}>
          <Box pl={12}>
            <ScrollContainer maxHeight="68vh">
              <ChatList />
            </ScrollContainer>
          </Box>
        </TabContent>
      </Tab>
    </Box>
  )
}

export default ChatNav

const FullWidthTabList = styled.div`
  .tab-list-wrapper {
    .tab-item {
      flex: 1;
      min-width: 0;
    }
  }
`
