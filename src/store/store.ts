import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '../api/baseApi'
import authReducer from './auth/authSlice'
import chatReducer from './chats/chatSlice'
import proposalReducer from './proposals/proposalsSlice'
import leadReducer from './leads/leadsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    proposal: proposalReducer,
    lead: leadReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
