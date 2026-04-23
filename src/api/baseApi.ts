import { createApi } from '@reduxjs/toolkit/query/react'
import axiosBaseQuery from './axiosBaseQuery'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const baseApi = createApi({
	reducerPath: 'api',
	baseQuery: axiosBaseQuery,
	tagTypes: [
		'BaseKnowledge',
		'Proposal',
		'ProposalChat',
		'Lead',
		'Account',
		'Platform',
		'ClientRequest',
		'JobPost',
		'Prompt',
	],
	endpoints: () => ({}),
})
