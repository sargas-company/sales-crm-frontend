import parseServerError from '../../utils/parseServerError'
import { ROLE_ERROR_MESSAGES, type RoleErrorCode } from '../../store/roles/types'

const ROLE_CODES = new Set<RoleErrorCode>(Object.keys(ROLE_ERROR_MESSAGES) as RoleErrorCode[])

/**
 * Maps a 400 response body's `message` (which is a machine-readable
 * code per spec §6 for the Roles admin API) to a human-friendly toast
 * string. Falls back to the raw server error otherwise. Unknown codes
 * or prefixed codes such as `UNKNOWN_PERMISSION_KEYS:list,of,keys`
 * strip the payload for the lookup.
 */
export function extractRoleErrorMessage(err: unknown): string {
	const raw = parseServerError(err)
	const head = raw.split(':', 1)[0] as RoleErrorCode
	if (ROLE_CODES.has(head)) {
		return ROLE_ERROR_MESSAGES[head]
	}
	return raw
}
