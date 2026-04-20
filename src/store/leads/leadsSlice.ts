import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import leadMock from '../../api/leads.json'
import type { LeadList, LeadState } from './types/definition'

export const fetchLeadData = createAsyncThunk('lead/fetchData', async () => {
	return leadMock as LeadList[]
})

const initialState: LeadState = {
	data: [],
	allData: [],
	total: 0,
}

const leadsSlice = createSlice({
	name: 'lead',
	initialState,
	reducers: {
		searchData: (state, action: PayloadAction<string>) => {
			const term = action.payload
			const result = term ? state.allData.filter((item) => search(item, term)) : state.allData
			state.data = result
			state.total = result.length
		},
	},
	extraReducers: (builder) => {
		builder.addCase(fetchLeadData.fulfilled, (state, action) => {
			state.data = action.payload
			state.allData = action.payload
			state.total = action.payload.length
		})
	},
})

export const { searchData } = leadsSlice.actions
export default leadsSlice.reducer

const search = (item: LeadList, term: string): boolean => {
	const contains = (value: string) => value.toLowerCase().includes(term.toLowerCase())
	return (
		contains(item.id.toString()) ||
		contains(item.name) ||
		contains(item.companyEmail) ||
		contains(item.total.toString()) ||
		contains(item.status)
	)
}
