import { baseApi } from '../../api/baseApi'

export type PhoneOperator = 'VODAFONE' | 'KYIVSTAR' | 'LIFECELL' | 'OTHER'
export type PhoneStatus = 'ACTIVE' | 'HOLD' | 'DISABLED'
export type MaintenanceStatus = 'DUE' | 'OVERDUE' | 'COMPLETED' | 'SKIPPED'

export interface PhoneHolder {
	id: string
	firstName: string
	lastName: string
	email: string
}

export interface PhoneBindingService {
	id: string
	name: string
	slug: string
}

export interface PhoneBindingSummary {
	id: string
	serviceId: string
	service: PhoneBindingService
	status: PhoneStatus
	credentialProfile: { id: string; name: string } | null
}

export interface PhoneNumber {
	id: string
	number: string
	operator: PhoneOperator
	status: PhoneStatus
	holderEmployeeId: string | null
	holder: PhoneHolder | null
	holderName: string | null
	maintenanceRequired: boolean
	lastTopUpAt: string | null
	lastNetworkRegistrationAt: string | null
	nextMaintenanceAt: string | null
	notes: string | null
	createdAt: string
	updatedAt: string
	bindings: PhoneBindingSummary[]
}

export interface PhoneBinding {
	id: string
	phoneNumberId: string
	serviceId: string
	service: PhoneBindingService
	credentialProfileId: string | null
	credentialProfile: { id: string; name: string; slug: string } | null
	status: PhoneStatus
	notes: string | null
	createdAt: string
	updatedAt: string
	phoneNumber: {
		id: string
		number: string
		operator: PhoneOperator
		status: PhoneStatus
	}
}

export interface MaintenanceTask {
	id: string
	phoneNumberId: string
	dueAt: string
	status: MaintenanceStatus
	networkRegisteredAt: string | null
	toppedUpAt: string | null
	topUpAmount: string | null
	completedAt: string | null
	completedByUserId: string | null
	lastReminderAt: string | null
	reminderCount: number
	notes: string | null
	phoneNumber: {
		id: string
		number: string
		operator: PhoneOperator
		status: PhoneStatus
		holder?: { firstName: string; lastName: string } | null
	}
}

interface Paginated<T> {
	data: T[]
	total: number
	page: number
	limit: number
}

export const phoneNumbersApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listPhoneNumbers: builder.query<
			Paginated<PhoneNumber>,
			{
				q?: string
				operator?: PhoneOperator
				status?: PhoneStatus
				maintenanceRequired?: boolean
				maintenanceOverdue?: boolean
				page?: number
				limit?: number
				sort?: string
				direction?: 'asc' | 'desc'
			}
		>({
			query: (params) => ({ url: '/phone-numbers', params }),
			providesTags: ['PhoneNumber'],
		}),
		getPhoneSummary: builder.query<
			{
				total: number
				active: number
				due: number
				overdue: number
				nextMaintenanceDate: string | null
			},
			void
		>({
			query: () => ({ url: '/phone-numbers/summary' }),
			providesTags: ['PhoneNumber', 'PhoneMaintenance'],
		}),
		getPhoneNumber: builder.query<PhoneNumber, string>({
			query: (id) => ({ url: `/phone-numbers/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'PhoneNumber', id }],
		}),
		createPhoneNumber: builder.mutation<PhoneNumber, Partial<PhoneNumber>>({
			query: (body) => ({ url: '/phone-numbers', method: 'POST', body }),
			invalidatesTags: ['PhoneNumber'],
		}),
		updatePhoneNumber: builder.mutation<
			PhoneNumber,
			{ id: string; body: Partial<PhoneNumber> }
		>({
			query: ({ id, body }) => ({
				url: `/phone-numbers/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['PhoneNumber'],
		}),
		disablePhoneNumber: builder.mutation<void, string>({
			query: (id) => ({ url: `/phone-numbers/${id}`, method: 'DELETE' }),
			invalidatesTags: ['PhoneNumber'],
		}),

		listBindings: builder.query<
			Paginated<PhoneBinding>,
			{
				q?: string
				phoneNumberId?: string
				serviceId?: string
				profileId?: string
				status?: PhoneStatus
				page?: number
				limit?: number
			}
		>({
			query: (params) => ({ url: '/phone-numbers/bindings/all', params }),
			providesTags: ['PhoneBinding'],
		}),
		createBinding: builder.mutation<PhoneBinding, Partial<PhoneBinding>>({
			query: (body) => ({
				url: '/phone-numbers/bindings',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['PhoneBinding', 'PhoneNumber'],
		}),
		updateBinding: builder.mutation<
			PhoneBinding,
			{ id: string; body: Partial<PhoneBinding> }
		>({
			query: ({ id, body }) => ({
				url: `/phone-numbers/bindings/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['PhoneBinding', 'PhoneNumber'],
		}),
		removeBinding: builder.mutation<void, string>({
			query: (id) => ({
				url: `/phone-numbers/bindings/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['PhoneBinding', 'PhoneNumber'],
		}),

		listOpenMaintenance: builder.query<MaintenanceTask[], void>({
			query: () => ({ url: '/phone-numbers/maintenance/open' }),
			providesTags: ['PhoneMaintenance'],
		}),
		getMaintenanceDefaults: builder.query<
			{ topUpAmount: number },
			void
		>({
			query: () => ({ url: '/phone-numbers/maintenance/defaults' }),
			providesTags: ['PhoneMaintenance'],
		}),
		listMaintenanceHistory: builder.query<
			Paginated<MaintenanceTask>,
			{ page?: number; limit?: number }
		>({
			query: (params) => ({
				url: '/phone-numbers/maintenance/history',
				params,
			}),
			providesTags: ['PhoneMaintenance'],
		}),
		completeMaintenance: builder.mutation<
			MaintenanceTask,
			{
				id: string
				networkRegistered: boolean
				toppedUp: boolean
				topUpAmount?: number
				notes?: string
			}
		>({
			query: ({ id, ...body }) => ({
				url: `/phone-numbers/maintenance/${id}/complete`,
				method: 'POST',
				body,
			}),
			invalidatesTags: ['PhoneMaintenance', 'PhoneNumber'],
		}),
		skipMaintenance: builder.mutation<
			MaintenanceTask,
			{ id: string; reason?: string }
		>({
			query: ({ id, reason }) => ({
				url: `/phone-numbers/maintenance/${id}/skip`,
				method: 'POST',
				body: { reason },
			}),
			invalidatesTags: ['PhoneMaintenance', 'PhoneNumber'],
		}),
	}),
})

export const {
	useListPhoneNumbersQuery,
	useGetPhoneSummaryQuery,
	useGetPhoneNumberQuery,
	useCreatePhoneNumberMutation,
	useUpdatePhoneNumberMutation,
	useDisablePhoneNumberMutation,
	useListBindingsQuery,
	useCreateBindingMutation,
	useUpdateBindingMutation,
	useRemoveBindingMutation,
	useListOpenMaintenanceQuery,
	useGetMaintenanceDefaultsQuery,
	useListMaintenanceHistoryQuery,
	useCompleteMaintenanceMutation,
	useSkipMaintenanceMutation,
} = phoneNumbersApi

export const OPERATOR_LABEL: Record<PhoneOperator, string> = {
	VODAFONE: 'Vodafone',
	KYIVSTAR: 'Kyivstar',
	LIFECELL: 'Lifecell',
	OTHER: 'Other',
}

export const STATUS_LABEL: Record<PhoneStatus, string> = {
	ACTIVE: 'Active',
	HOLD: 'Hold',
	DISABLED: 'Disabled',
}

export function maskNumber(n: string): string {
	const digits = n.replace(/\D/g, '')
	if (digits.length <= 4) return `***${digits}`
	return `***${digits.slice(-4)}`
}
