import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import invoiceMock from '../../api/invoice.json'
import type { InvoiceList, InvoiceState } from './types/definition'

export const fetchInvoiceData = createAsyncThunk('invoice/fetchData', async () => {
  return invoiceMock as InvoiceList[]
})

const initialState: InvoiceState = {
  data: [],
  allData: [],
  total: 0,
}

const invoicesSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    searchData: (state, action: PayloadAction<string>) => {
      const term = action.payload
      const result = term
        ? state.allData.filter((item) => search(item, term))
        : state.allData
      state.data = result
      state.total = result.length
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchInvoiceData.fulfilled, (state, action) => {
      state.data = action.payload
      state.allData = action.payload
      state.total = action.payload.length
    })
  },
})

export const { searchData } = invoicesSlice.actions
export default invoicesSlice.reducer

const search = (item: InvoiceList, term: string): boolean => {
  const contains = (value: string) => value.toLowerCase().includes(term.toLowerCase())
  return (
    contains(item.id.toString()) ||
    contains(item.name) ||
    contains(item.companyEmail) ||
    contains(item.total.toString()) ||
    contains(item.status)
  )
}
