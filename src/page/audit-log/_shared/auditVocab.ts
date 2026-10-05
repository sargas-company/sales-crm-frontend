/**
 * Human-readable mapping for the raw action key coming off the audit
 * stream. The frontend renders each row as a sentence; this helper
 * decides the verb, severity-free noun, and category.
 *
 * Keep the keys stable with the backend. If you add a new backend
 * action, add it here (otherwise the row falls back to a lightly
 * humanised slug).
 */

import type { AuditEvent, AuditDomain } from '../../../store/audit-log/auditLogApi'

export interface ActionVocab {
	/** Imperative verb used in the sentence: "revealed", "created", "changed". */
	verb: string
	/** Target noun suffix: "password", "invoice status", "role permissions". */
	noun?: string
}

const VOCAB: Record<string, ActionVocab> = {
	// AUTH
	'auth.login': { verb: 'signed in' },
	'auth.logout': { verb: 'signed out' },
	// CREDENTIALS
	'vault.session.open': { verb: 'unlocked the vault' },
	'vault.unlock.denied': { verb: 'denied vault unlock' },
	'vault.session.close': { verb: 'locked the vault' },
	'credentials.profile.create': { verb: 'created profile' },
	'credentials.profile.update': { verb: 'updated profile' },
	'credentials.profile.archive': { verb: 'archived profile' },
	'credentials.account.create': { verb: 'created account' },
	'credentials.account.update': { verb: 'updated account' },
	'credentials.account.archive': { verb: 'archived account' },
	'credentials.account.hard_delete': { verb: 'hard-deleted account' },
	'credentials.account.reveal': { verb: 'revealed', noun: 'secret field' },
	'credentials.account.copy': { verb: 'copied', noun: 'secret field' },
	'credentials.account.totp': { verb: 'viewed TOTP code' },
	'credentials.attachment.upload': { verb: 'uploaded attachment' },
	'credentials.attachment.download': { verb: 'downloaded attachment' },
	'credentials.attachment.delete': { verb: 'deleted attachment' },
	'mfa.passkey.register': { verb: 'enrolled passkey' },
	'mfa.totp.enrolled': { verb: 'enrolled authenticator app' },
	'mfa.recovery.generated': { verb: 'regenerated recovery codes' },
	// RBAC
	'role.create': { verb: 'created role' },
	'role.update': { verb: 'updated role' },
	'role.delete': { verb: 'deleted role' },
	'user.role.assign': { verb: 'changed role for' },
	// FINANCE
	'invoice.create': { verb: 'created invoice' },
	'invoice.update': { verb: 'updated invoice' },
	'invoice.delete': { verb: 'deleted invoice' },
	'invoice.status.change': { verb: 'changed invoice status for' },
	'invoice.pdf.generate': { verb: 'generated PDF for' },
	'payroll.create': { verb: 'created payroll entry' },
	'payroll.update': { verb: 'updated payroll entry' },
	'payroll.delete': { verb: 'deleted payroll entry' },
	'payroll.markPaid': { verb: 'marked payroll paid' },
	'payroll.reopen': { verb: 'reopened payroll entry' },
	'salaryReview.create': { verb: 'scheduled salary review' },
	'salaryReview.update': { verb: 'updated salary review' },
	'salaryReview.delete': { verb: 'deleted salary review' },
	'salaryReview.result.change': { verb: 'changed salary review outcome' },
	'paymentSource.create': { verb: 'created payment source' },
	'paymentSource.update': { verb: 'updated payment source' },
	'paymentSource.activate': { verb: 'activated payment source' },
	'paymentSource.archive': { verb: 'archived payment source' },
	'paymentSource.delete': { verb: 'deleted payment source' },
	// PROJECTS
	'project.create': { verb: 'created project' },
	'project.update': { verb: 'updated project' },
	'project.delete': { verb: 'deleted project' },
	'project.status.change': { verb: 'changed project status for' },
	'project.members.change': { verb: 'changed project members for' },
	// EMPLOYEES
	'employee.create': { verb: 'created employee record' },
	'employee.update': { verb: 'updated employee record' },
	'employee.delete': { verb: 'deleted employee record' },
	'employee.status.change': { verb: 'changed status for' },
}

export const vocabFor = (action: string): ActionVocab => {
	if (VOCAB[action]) return VOCAB[action]
	// Fallback: "domain.sub_part.verb" → "did sub_part verb"
	const parts = action.split('.')
	const verb = parts[parts.length - 1].replace(/_/g, ' ')
	return { verb }
}

export const DOMAIN_LABEL: Record<AuditDomain | string, string> = {
	AUTH: 'Auth',
	CREDENTIALS: 'Credentials',
	FINANCE: 'Finance',
	RBAC: 'Access',
	SETTINGS: 'Settings',
	EMPLOYEES: 'Employees',
	PROJECTS: 'Projects',
	CRM: 'CRM',
}

export const DOMAIN_TONE: Record<string, 'blue' | 'violet' | 'amber' | 'rose' | 'teal' | 'slate'> = {
	AUTH: 'slate',
	CREDENTIALS: 'violet',
	FINANCE: 'teal',
	RBAC: 'amber',
	SETTINGS: 'slate',
	EMPLOYEES: 'blue',
	PROJECTS: 'blue',
	CRM: 'rose',
}

/**
 * Format a single event row into a human-readable fragment the
 * component can render verbatim: "<actor> <verb> <target label>".
 * Returns the parts separately so the UI can style them.
 */
export function describeEvent(event: AuditEvent): {
	actorText: string
	verbText: string
	targetText: string
} {
	const voc = vocabFor(event.action)
	const actorText =
		event.actorName ||
		event.actorEmail ||
		(event.actorType === 'SYSTEM' ? 'System' : 'Someone')
	const target = event.targetLabel ?? ''
	const nounPart = voc.noun ? ` ${voc.noun}` : ''
	return {
		actorText,
		verbText: `${voc.verb}${nounPart}`,
		targetText: target,
	}
}
