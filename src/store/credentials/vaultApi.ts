import { baseApi } from '../../api/baseApi'

export interface VaultMfaStatus {
	hasAnyFactor: boolean
	webauthn: Array<{ label: string; createdAt: string; lastUsedAt: string | null }>
	hasTotp: boolean
	recoveryCodes: { total: number; remaining: number } | null
}

export interface VaultStatus {
	mfa: VaultMfaStatus
	session: { id: string; expiresAt: string } | null
}

export type UnlockMethod = 'passkey' | 'totp' | 'recovery'

interface UnlockPayload {
	method: UnlockMethod
	code?: string
	assertion?: unknown
}

interface TotpEnrollResponse {
	secret: string
	otpauth: string
}

export const vaultApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getVaultStatus: builder.query<VaultStatus, void>({
			query: () => ({ url: '/vault/status' }),
			providesTags: ['VaultStatus'],
		}),
		unlockVault: builder.mutation<{ expiresAt: string }, UnlockPayload>({
			query: (body) => ({ url: '/vault/unlock', method: 'POST', body }),
			invalidatesTags: ['VaultStatus'],
		}),
		lockVault: builder.mutation<{ ok: true }, void>({
			query: () => ({ url: '/vault/lock', method: 'POST' }),
			invalidatesTags: ['VaultStatus'],
		}),

		// Passkey (WebAuthn) enrollment.
		passkeyRegisterOptions: builder.mutation<Record<string, unknown>, void>({
			query: () => ({
				url: '/vault/mfa/passkey/register/options',
				method: 'POST',
			}),
		}),
		passkeyRegisterVerify: builder.mutation<
			{ ok: true },
			{ response: unknown; deviceLabel?: string }
		>({
			query: (body) => ({
				url: '/vault/mfa/passkey/register/verify',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['VaultStatus'],
		}),
		passkeyAssertOptions: builder.mutation<Record<string, unknown>, void>({
			query: () => ({
				url: '/vault/mfa/passkey/assert/options',
				method: 'POST',
			}),
		}),

		// TOTP.
		totpEnroll: builder.mutation<TotpEnrollResponse, void>({
			query: () => ({ url: '/vault/mfa/totp/enroll', method: 'POST' }),
		}),
		totpConfirm: builder.mutation<{ ok: true }, { code: string }>({
			query: (body) => ({
				url: '/vault/mfa/totp/confirm',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['VaultStatus'],
		}),
		totpRemove: builder.mutation<{ ok: true }, { code: string }>({
			query: (body) => ({
				url: '/vault/mfa/totp',
				method: 'DELETE',
				body,
			}),
			invalidatesTags: ['VaultStatus'],
		}),

		// Recovery codes.
		recoveryGenerate: builder.mutation<{ codes: string[] }, void>({
			query: () => ({ url: '/vault/mfa/recovery/generate', method: 'POST' }),
			invalidatesTags: ['VaultStatus'],
		}),
	}),
})

export const {
	useGetVaultStatusQuery,
	useUnlockVaultMutation,
	useLockVaultMutation,
	usePasskeyRegisterOptionsMutation,
	usePasskeyRegisterVerifyMutation,
	usePasskeyAssertOptionsMutation,
	useTotpEnrollMutation,
	useTotpConfirmMutation,
	useTotpRemoveMutation,
	useRecoveryGenerateMutation,
} = vaultApi
