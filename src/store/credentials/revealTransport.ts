import type { AxiosError, AxiosResponse } from 'axios'

import axiosInstance from '../../api/axiosInstance'
import type { RevealResponse } from './credentialsApi'

/**
 * Imperative reveal transport.
 *
 * The credentials reveal endpoint returns decrypted secret material.
 * RTK Query stores every mutation payload — args, result data, request
 * id — inside the `api.mutations` sub-tree of Redux and surfaces them
 * in Redux DevTools; even a mutation without `providesTags` /
 * `invalidatesTags` keeps that record for the lifetime of the subscription.
 * Routing reveal through RTK Query would therefore place plaintext
 * credentials in Redux state, which is unacceptable.
 *
 * Instead we fire a one-shot axios call through the already-configured
 * instance: it carries the existing Bearer / vault-session cookie, is
 * retried through the normal 401 refresh flow, but the response body
 * is handed straight back to the caller. The caller stores plaintext
 * in component-local state only.
 *
 * The transport NEVER writes the response (or any sliced field of it)
 * to `localStorage`, `sessionStorage`, URL, Redux, or logs.
 */
export async function fetchAccountReveal(
	accountId: string,
): Promise<RevealResponse> {
	let res: AxiosResponse<RevealResponse>
	try {
		res = await axiosInstance.post<RevealResponse>(
			`/credential-accounts/${encodeURIComponent(accountId)}/reveal`,
			undefined,
			{
				/* Response is cache-controlled by the server, but we also
				 * ask axios/the browser not to retain it. */
				headers: { 'Cache-Control': 'no-store' },
			},
		)
	} catch (err) {
		/* Normalise to a shape the drawer already handles. We take care
		 * NOT to pass through the raw response body — only the HTTP
		 * status, a short message, and the standard axios error flag. */
		const ax = err as AxiosError<{ message?: string }>
		const status = ax.response?.status ?? 0
		const safeMessage =
			typeof ax.response?.data?.message === 'string' && ax.response.data.message.length < 240
				? ax.response.data.message
				: ax.message || 'Reveal failed'
		const wrapped: Error & { status?: number } = new Error(safeMessage)
		wrapped.status = status
		throw wrapped
	}
	return res.data
}
