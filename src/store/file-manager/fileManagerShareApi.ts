import { baseApi } from '../../api/baseApi'

/* Admin surface for shares, invites, portal users. Separate slice
 * from `fileManagerApi` to keep the growing API module readable. */

export type ShareResourceType = 'FOLDER' | 'FILE'

export interface ShareBlueprint {
	resourceType: ShareResourceType
	resourceId: string
	recursive: boolean
	canDownload: boolean
	canUpload: boolean
	canCreateSubfolders: boolean
}

export interface FileManagerShareRow {
	id: string
	userId: string
	resourceType: ShareResourceType
	resourceId: string
	recursive: boolean
	canDownload: boolean
	canUpload: boolean
	canCreateSubfolders: boolean
	grantedById: string | null
	createdAt: string
	updatedAt: string
	user: {
		id: string
		email: string
		displayName: string | null
		avatarUrl: string | null
		discordId: string | null
		active: boolean
	}
}

export interface PortalUserRow {
	id: string
	email: string
	displayName: string | null
	firstName: string
	lastName?: string | null
	avatarUrl: string | null
	discordId: string | null
	active: boolean
	createdAt: string
	_count: { fileManagerSharesReceived: number }
}

export interface PortalUserDetail extends PortalUserRow {
	fileManagerSharesReceived: Array<
		FileManagerShareRow & { resourceName: string | null }
	>
}

export interface InviteRow {
	id: string
	token: string
	expiresAt: string | null
	usedAt: string | null
	createdAt: string
	sharesJson: ShareBlueprint[]
	note: string | null
	createdBy: {
		id: string
		firstName: string
		lastName: string
		email: string
	}
	usedByUser: {
		id: string
		email: string
		displayName: string | null
		avatarUrl: string | null
	} | null
}

export const fileManagerShareApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		/* ── Shares ──────────────────────────────────────────────── */
		listSharesOnResource: builder.query<
			FileManagerShareRow[],
			{ resourceType: ShareResourceType; resourceId: string }
		>({
			query: ({ resourceType, resourceId }) => ({
				url: `/file-manager/shares?resourceType=${resourceType}&resourceId=${resourceId}`,
			}),
			providesTags: (_r, _e, arg) => [
				{ type: 'FileManager', id: `SHARES:${arg.resourceType}:${arg.resourceId}` },
			],
		}),
		createShare: builder.mutation<
			FileManagerShareRow,
			{ userId: string; share: ShareBlueprint }
		>({
			query: (body) => ({
				url: '/file-manager/shares',
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, arg) => [
				{ type: 'FileManager', id: `SHARES:${arg.share.resourceType}:${arg.share.resourceId}` },
				{ type: 'FileManager', id: 'PORTAL_USERS' },
			],
		}),
		updateShare: builder.mutation<
			FileManagerShareRow,
			{
				id: string
				resourceType: ShareResourceType
				resourceId: string
				patch: Partial<Omit<ShareBlueprint, 'resourceType' | 'resourceId'>>
			}
		>({
			query: ({ id, patch }) => ({
				url: `/file-manager/shares/${id}`,
				method: 'PATCH',
				body: patch,
			}),
			invalidatesTags: (_r, _e, arg) => [
				{ type: 'FileManager', id: `SHARES:${arg.resourceType}:${arg.resourceId}` },
				{ type: 'FileManager', id: 'PORTAL_USERS' },
			],
		}),
		revokeShare: builder.mutation<
			{ id: string },
			{ id: string; resourceType: ShareResourceType; resourceId: string }
		>({
			query: ({ id }) => ({
				url: `/file-manager/shares/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: (_r, _e, arg) => [
				{ type: 'FileManager', id: `SHARES:${arg.resourceType}:${arg.resourceId}` },
				{ type: 'FileManager', id: 'PORTAL_USERS' },
			],
		}),

		/* ── Portal users ────────────────────────────────────────── */
		listPortalUsers: builder.query<PortalUserRow[], void>({
			query: () => ({ url: '/file-manager/portal-users' }),
			providesTags: [{ type: 'FileManager', id: 'PORTAL_USERS' }],
		}),
		getPortalUser: builder.query<PortalUserDetail, string>({
			query: (id) => ({ url: `/file-manager/portal-users/${id}` }),
			providesTags: (_r, _e, id) => [
				{ type: 'FileManager', id: `PORTAL_USER:${id}` },
			],
		}),
		terminatePortalUser: builder.mutation<
			{ id: string; active: boolean },
			string
		>({
			query: (id) => ({
				url: `/file-manager/portal-users/${id}/terminate`,
				method: 'POST',
			}),
			invalidatesTags: (_r, _e, id) => [
				{ type: 'FileManager', id: 'PORTAL_USERS' },
				{ type: 'FileManager', id: `PORTAL_USER:${id}` },
			],
		}),
		reactivatePortalUser: builder.mutation<
			{ id: string; active: boolean },
			string
		>({
			query: (id) => ({
				url: `/file-manager/portal-users/${id}/reactivate`,
				method: 'POST',
			}),
			invalidatesTags: (_r, _e, id) => [
				{ type: 'FileManager', id: 'PORTAL_USERS' },
				{ type: 'FileManager', id: `PORTAL_USER:${id}` },
			],
		}),

		/* ── Invites ─────────────────────────────────────────────── */
		createInvite: builder.mutation<
			{
				id: string
				token: string
				expiresAt: string | null
				createdAt: string
				shareCount: number
			},
			{ shares: ShareBlueprint[]; expiresInDays?: number; note?: string }
		>({
			query: (body) => ({
				url: '/file-manager/invites',
				method: 'POST',
				body,
			}),
			invalidatesTags: [{ type: 'FileManager', id: 'INVITES' }],
		}),
		revokeInvite: builder.mutation<{ id: string }, string>({
			query: (id) => ({
				url: `/file-manager/invites/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: [{ type: 'FileManager', id: 'INVITES' }],
		}),
		listInvites: builder.query<InviteRow[], void>({
			query: () => ({ url: '/file-manager/invites' }),
			providesTags: [{ type: 'FileManager', id: 'INVITES' }],
		}),
	}),
})

export const {
	useListSharesOnResourceQuery,
	useCreateShareMutation,
	useUpdateShareMutation,
	useRevokeShareMutation,
	useListPortalUsersQuery,
	useGetPortalUserQuery,
	useTerminatePortalUserMutation,
	useReactivatePortalUserMutation,
	useCreateInviteMutation,
	useRevokeInviteMutation,
	useListInvitesQuery,
} = fileManagerShareApi
