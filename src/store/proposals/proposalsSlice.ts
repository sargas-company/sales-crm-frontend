import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import proposalMock from '../../api/proposals.json'
import type { ProposalList, ProposalState } from './types/definition'

export const fetchProposalData = createAsyncThunk('proposal/fetchData', async () => {
  return proposalMock as ProposalList[]
})

const initialState: ProposalState = {
  data: [],
  allData: [],
  total: 0,
}

const proposalsSlice = createSlice({
  name: 'proposal',
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
    builder.addCase(fetchProposalData.fulfilled, (state, action) => {
      state.data = action.payload
      state.allData = action.payload
      state.total = action.payload.length
    })
  },
})

export const { searchData } = proposalsSlice.actions
export default proposalsSlice.reducer

const search = (item: ProposalList, term: string): boolean => {
  const contains = (value: string) => value.toLowerCase().includes(term.toLowerCase())
  return (
    contains(item.id.toString()) ||
    contains(item.name) ||
    contains(item.companyEmail) ||
    contains(item.total.toString()) ||
    contains(item.status)
  )
}
