import { createApi } from '@reduxjs/toolkit/query/react'
import axiosBaseQuery from './axiosBaseQuery'

/* Normalise `VITE_API_URL` by stripping a trailing slash so that
 * callers can always build URLs as `${API_BASE_URL}/some/path`
 * without producing `//` double-slash joins (which the backend
 * rejects as 404). */
const RAW_API_URL =
	import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '')

export const baseApi = createApi({
	reducerPath: 'api',
	baseQuery: axiosBaseQuery,
	tagTypes: [
		'Proposal',
		'Lead',
		'Account',
		'Platform',
		'Counterparty',
		'Client',
		'ClientActivity',
		'LeadActivity',
		'ClientRequest',
		'ClientCall',
		'JobPost',
		'Invoice',
		'Prompt',
		'Setting',
		'SalesFeedback',
		'SalesCandidate',
		'SalesTaxonomy',
		'SalesAlertConfig',
		'Role',
		'Permission',
		'Employee',
		'Project',
		'ProjectReport',
		'TimeOff',
		'Payroll',
		'SalaryReview',
		'PaymentSource',
		'CompensationAnalytics',
		'LinkedInAccount',
		'LinkedInIdea',
		'LinkedInPost',
		'ProjectAnalytics',
		'FinanceWeeklyMonth',
		'FinanceWeeklyEntry',
		'ProjectPaymentRule',
		'CredentialProfile',
		'CredentialAccount',
		'CredentialAttachment',
		'VaultStatus',
		'AuditEvent',
		'PhoneNumber',
		'PhoneBinding',
		'PhoneMaintenance',
		'PhoneService',
		'PortfolioItem',
		'PortfolioTag',
		'BackupRun',
		'DiscordProfile',
	],
	endpoints: () => ({}),
})
