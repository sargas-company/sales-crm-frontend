import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosInstance'

/**
 * Hook that resolves a portfolio asset id to a short-lived signed B2
 * URL. The backend endpoint `/portfolio/assets/:id/signed-url` is
 * authenticated with the standard Bearer header (via `axiosInstance`),
 * and returns a JSON `{ url }` payload whose value is safe to embed in
 * `<img src>` / `<a href>` — the signed URL carries B2's own
 * `?Authorization=` token, never our JWT.
 *
 * Returns `null` while the request is in flight or on error (callers
 * handle their own fallback — nothing visually breaks because signed
 * URLs are only ever used for optional preview content).
 */
export function usePortfolioAssetUrl(id: string | null | undefined): string | null {
	const [url, setUrl] = useState<string | null>(null)
	useEffect(() => {
		if (!id) {
			setUrl(null)
			return
		}
		let cancelled = false
		axiosInstance
			.get<{ url: string }>(`/portfolio/assets/${id}/signed-url`)
			.then((res) => {
				if (!cancelled) setUrl(res.data.url)
			})
			.catch(() => {
				if (!cancelled) setUrl(null)
			})
		return () => {
			cancelled = true
		}
	}, [id])
	return url
}

/**
 * Imperative variant for one-off downloads. Fetches the asset as a
 * blob through the authenticated backend `/download` endpoint, hands
 * back an object URL. The caller is responsible for `URL.revokeObjectURL`
 * when the object URL is no longer in use.
 */
export async function downloadPortfolioAsset(id: string): Promise<string> {
	const res = await axiosInstance.get<Blob>(
		`/portfolio/assets/${id}/download`,
		{ responseType: 'blob' },
	)
	return URL.createObjectURL(res.data)
}
