import type { MockJobPost, ScoreBreakdown } from '../../types/jobPost'
import type { CuratedPostSeed } from './curated'
import { mulberry32, pick, pickWeighted, clamp } from '../../utils/prng'
import { MOCK_PLATFORMS, MOCK_COUNTRIES } from './platforms'

const DIRECTION_WEIGHTS: [string, number][] = [
	['SaaS Development', 5],
	['AI Integration', 5],
	['Workflow Automation', 4],
	['Marketplace Development', 3],
	['Internal Tools', 3],
	['MVP Development', 3],
	['CRM Development', 2],
	['E-commerce', 2],
	['API / Integration', 3],
	['Legacy Modernization', 2],
	['Existing Product Rescue', 3],
	['Maintenance', 2],
	['Bug Fixing', 2],
]

const TECH_STACK_BY_DIRECTION: Record<string, [string, number][]> = {
	'SaaS Development': [
		['Next.js', 6],
		['Node.js', 6],
		['TypeScript', 5],
		['PostgreSQL', 4],
		['React', 3],
		['NestJS', 2],
	],
	'AI Integration': [
		['OpenAI', 7],
		['Python', 4],
		['Node.js', 4],
		['Next.js', 3],
		['TypeScript', 3],
		['PostgreSQL', 2],
	],
	'Workflow Automation': [
		['n8n', 6],
		['Node-RED', 3],
		['OpenAI', 4],
		['Stripe', 3],
		['Node.js', 3],
	],
	'Marketplace Development': [
		['React', 5],
		['Node.js', 5],
		['Stripe', 5],
		['PostgreSQL', 3],
		['Supabase', 2],
	],
	'Internal Tools': [
		['React', 4],
		['TypeScript', 3],
		['PostgreSQL', 2],
		['Directus', 2],
	],
	'MVP Development': [
		['Next.js', 5],
		['Supabase', 3],
		['React', 3],
		['Stripe', 2],
		['OpenAI', 2],
	],
	'CRM Development': [
		['Next.js', 3],
		['Supabase', 3],
		['PostgreSQL', 2],
		['React', 2],
	],
	'E-commerce': [
		['Node.js', 3],
		['Stripe', 4],
		['OpenAI', 2],
	],
	'API / Integration': [
		['Node.js', 4],
		['n8n', 2],
		['Python', 3],
		['Stripe', 2],
	],
	'Legacy Modernization': [
		['Vue', 3],
		['Nuxt', 3],
		['TypeScript', 3],
		['Node.js', 2],
		['Directus', 2],
	],
	'Existing Product Rescue': [
		['Node.js', 4],
		['TypeScript', 3],
		['PostgreSQL', 3],
		['Next.js', 3],
		['Supabase', 2],
	],
	Maintenance: [
		['Node.js', 2],
		['AWS', 2],
	],
	'Bug Fixing': [['Node.js', 1]],
}

const CONTRACT_TYPES: [string, number][] = [
	['fixed', 5],
	['hourly', 4],
	['unknown', 1],
]

const NOTIFICATION_STATUSES: [string, number][] = [
	['sent', 6],
	['not_required', 5],
	['pending', 1],
	['failed', 1],
]

const TITLE_TEMPLATES: Record<string, string[]> = {
	'SaaS Development': [
		'{dir} engineer for {tech1} + {tech2} SaaS',
		'Full-stack {tech1} developer for growing SaaS',
	],
	'AI Integration': [
		'{tech1} + {tech2} AI integration for our SaaS',
		'Add {tech1} assistant to our web app',
	],
	'Workflow Automation': [
		'{tech1} + {tech2} automation project',
		'Build {tech1} workflows for ops team',
	],
	'Marketplace Development': [
		'Two-sided marketplace on {tech1} + {tech2}',
		'Marketplace MVP with {tech1}',
	],
	'Internal Tools': ['Internal admin dashboard in {tech1}', 'Internal ops panel – {tech1}'],
	'MVP Development': ['MVP in 6 weeks: {tech1} + {tech2}', 'Launch MVP on {tech1}'],
	'CRM Development': ['Custom CRM on {tech1}', 'Multi-tenant CRM ({tech1} + {tech2})'],
	'E-commerce': ['E-commerce project – {tech1}', 'Shopify-adjacent build on {tech1}'],
	'API / Integration': [
		'REST/GraphQL integration on {tech1}',
		'{tech1} integration with external systems',
	],
	'Legacy Modernization': [
		'Legacy {tech1} to {tech2} modernization',
		'Rewrite {tech1} app – need help',
	],
	'Existing Product Rescue': [
		'Rescue existing SaaS – {tech1} + {tech2}',
		'Take over half-finished {tech1} project',
	],
	Maintenance: ['Ongoing maintenance – {tech1}', 'Support for existing {tech1} app'],
	'Bug Fixing': ['Bug fix in {tech1} app', 'Small bug fix – {tech1}'],
}

const DESC_TEMPLATES: Record<string, string> = {
	'SaaS Development':
		'Growing SaaS product. Need a solid engineer to help ship features, tune performance and integrate the pieces above.',
	'AI Integration':
		'We want to embed AI features into our product. Prefer someone with production LLM experience.',
	'Workflow Automation':
		'Automating recurring operations. Should reduce manual work meaningfully.',
	'Marketplace Development': 'Two-sided marketplace with payouts and vetting. MVP first, iterate.',
	'Internal Tools': 'Internal team needs a lightweight admin UI on top of existing APIs.',
	'MVP Development': 'Early stage. Need to ship an MVP fast with a small team.',
	'CRM Development': 'Custom CRM tailored to our workflow. Existing CRMs do not fit.',
	'E-commerce': 'E-commerce build – standard checkout, payments, catalog.',
	'API / Integration': 'System integration project. Reliable, testable code required.',
	'Legacy Modernization': 'Older codebase needs to be modernized without breaking behavior.',
	'Existing Product Rescue':
		'Product is partially built. Need someone senior to stabilize and finish.',
	Maintenance: 'Ongoing maintenance and small feature work.',
	'Bug Fixing': 'Single-focused bug we need fixed.',
}

const GOALS_LIB: string[] = [
	'launch analytics SaaS MVP',
	'automate recurring operations',
	'embed AI copilot',
	'stabilize existing SaaS',
	'launch two-sided marketplace',
	'ship internal admin panel',
	'migrate to headless CMS',
]

const PAIN_POINTS_LIB: string[] = [
	'previous developer disappeared',
	'product is slow',
	'need to finish an incomplete application',
	'no technical leadership',
	'need quick MVP launch',
	'need architecture help',
	'manual reconciliation',
]

const DELIVERABLES_LIB: string[] = [
	'MVP dashboard',
	'LLM integration',
	'billing setup',
	'admin panel',
	'workflow automation',
	'API integration',
]

const REQUIREMENTS_LIB: string[] = [
	'senior full-stack',
	'production LLM experience',
	'strong TypeScript',
	'CI/CD setup',
	'Stripe experience',
]

const INTEGRATIONS_LIB: string[] = ['OpenAI', 'Stripe', 'Slack', 'HubSpot', 'Twilio']

const CONCERNS_LIB: string[] = [
	'scope creep',
	'unclear requirements',
	'unverified client',
	'aggressive timeline',
]

const HOUR_MS = 3_600_000

interface BudgetSample {
	contractType: 'fixed' | 'hourly' | 'unknown'
	fixedBudget?: number
	hourlyRateMin?: number
	hourlyRateMax?: number
}

const sampleBudget = (
	rng: () => number,
	contractType: 'fixed' | 'hourly' | 'unknown'
): BudgetSample => {
	if (contractType === 'unknown') return { contractType }
	if (contractType === 'fixed') {
		const buckets: [number, number, number][] = [
			[400, 999, 2],
			[1000, 3000, 3],
			[3001, 7500, 4],
			[7501, 15000, 3],
			[15001, 40000, 2],
		]
		const [lo, hi] = pickWeighted(
			rng,
			buckets.map(([l, h, w]) => [[l, h], w] as [[number, number], number])
		)
		const val = Math.round((lo + (hi - lo) * rng()) / 50) * 50
		return { contractType, fixedBudget: val }
	}
	const buckets: [number, number, number][] = [
		[18, 24, 2],
		[25, 40, 3],
		[41, 60, 3],
		[61, 120, 2],
	]
	const [lo, hi] = pickWeighted(
		rng,
		buckets.map(([l, h, w]) => [[l, h], w] as [[number, number], number])
	)
	const min = Math.round(lo + (hi - lo) * rng() * 0.4)
	const max = Math.round(min + (hi - min) * rng())
	return { contractType, hourlyRateMin: min, hourlyRateMax: max }
}

interface ClientProfile {
	country: string
	paymentVerified: boolean
	totalSpent?: number
	hireRate?: number
	rating?: number
	jobsPosted?: number
	proposalCountAtScan?: number
}

const sampleClient = (rng: () => number): ClientProfile => {
	const tierRoll = rng()
	if (tierRoll < 0.15) {
		return {
			country: pick(rng, MOCK_COUNTRIES),
			paymentVerified: false,
			jobsPosted: Math.floor(rng() * 3),
		}
	}
	if (tierRoll < 0.35) {
		return {
			country: pick(rng, MOCK_COUNTRIES),
			paymentVerified: true,
			totalSpent: Math.round(rng() * 4000),
			hireRate: Math.round(rng() * 40),
			rating: 3.5 + rng() * 1,
			jobsPosted: 1 + Math.floor(rng() * 4),
			proposalCountAtScan: Math.floor(rng() * 30),
		}
	}
	if (tierRoll < 0.7) {
		return {
			country: pick(rng, MOCK_COUNTRIES),
			paymentVerified: true,
			totalSpent: 4000 + Math.round(rng() * 25000),
			hireRate: 45 + Math.round(rng() * 25),
			rating: 4.2 + rng() * 0.6,
			jobsPosted: 4 + Math.floor(rng() * 12),
			proposalCountAtScan: Math.floor(rng() * 25),
		}
	}
	return {
		country: pick(rng, MOCK_COUNTRIES),
		paymentVerified: true,
		totalSpent: 30000 + Math.round(rng() * 250000),
		hireRate: 65 + Math.round(rng() * 25),
		rating: 4.6 + rng() * 0.4,
		jobsPosted: 15 + Math.floor(rng() * 25),
		proposalCountAtScan: Math.floor(rng() * 20),
	}
}

const buildScore = (
	rng: () => number,
	dir: string,
	tech: string[],
	client: ClientProfile,
	budget: BudgetSample
): { score: number; breakdown: ScoreBreakdown; reasons: string[] } => {
	const techFit = clamp(
		45 +
			(tech.some((t) =>
				['Next.js', 'Node.js', 'OpenAI', 'TypeScript', 'n8n', 'React'].includes(t)
			)
				? 25
				: 0) +
			Math.round(rng() * 15),
		0,
		100
	)
	const serviceFit = clamp(
		40 +
			([
				'SaaS Development',
				'AI Integration',
				'Marketplace Development',
				'Workflow Automation',
			].includes(dir)
				? 30
				: 10) +
			Math.round(rng() * 15),
		0,
		100
	)
	const budgetFit = clamp(
		budget.fixedBudget
			? Math.min(90, 30 + budget.fixedBudget / 500)
			: budget.hourlyRateMax
				? Math.min(90, 40 + budget.hourlyRateMax * 0.8)
				: 40,
		0,
		100
	)
	const clientQuality = clamp(
		(client.paymentVerified ? 45 : 15) +
			(client.rating ?? 0) * 6 +
			Math.min(20, (client.totalSpent ?? 0) / 6000),
		0,
		100
	)
	const clarity = clamp(50 + Math.round(rng() * 40), 0, 100)
	const risk = clamp(15 + Math.round(rng() * 40), 0, 100)
	const composite =
		techFit * 0.28 +
		serviceFit * 0.22 +
		budgetFit * 0.18 +
		clientQuality * 0.18 +
		clarity * 0.09 -
		risk * 0.05
	const score = clamp(Math.round(composite), 0, 100)
	const reasons: string[] = []
	if (techFit >= 75) reasons.push('Strong technical fit for Sargas stack.')
	if (serviceFit >= 75) reasons.push('Core service line for Sargas.')
	if (budgetFit >= 75) reasons.push('Budget aligns with typical Sargas engagement size.')
	if (clientQuality >= 75) reasons.push('Verified client with strong hiring history.')
	if (risk >= 45) reasons.push('Some scope risk – confirm requirements.')
	return {
		score,
		breakdown: {
			technicalFit: techFit,
			serviceFit,
			budgetFit,
			clientQuality,
			clarity,
			risk,
		},
		reasons: reasons.slice(0, 3),
	}
}

export interface GenerateArgs {
	seedValue: number
	count: number
	referenceNowMs: number
	windowHours: number
}

export const generatePosts = ({
	seedValue,
	count,
	referenceNowMs,
	windowHours,
}: GenerateArgs): CuratedPostSeed[] => {
	const rng = mulberry32(seedValue)
	const out: CuratedPostSeed[] = []
	for (let i = 0; i < count; i++) {
		const dir = pickWeighted(rng, DIRECTION_WEIGHTS)
		const stack = TECH_STACK_BY_DIRECTION[dir] ?? [['Node.js', 1]]
		const techCount = 1 + Math.floor(rng() * 3)
		const techSet = new Set<string>()
		for (let k = 0; k < techCount; k++) techSet.add(pickWeighted(rng, stack))
		const tech = Array.from(techSet)
		const contractType = pickWeighted(rng, CONTRACT_TYPES) as 'fixed' | 'hourly' | 'unknown'
		const budget = sampleBudget(rng, contractType)
		const client = sampleClient(rng)
		const scoring = buildScore(rng, dir, tech, client, budget)
		const notif = pickWeighted(rng, NOTIFICATION_STATUSES) as
			| 'sent'
			| 'not_required'
			| 'pending'
			| 'failed'
		const notificationStatus = scoring.score >= 50 ? notif : 'not_required'
		const platform = pick(rng, MOCK_PLATFORMS)
		const receivedOffsetHours = 0.5 + rng() * windowHours
		const template = (TITLE_TEMPLATES[dir] ?? ['{dir} engineer for {tech1} + {tech2}'])[
			Math.floor(rng() * (TITLE_TEMPLATES[dir]?.length ?? 1))
		]!
		const title = template
			.replace('{dir}', dir.split(' ')[0]!)
			.replace('{tech1}', tech[0] ?? 'Node.js')
			.replace('{tech2}', tech[1] ?? tech[0] ?? 'React')
		const description =
			DESC_TEMPLATES[dir] ?? 'Project needing a small team. Details in the brief.'
		const goals = rng() < 0.7 ? [pick(rng, GOALS_LIB)] : undefined
		const painPoints = rng() < 0.65 ? [pick(rng, PAIN_POINTS_LIB)] : undefined
		const deliverables = rng() < 0.5 ? [pick(rng, DELIVERABLES_LIB)] : undefined
		const requirements = rng() < 0.5 ? [pick(rng, REQUIREMENTS_LIB)] : undefined
		const integrations = rng() < 0.4 ? [pick(rng, INTEGRATIONS_LIB)] : undefined
		const concerns = rng() < 0.3 ? [pick(rng, CONCERNS_LIB)] : undefined
		out.push({
			id: `gen-${seedValue}-${i}`,
			externalId: `ext-${seedValue}-${i}`,
			platformId: platform.id,
			platformName: platform.name,
			title,
			description,
			originalUrl: `https://example.com/jobs/gen-${seedValue}-${i}`,
			receivedOffsetHours,
			publishedOffsetHours: receivedOffsetHours + 0.5,
			analyzedOffsetHours: receivedOffsetHours - 0.05,
			notifiedOffsetHours: notificationStatus === 'sent' ? receivedOffsetHours - 0.1 : undefined,
			analysisStatus: 'completed',
			notificationStatus,
			score: scoring.score,
			scoreBreakdown: scoring.breakdown,
			scoreReasons: scoring.reasons,
			scoringVersion: 'sv-2026.08',
			promptVersion: 'pv-14',
			modelVersion: 'gpt-4o-2026-08',
			contractType: budget.contractType,
			fixedBudget: budget.fixedBudget,
			hourlyRateMin: budget.hourlyRateMin,
			hourlyRateMax: budget.hourlyRateMax,
			currency: 'USD',
			directions: [dir],
			technologies: tech,
			clientCountry: client.country,
			clientPaymentVerified: client.paymentVerified,
			clientTotalSpent: client.totalSpent,
			clientHireRate: client.hireRate,
			clientRating: client.rating ? Math.round(client.rating * 10) / 10 : undefined,
			clientJobsPosted: client.jobsPosted,
			clientProposalCountAtScan: client.proposalCountAtScan,
			goals,
			painPoints,
			deliverables,
			requirements,
			integrations,
			concerns,
		})
	}
	return out
}

export const materializePost = (seed: CuratedPostSeed, referenceNowMs: number): MockJobPost => {
	const rec = new Date(referenceNowMs - seed.receivedOffsetHours * HOUR_MS)
	const pub = new Date(referenceNowMs - seed.publishedOffsetHours * HOUR_MS)
	const ana = new Date(referenceNowMs - seed.analyzedOffsetHours * HOUR_MS)
	const notified =
		seed.notifiedOffsetHours != null
			? new Date(referenceNowMs - seed.notifiedOffsetHours * HOUR_MS).toISOString()
			: undefined
	const rawPayload = {
		rawModelResponse: `Analyzed on ${ana.toISOString()} · score ${seed.score}`,
		rawExtractedTerms: [...seed.technologies, ...seed.directions, ...(seed.unknownTerms ?? [])],
		rawScores: { composite: seed.score, ...(seed.scoreBreakdown as Record<string, number>) },
		fingerprint: `fp-${seed.id}`,
	}
	return {
		id: seed.id,
		externalId: seed.externalId,
		platformId: seed.platformId,
		platformName: seed.platformName,
		accountId: seed.accountId,
		title: seed.title,
		description: seed.description,
		originalUrl: seed.originalUrl,
		publishedAt: pub.toISOString(),
		receivedAt: rec.toISOString(),
		analyzedAt: ana.toISOString(),
		notifiedAt: notified,
		analysisStatus: seed.analysisStatus,
		notificationStatus: seed.notificationStatus,
		score: seed.score,
		scoreBreakdown: seed.scoreBreakdown,
		scoreReasons: seed.scoreReasons,
		scoringVersion: seed.scoringVersion,
		promptVersion: seed.promptVersion,
		modelVersion: seed.modelVersion,
		contractType: seed.contractType,
		fixedBudget: seed.fixedBudget,
		hourlyRateMin: seed.hourlyRateMin,
		hourlyRateMax: seed.hourlyRateMax,
		currency: seed.currency,
		duration: seed.duration,
		workload: seed.workload,
		directions: seed.directions,
		technologies: seed.technologies,
		unknownTerms: seed.unknownTerms,
		clientCountry: seed.clientCountry,
		clientPaymentVerified: seed.clientPaymentVerified,
		clientTotalSpent: seed.clientTotalSpent,
		clientHireRate: seed.clientHireRate,
		clientRating: seed.clientRating,
		clientJobsPosted: seed.clientJobsPosted,
		clientProposalCountAtScan: seed.clientProposalCountAtScan,
		goals: seed.goals,
		painPoints: seed.painPoints,
		deliverables: seed.deliverables,
		requirements: seed.requirements,
		concerns: seed.concerns,
		integrations: seed.integrations,
		rawPayload,
	}
}
