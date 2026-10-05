import { baseApi } from '../../api/baseApi'

export type CredentialProfileType = 'PERSON' | 'COMPANY' | 'OTHER'
export type CredentialProfileStatus = 'ACTIVE' | 'ARCHIVED'
export type CredentialAccountStatus = 'ACTIVE' | 'ARCHIVED'

export interface CredentialProfile {
	id: string
	name: string
	slug: string
	type: CredentialProfileType
	status: CredentialProfileStatus
	employeeId: string | null
	avatarUrl: string | null
	description: string | null
	tags: string[]
	createdById: string | null
	updatedById: string | null
	createdAt: string
	updatedAt: string
	_count: { accounts: number }
}

export interface CredentialAccount {
	id: string
	profileId: string
	serviceName: string
	category: string
	serviceUrl: string | null
	iconUrl: string | null
	tags: string[]
	usernameHint: string | null
	status: CredentialAccountStatus
	lastRotatedAt: string | null
	rotationReminderAt: string | null
	createdAt: string
	updatedAt: string
	_count: { attachments: number }
}

export interface SecretCustomField {
	label: string
	value: string
}

export interface SecretPayload {
	username?: string
	email?: string
	password?: string
	totpSeed?: string
	recoveryCodes?: string[]
	pin?: string
	securityAnswers?: string[]
	secureNote?: string
	customFields?: SecretCustomField[]
}

export interface RevealResponse {
	id: string
	serviceName: string
	secrets: SecretPayload
}

export interface CredentialAttachmentPreview {
	id: string
	accountId: string
	filename: string
	mime: string
	size: number
	uploadedById: string | null
	createdAt: string
}

interface Paginated<T> {
	data: T[]
	total: number
	page: number
	limit: number
}

interface ProfileListQuery {
	search?: string
	type?: CredentialProfileType
	status?: CredentialProfileStatus
	tag?: string
	page?: number
	limit?: number
}

interface AccountListQuery {
	profileId?: string
	search?: string
	category?: string
	status?: CredentialAccountStatus
	page?: number
	limit?: number
}

export const credentialsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		// ─── Profiles ────────────────────────────────────────────────
		listProfiles: builder.query<Paginated<CredentialProfile>, ProfileListQuery>({
			query: (params) => ({ url: '/credential-profiles', params }),
			providesTags: ['CredentialProfile'],
		}),
		getProfile: builder.query<CredentialProfile, string>({
			query: (id) => ({ url: `/credential-profiles/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'CredentialProfile', id }],
		}),
		createProfile: builder.mutation<
			CredentialProfile,
			Partial<CredentialProfile> & { name: string; type: CredentialProfileType }
		>({
			query: (body) => ({ url: '/credential-profiles', method: 'POST', body }),
			invalidatesTags: ['CredentialProfile'],
		}),
		updateProfile: builder.mutation<
			CredentialProfile,
			{ id: string; body: Partial<CredentialProfile> }
		>({
			query: ({ id, body }) => ({
				url: `/credential-profiles/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: (_r, _e, { id }) => [
				'CredentialProfile',
				{ type: 'CredentialProfile', id },
			],
		}),
		archiveProfile: builder.mutation<CredentialProfile, string>({
			query: (id) => ({
				url: `/credential-profiles/${id}/archive`,
				method: 'POST',
			}),
			invalidatesTags: ['CredentialProfile'],
		}),
		restoreProfile: builder.mutation<CredentialProfile, string>({
			query: (id) => ({
				url: `/credential-profiles/${id}/restore`,
				method: 'POST',
			}),
			invalidatesTags: ['CredentialProfile'],
		}),
		hardDeleteProfile: builder.mutation<
			{ id: string },
			{
				id: string
				confirmation: string
				mfa: { method: 'passkey' | 'totp'; code?: string; assertion?: unknown }
			}
		>({
			query: ({ id, confirmation, mfa }) => ({
				url: `/credential-profiles/${id}`,
				method: 'DELETE',
				body: { confirmation, mfa },
			}),
			invalidatesTags: ['CredentialProfile'],
		}),

		// ─── Accounts ────────────────────────────────────────────────
		listAccounts: builder.query<Paginated<CredentialAccount>, AccountListQuery>({
			query: (params) => ({ url: '/credential-accounts', params }),
			providesTags: ['CredentialAccount'],
		}),
		getAccount: builder.query<CredentialAccount, string>({
			query: (id) => ({ url: `/credential-accounts/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'CredentialAccount', id }],
		}),
		createAccount: builder.mutation<
			CredentialAccount,
			{
				profileId: string
				serviceName: string
				category: string
				serviceUrl?: string
				iconUrl?: string
				tags?: string[]
				usernameHint?: string
				secrets: SecretPayload
				rotationReminderAt?: string
			}
		>({
			query: (body) => ({ url: '/credential-accounts', method: 'POST', body }),
			invalidatesTags: ['CredentialAccount', 'CredentialProfile'],
		}),
		updateAccount: builder.mutation<
			CredentialAccount,
			{
				id: string
				body: {
					serviceName?: string
					category?: string
					serviceUrl?: string
					iconUrl?: string
					tags?: string[]
					usernameHint?: string
					secrets?: SecretPayload
					rotationReminderAt?: string
				}
			}
		>({
			query: ({ id, body }) => ({
				url: `/credential-accounts/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: (_r, _e, { id }) => [
				'CredentialAccount',
				{ type: 'CredentialAccount', id },
			],
		}),
		archiveAccount: builder.mutation<CredentialAccount, string>({
			query: (id) => ({
				url: `/credential-accounts/${id}/archive`,
				method: 'POST',
			}),
			invalidatesTags: ['CredentialAccount'],
		}),
		restoreAccount: builder.mutation<CredentialAccount, string>({
			query: (id) => ({
				url: `/credential-accounts/${id}/restore`,
				method: 'POST',
			}),
			invalidatesTags: ['CredentialAccount'],
		}),

		/* Reveal lives outside RTK Query entirely — see
		 * `src/store/credentials/revealTransport.ts`. RTK Query stores
		 * every mutation result (payload, args, requestId) inside the
		 * `api.mutations` sub-tree of Redux, which would place
		 * decrypted secret material in Redux state and DevTools even
		 * when the mutation lacks `providesTags`/`invalidatesTags`.
		 * We ship the reveal response straight back to the component
		 * via an imperative axios call so the plaintext never enters
		 * the Redux store. */
		copyAudit: builder.mutation<{ ok: true }, { id: string; field: string }>({
			query: ({ id, field }) => ({
				url: `/credential-accounts/${id}/copy`,
				method: 'POST',
				body: { field },
			}),
		}),

		// ─── Attachments ─────────────────────────────────────────────
		listAttachments: builder.query<CredentialAttachmentPreview[], string>({
			query: (accountId) => ({
				url: `/credential-accounts/${accountId}/attachments`,
			}),
			providesTags: (_r, _e, accountId) => [
				{ type: 'CredentialAttachment', id: accountId },
			],
		}),
		uploadAttachment: builder.mutation<
			CredentialAttachmentPreview,
			{ accountId: string; file: File }
		>({
			query: ({ accountId, file }) => {
				const fd = new FormData()
				fd.append('file', file)
				return {
					url: `/credential-accounts/${accountId}/attachments`,
					method: 'POST',
					body: fd,
				}
			},
			invalidatesTags: (_r, _e, { accountId }) => [
				{ type: 'CredentialAttachment', id: accountId },
			],
		}),
		deleteAttachment: builder.mutation<
			{ id: string },
			{ id: string; accountId: string }
		>({
			query: ({ id }) => ({
				url: `/credential-accounts/attachments/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: (_r, _e, { accountId }) => [
				{ type: 'CredentialAttachment', id: accountId },
			],
		}),

		// ─── Hard delete account ────────────────────────────────────
		hardDeleteAccount: builder.mutation<
			{ id: string },
			{
				id: string
				confirmation: string
				mfa: { method: 'passkey' | 'totp'; code?: string; assertion?: unknown }
			}
		>({
			query: ({ id, confirmation, mfa }) => ({
				url: `/credential-accounts/${id}`,
				method: 'DELETE',
				body: { confirmation, mfa },
			}),
			invalidatesTags: ['CredentialAccount'],
		}),

		/* Effective Credentials policy — safe non-secret snapshot used
		 * by the UI to drive the reveal auto-hide timer and the
		 * attachment pre-check label. Served under `credentials:view`
		 * (same gate as the drawer that reveals the secret), so
		 * Admin Manager — who has Credentials but NOT Settings — can
		 * read these values without touching the Settings API. */
		getCredentialsPolicy: builder.query<
			{
				vaultSessionMinutes: number
				revealAutoHideSeconds: number
				maxAttachmentMegabytes: number
			},
			void
		>({
			query: () => ({ url: '/credentials/policy' }),
		}),
	}),
})

export const {
	useGetCredentialsPolicyQuery,
	useListProfilesQuery,
	useGetProfileQuery,
	useCreateProfileMutation,
	useUpdateProfileMutation,
	useArchiveProfileMutation,
	useRestoreProfileMutation,
	useHardDeleteProfileMutation,
	useListAccountsQuery,
	useGetAccountQuery,
	useCreateAccountMutation,
	useUpdateAccountMutation,
	useArchiveAccountMutation,
	useRestoreAccountMutation,
	useCopyAuditMutation,
	useListAttachmentsQuery,
	useUploadAttachmentMutation,
	useDeleteAttachmentMutation,
	useHardDeleteAccountMutation,
} = credentialsApi
