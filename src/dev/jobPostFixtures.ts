/*
 * Demo fixtures for the Job Post detail page redesign.
 *
 * These are used by the dev-only `/job-posts/dev-states` route to
 * visually verify the five analysis states without hitting the
 * backend or the real AI pipeline. Imported by `JobPostPreview`,
 * which short-circuits its data query when it sees an id starting
 * with `demo-` while `import.meta.env.DEV` is true.
 */
import type { JobPostItem } from '../store/job-posts/types/definition'

const BASE_PAYLOAD = {
	match: {
		reasoning:
			'Matched because the budget band and tech stack align with the "React + NestJS, EU-based clients" scanner profile. Client is payment-verified and has consistent hiring history.',
	},
	job: {
		postedAt: '2026-10-10T18:12:33Z',
		description:
			'About us\n\nWe are a Berlin-based e-commerce platform that has been operating in the German-speaking market since 2019. Over the past twelve months we have crossed €14M in annualised GMV, expanded into Austria and Switzerland, and started piloting a B2B channel for small-batch wholesale buyers. The founding team is still deeply technical and we move fast — this is not a role where you will be waiting on committees for decisions.\n\nWhat we need\n\nWe are looking for a senior full-stack engineer to lead the next phase of our Stripe + ERP integration. Our current implementation grew organically over three years and now shows its age. Webhooks are duplicated across two services, retries are inconsistent, and reconciliation at month-end requires manual CSV exports. We want someone who has done this kind of untangling before, who can propose a clean architecture, and who can then ship it incrementally without taking down the live checkout flow.\n\nResponsibilities\n\n• Design and implement a reliable webhook pipeline that handles Stripe + Shopify in a single, idempotent flow\n• Refactor the queue layer (currently Bull on a legacy Redis instance) and migrate it to BullMQ with proper observability\n• Build the data-sync layer between our order service and SAP Business One, with a focus on auditable reconciliation\n• Pair with our junior React developer on the dashboard and own code reviews for her PRs during this engagement\n• Document the end-to-end flow so that when you roll off the team has everything they need to maintain and extend it\n\nMust haves\n\n• 5+ years of production Node.js + TypeScript in a payments or billing context\n• Hands-on experience with Stripe webhooks, Payment Intents, Setup Intents, and Connect\n• Comfortable owning a migration from a legacy worker system to BullMQ or a comparable queue\n• Strong written English — a large part of the handover will be async documentation and architecture notes\n\nNice to have\n\n• Prior Shopify work, especially around multi-store catalogs and inventory sync\n• Experience with ERPs — SAP Business One is a bonus, Dynamics or NetSuite is also valuable\n• Exposure to German tax and invoicing requirements (DATEV, Elster, GoBD)\n\nHow we work\n\nWe pay in EUR via Upwork, invoice monthly, and expect 25–30 hrs/week with a 3-month minimum and a strong intent to extend. Daily async standup in Slack, weekly 45-minute call for architecture, and open office hours on Thursdays. We do not expect you to be online in a specific timezone, but we do expect responsiveness within business hours CET.\n\nSelection process\n\n1) Short written reply to a scoping question we will send after the first message\n2) 45-minute paid technical conversation (we pay for your time regardless of outcome)\n3) Small paid trial sprint of ~10 hours, with a clear exit on either side\n4) Full engagement starting the following Monday\n\nIf any of the above is a dealbreaker on your side, please mention it in the first message. We prefer honest short replies to long polished ones.',
		questions: [
			'Describe a complex Stripe integration you shipped and what went wrong.',
			'How do you approach webhook idempotency?',
			'What is your availability for the first two weeks of November?',
		],
	},
}

const LONG_FIXTURE: JobPostItem = {
	id: 'demo-long',
	chatId: 'demo',
	messageId: 1,
	status: 'PROCESSED',
	enqueueState: 'ENQUEUED',
	decision: 'approve',
	matchScore: 86,
	priority: 'high',
	createdAt: '2026-10-10T19:00:00Z',
	processedAt: '2026-10-10T19:00:14Z',
	title:
		'Senior full-stack engineer for Stripe + ERP integration (long-term, EU-based team)',
	jobUrl: 'https://www.upwork.com/jobs/~demo-long',
	scanner: 'vibe-worker',
	location: 'Berlin, Germany',
	budget: '$40–$60/hr',
	totalSpent: 185000,
	avgRatePaid: 48,
	hireRate: 0.82,
	hSkillsKeywords: [
		'nestjs',
		'react',
		'stripe',
		'bullmq',
		'typescript',
		'shopify',
		'sap',
	],
	budgetType: 'hourly',
	budgetMin: 40,
	budgetMax: 60,
	budgetCurrency: 'USD',
	postedAt: '2026-10-10T18:12:33Z',
	country: 'DE',
	city: 'Berlin',
	clientPaymentVerified: true,
	clientRating: 4.92,
	clientHires: 54,
	contractType: 'Hourly',
	duration: '3-6 months',
	hoursPerWeek: '25-30 hrs/week',
	experienceLevel: 'Expert',
	connectsRequired: 16,
	categories: ['Web development', 'Full-stack'],
	questions: BASE_PAYLOAD.job.questions,
	clientJobsPosted: 71,
	clientReviewCount: 48,
	clientRankLabel: 'Top Rated Plus',
	clientRankScore: 92,
	clientLocationRestriction: 'Europe only',
	rawText: '',
	rawPayload: BASE_PAYLOAD,
	aiResponse: {
		decision: 'approve',
		match_score: 86,
		priority: 'high',
		hard_stop: false,
		hard_stop_reason: '',
		subscores: {
			scope_clarity: 85,
			tech_fit: 92,
			client_quality: 90,
			budget_fit: 70,
		},
		reasons: [
			'Stripe + ERP work matches our top-performing specialisation.',
			'EU client with payment verified and 54 past hires at 4.92★ — low delivery risk.',
			'Long engagement with a sane weekly cap (25–30 hrs/week).',
		],
		red_flags: [
			'SAP B1 is "nice to have" today but could be insisted upon mid-engagement.',
		],
		short_summary:
			'Strong fit — the stack, budget band and client profile all line up. Flag the SAP B1 ambiguity in the proposal.',
	},
}

// Augment aiResponse with Phase B "evaluation" structured fields.
;(LONG_FIXTURE.aiResponse as unknown as {
	evaluation: Record<string, unknown>
}).evaluation = {
	reasoning:
		'Clear scope (Stripe + webhook refactor), good client (Top Rated Plus, 92 score), hourly rate within band. We should propose a tight scope-of-work for the first two weeks and defer SAP B1 to a later statement of work to avoid scope creep.',
	strengths: [
		'Direct match for our Stripe + queue specialisation.',
		'Client has a consistent 4.92 rating over 48 reviews.',
		'Sane expectations on hours per week.',
	],
	risks: [
		'SAP B1 wording hints at scope ambiguity — pin down in the proposal.',
		'ERP work with legacy systems is harder to estimate; buffer the first sprint.',
	],
	scopeClarity: 'High for Stripe; medium for ERP.',
	quickWin: 'Reliable Stripe webhook replay within sprint 1.',
	effortEstimate: '~120 hours over 6–8 weeks for sprint 1.',
}

const HAIKU_REJECT_FIXTURE: JobPostItem = {
	...LONG_FIXTURE,
	id: 'demo-haiku-reject',
	status: 'SKIPPED',
	decision: null,
	matchScore: null,
	priority: null,
	processedAt: '2026-10-11T07:14:02Z',
	title: 'Looking for someone to clone this website for cheap',
	totalSpent: 0,
	hireRate: 0.08,
	clientRating: null,
	clientReviewCount: null,
	clientHires: 1,
	clientJobsPosted: 32,
	clientPaymentVerified: false,
	clientRankLabel: null,
	clientRankScore: null,
	aiResponse: undefined,
}

;(HAIKU_REJECT_FIXTURE as unknown as {
	aiResponse: { gatekeeper: Record<string, unknown> }
}).aiResponse = {
	gatekeeper: {
		fit: false,
		confidence: 0.95,
		reason:
			'Low-budget clone-request pattern. 32 jobs posted with only 1 hire and 8% hire rate suggests a serial posting + ghosting pattern.',
	},
}

const WAITING_FIXTURE: JobPostItem = {
	...LONG_FIXTURE,
	id: 'demo-waiting',
	status: 'NEW',
	enqueueState: 'BACKLOG',
	decision: null,
	matchScore: null,
	priority: null,
	processedAt: null,
	aiResponse: undefined,
	title: 'Need a React Native dev for a short, well-scoped feature',
}

const FAILED_FIXTURE: JobPostItem = {
	...LONG_FIXTURE,
	id: 'demo-failed',
	status: 'FAILED',
	enqueueState: 'ENQUEUED',
	decision: null,
	matchScore: null,
	priority: null,
	processedAt: '2026-10-11T08:02:11Z',
	aiResponse: undefined,
	title: 'Node.js engineer for Shopify + analytics',
}

const INCOMPLETE_FIXTURE: JobPostItem = {
	...LONG_FIXTURE,
	id: 'demo-incomplete-client',
	title: 'React engineer — small landing page',
	status: 'PROCESSED',
	decision: 'maybe',
	matchScore: 62,
	priority: 'low',
	city: null,
	country: null,
	location: null,
	totalSpent: null,
	avgRatePaid: null,
	hireRate: null,
	clientRating: null,
	clientReviewCount: null,
	clientHires: null,
	clientJobsPosted: null,
	clientPaymentVerified: null,
	clientRankLabel: null,
	clientRankScore: null,
	clientLocationRestriction: null,
	hoursPerWeek: null,
	duration: null,
	experienceLevel: null,
	connectsRequired: null,
	aiResponse: {
		decision: 'maybe',
		match_score: 62,
		priority: 'low',
		hard_stop: false,
		hard_stop_reason: '',
		subscores: {},
		reasons: [
			'Scope is simple and in-stack, so execution risk is low.',
		],
		red_flags: [
			'No client history yet — treat the first week as a trial.',
		],
		short_summary:
			'Workable but thin — the project is in stack, but there is almost no client signal to lean on.',
	},
}

export const JOB_POST_FIXTURES: Record<string, JobPostItem> = {
	'demo-long': LONG_FIXTURE,
	'demo-haiku-reject': HAIKU_REJECT_FIXTURE,
	'demo-waiting': WAITING_FIXTURE,
	'demo-failed': FAILED_FIXTURE,
	'demo-incomplete-client': INCOMPLETE_FIXTURE,
}

export const JOB_POST_FIXTURE_INDEX: Array<{
	id: string
	title: string
	note: string
}> = [
	{
		id: 'demo-long',
		title: 'Long post with full AI analysis',
		note: 'All sections populated — description, questions, strengths, risks, subscores.',
	},
	{
		id: 'demo-haiku-reject',
		title: 'Rejected by first-pass gate (Haiku)',
		note: 'SKIPPED with a gatekeeper reason — no stage-2 output.',
	},
	{
		id: 'demo-waiting',
		title: 'Waiting for AI (BACKLOG)',
		note: 'NEW post, pipeline paused — no AI yet.',
	},
	{
		id: 'demo-failed',
		title: 'FAILED analysis',
		note: 'Pipeline could not finish — Retry action available.',
	},
	{
		id: 'demo-incomplete-client',
		title: 'Incomplete client profile',
		note: 'Analysed but most client fields are null.',
	},
]
