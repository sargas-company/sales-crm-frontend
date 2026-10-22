import { ReactNode, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetVaultStatusQuery } from '../../store/credentials/vaultApi'
import VaultSetupGate, {
	VAULT_CANCELLED,
	VAULT_REQUEST_UNLOCK,
} from './VaultSetupGate'

/** Route-level gate for the entire `/credentials/*` tree. Decides from
 *  `vault-status` whether to render the child routes or hand control
 *  to the unlock drawer. Only renders children when there's an active
 *  vault session.
 *
 *  Pairs with the backend `VaultSessionGuard` on every mutate endpoint,
 *  so a user who manages to reach a page via back-button cache / cold
 *  reload still cannot write (the backend 401s with
 *  `code: 'VAULT_SESSION_REQUIRED'`, and the axios interceptor relays
 *  the unlock-request event here so the drawer pops in-place).
 *
 *  **UX note.** No "section is locked" intermediate card. When the
 *  user hits a locked page the unlock drawer opens automatically on
 *  mount — the user lands directly on the code input / passkey prompt.
 *  Nothing visible renders behind the drawer; the page chrome (nav /
 *  breadcrumb) stays visible but the content area is intentionally
 *  blank until the vault opens.
 *
 *  `VaultSetupGate` stays mounted at all times — it owns the actual
 *  passkey/TOTP drawer and listens to the `VAULT_REQUEST_UNLOCK`
 *  window event (also raised by the axios interceptor on mid-use
 *  session expiry). */
interface Props {
	children: ReactNode
}

const VaultSessionRequired = ({ children }: Props) => {
	const { data: status, isLoading } = useGetVaultStatusQuery()
	const navigate = useNavigate()
	// Fire the auto-unlock event exactly once per locked-state entry —
	// not on every re-render, otherwise RTK Query refetches would keep
	// flinging it. Reset when a session becomes active so the next
	// expiry re-arms it.
	const autoRequestedRef = useRef(false)

	const needsUnlock = Boolean(
		status && status.mfa?.hasAnyFactor && !status.session,
	)

	useEffect(() => {
		if (needsUnlock && !autoRequestedRef.current) {
			autoRequestedRef.current = true
			window.dispatchEvent(new CustomEvent(VAULT_REQUEST_UNLOCK))
		}
		if (!needsUnlock) autoRequestedRef.current = false
	}, [needsUnlock])

	// User dismissed the unlock/setup drawer without unlocking → send
	// them to `/`. We used to `navigate(-1)` when SPA history existed,
	// but that produces a loop when the user locks from inside the
	// credentials tree: the previous entry is also a /credentials URL
	// mounted under the same gate, so it immediately re-opens the
	// drawer. Home is the only guaranteed-safe exit.
	useEffect(() => {
		const onCancel = () => navigate('/', { replace: true })
		window.addEventListener(VAULT_CANCELLED, onCancel)
		return () => window.removeEventListener(VAULT_CANCELLED, onCancel)
	}, [navigate])

	// Locked states (loading / no MFA / no session) all render only the
	// gate. The drawer is the entire UI; no backdrop card behind it.
	// `VaultSetupGate` auto-opens its own drawer in both the setup
	// (hasAnyFactor === false) and unlock (event just dispatched above)
	// paths.
	if (isLoading || !status || !status.mfa?.hasAnyFactor || !status.session) {
		return <VaultSetupGate />
	}

	return (
		<>
			{children}
			<VaultSetupGate />
		</>
	)
}

export default VaultSessionRequired
