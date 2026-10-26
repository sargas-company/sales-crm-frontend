import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

/* After Discord redirects the user back to the portal via
 * backend `/auth/portal/discord/callback`, the backend sends them
 * to this route with the JWT in the URL fragment:
 *   /auth/callback#token=<jwt>
 * We extract the token, stash it in localStorage, and redirect to
 * the portal root. Keeping it in the URL fragment (not query) means
 * the token never leaves the browser — fragments aren't sent to the
 * server. */
export const DiscordCallbackPage = () => {
	const nav = useNavigate()
	const [err, setErr] = useState<string | null>(null)

	useEffect(() => {
		const hash = window.location.hash
		const match = hash.match(/token=([^&]+)/)
		if (match) {
			try {
				localStorage.setItem('access_token', match[1])
			} catch {
				/* ignore */
			}
			nav('/', { replace: true })
		} else {
			setErr('No access token returned from the OAuth flow.')
			setTimeout(() => nav('/portal/login', { replace: true }), 2000)
		}
	}, [nav])

	return (
		<Root>
			<Message>{err ?? 'Signing you in…'}</Message>
		</Root>
	)
}

const Root = styled.div`
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
`
const Message = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	color: #334155;
`
