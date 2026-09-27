import { baseApi } from '../../api/baseApi'
import type { Permission, Role } from './types'

// RTK Query slice wired to the T-08 Roles administration API (spec §3.3).
// Backend is the sole enforcement layer; this slice is the read/write
// bridge from the UI. Error handling for §6 machine codes happens in
// the calling components via `parseServerError` + toast.

interface CreateRolePayload {
	name: string
	label: string
	description?: string
	permissionKeys: string[]
}

interface UpdateRolePayload {
	id: string
	label?: string
	description?: string
	permissionKeys?: string[]
}

interface AssignUserRolePayload {
	userId: string
	roleId: string
}

interface AssignedUser {
	id: string
	email: string
	roleId: string
}

export const rolesApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listRoles: builder.query<Role[], void>({
			query: () => ({ url: '/roles', method: 'GET' }),
			providesTags: (result) =>
				result
					? [
							...result.map((r) => ({ type: 'Role' as const, id: r.id })),
							{ type: 'Role' as const, id: 'LIST' },
						]
					: [{ type: 'Role' as const, id: 'LIST' }],
		}),

		listPermissions: builder.query<Permission[], void>({
			query: () => ({ url: '/permissions', method: 'GET' }),
			providesTags: [{ type: 'Permission' as const, id: 'LIST' }],
		}),

		createRole: builder.mutation<Role, CreateRolePayload>({
			query: (body) => ({ url: '/roles', method: 'POST', body }),
			invalidatesTags: [{ type: 'Role', id: 'LIST' }],
		}),

		updateRole: builder.mutation<Role, UpdateRolePayload>({
			query: ({ id, ...body }) => ({ url: `/roles/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_result, _error, arg) => [
				{ type: 'Role', id: arg.id },
				{ type: 'Role', id: 'LIST' },
			],
		}),

		deleteRole: builder.mutation<void, string>({
			query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
			invalidatesTags: (_r, _e, id) => [
				{ type: 'Role', id },
				{ type: 'Role', id: 'LIST' },
			],
		}),

		assignUserRole: builder.mutation<AssignedUser, AssignUserRolePayload>({
			query: ({ userId, roleId }) => ({
				url: `/users/${userId}/role`,
				method: 'PATCH',
				body: { roleId },
			}),
			invalidatesTags: [{ type: 'Role', id: 'LIST' }],
		}),
	}),
})

export const {
	useListRolesQuery,
	useListPermissionsQuery,
	useCreateRoleMutation,
	useUpdateRoleMutation,
	useDeleteRoleMutation,
	useAssignUserRoleMutation,
} = rolesApi
