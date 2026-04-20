import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig, AxiosError } from 'axios'
import axiosInstance from './axiosInstance'

export interface AxiosBaseQueryArgs {
	url: string
	method?: AxiosRequestConfig['method']
	body?: unknown
	params?: unknown
}

const axiosBaseQuery: BaseQueryFn<AxiosBaseQueryArgs, unknown, unknown> = async ({
	url,
	method = 'GET',
	body,
	params,
}) => {
	try {
		const result = await axiosInstance({ url, method, data: body, params })
		return { data: result.data }
	} catch (err) {
		const error = err as AxiosError
		return {
			error: {
				status: error.response?.status,
				data: error.response?.data ?? error.message,
			},
		}
	}
}

export default axiosBaseQuery
