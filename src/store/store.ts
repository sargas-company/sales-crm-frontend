import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '../api/baseApi'
import authReducer from './auth/authSlice'
import chatReducer from './chats/chatSlice'
import invoiceReducer from './invoices/invoicesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    invoice: invoiceReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
