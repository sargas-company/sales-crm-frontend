import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'
import { Chats, ChatState, Contacts, Message, Status } from './definition'

// Temporary thunks — will be replaced with RTK Query (chatApi) during GPT integration
export const fetchUserProfile = createAsyncThunk('chats/fetchUserProfile', async () => {
  const { data } = await axiosInstance.get('/chat/userProfile')
  return data
})

export const fetchChat = createAsyncThunk('chats/fetchChats', async () => {
  const { data } = await axiosInstance.get('/chat/chats')
  return data
})

export const fetchChatContact = createAsyncThunk('chats/fetchChatContacts', async () => {
  const { data } = await axiosInstance.get('/chat/chatContacts')
  return data
})

const initialState: ChatState = {
  currentUser: {} as any,
  chats: [],
  contacts: [],
  selectedChat: null,
}

const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    selectCurrentChat: {
      prepare: (uid: string | number, lookup: 'chat' | 'contact') => ({
        payload: { uid, lookup },
      }),
      reducer: (
        state,
        action: PayloadAction<{ uid: string | number; lookup: 'chat' | 'contact' }>
      ) => {
        const { uid, lookup } = action.payload
        state.chats = state.chats.map((chat) => {
          if (chat.profile.uid === uid) {
            return {
              ...chat,
              chats: {
                ...chat.chats,
                lastMessage: { ...chat.chats.lastMessage, isSeen: true, total: 0 },
              },
            }
          }
          return chat
        })
        state.selectedChat =
          lookup === 'chat'
            ? ((state.chats.find((c) => c.profile.uid === uid) ?? null) as Chats | null)
            : ((state.contacts.find((c) => c.profile.uid === uid) ?? null) as Contacts | null)
      },
    },

    sendMessage: {
      prepare: (senderId: string | number, message: string): { payload: Message } => ({
        payload: {
          senderId,
          message,
          isSent: true,
          isSeen: false,
          isDelivered: false,
          time: new Date().toISOString(),
        },
      }),
      reducer: (state, action: PayloadAction<Message>) => {
        if (!state.selectedChat) return
        const { message, time } = action.payload
        const id = state.selectedChat.profile.uid
        const chats = [...state.chats]
        const chatIndex = chats.findIndex((c) => c.profile.uid === id)
        const selectedChat = { ...state.selectedChat }
        const lastMessage = { total: 0, message, isSeen: true, time }

        if (chatIndex === -1) {
          selectedChat.chats = { lastMessage, chat: [action.payload] }
          chats.unshift(selectedChat as Chats)
          state.contacts = state.contacts.filter((c) => c.profile.uid !== id)
        } else {
          selectedChat.chats = {
            lastMessage,
            chat: [...(selectedChat.chats?.chat ?? []), action.payload],
          }
          chats.splice(chatIndex, 1)
          chats.unshift(selectedChat as Chats)
        }

        state.chats = chats
        state.selectedChat = selectedChat
      },
    },

    changeUserStatus: (state, action: PayloadAction<Status>) => {
      state.currentUser = { ...state.currentUser, status: action.payload }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload
      })
      .addCase(fetchChat.fulfilled, (state, action) => {
        state.chats = action.payload
      })
      .addCase(fetchChatContact.fulfilled, (state, action) => {
        state.contacts = action.payload
      })
  },
})

export const { selectCurrentChat, sendMessage, changeUserStatus } = chatSlice.actions
export default chatSlice.reducer
