import type { MockJobPost } from '../../types/jobPost'

export interface PlaybookDef {
	id: string
	cluster: string
	targetPattern: string
	openingAngle: string
	proofPoints: string[]
	technicalEmphasis: string[]
	discoveryQuestions: string[]
	avoid: string[]
	match: (post: MockJobPost) => boolean
	fallbackGoals: string[]
	fallbackPainPoints: string[]
}

export const PLAYBOOK_DEFS: PlaybookDef[] = [
	{
		id: 'pb-ai-saas',
		cluster: 'AI SaaS',
		targetPattern:
			'SaaS product embedding OpenAI or similar; Next.js/Node stack; funded early stage.',
		openingAngle:
			'Frame Sargas as a team that ships production LLM features weekly, not a one-off integrator.',
		proofPoints: [
			'Ship-first case studies with production LLM in the loop',
			'Metrics: latency, cost, guardrails',
			'Post-launch operational support',
		],
		technicalEmphasis: [
			'Prompt versioning and evaluation',
			'Retrieval and per-tenant grounding',
			'Streaming UI with proper cancellation',
		],
		discoveryQuestions: [
			'Which single AI capability, if shipped, moves your KPIs the most?',
			'Do you have a golden dataset for evals?',
			'Who owns AI cost / abuse guardrails?',
		],
		avoid: ['Promising conversion uplift without a measurement plan', 'Vague "we do AI" pitches'],
		match: (p) =>
			p.directions.includes('AI Integration') && p.directions.includes('SaaS Development'),
		fallbackGoals: ['launch AI SaaS features', 'embed AI copilot'],
		fallbackPainPoints: ['no LLM ops experience', 'need quick MVP launch'],
	},
	{
		id: 'pb-rescue',
		cluster: 'Existing Product Rescue',
		targetPattern: 'Half-finished SaaS, previous team gone, urgent stabilization or ship.',
		openingAngle:
			'Lead with a 2-week stabilization sprint proposal – audit, quick wins, then plan.',
		proofPoints: [
			'Rescue narrative case studies (before/after)',
			'Sample audit deliverables',
			'Testimonial on continuity handovers',
		],
		technicalEmphasis: [
			'Instrumentation-first',
			'Ship risk map, not a rewrite plan',
			'Reversible refactors',
		],
		discoveryQuestions: [
			'What is the single most painful current failure mode?',
			'What ships in the next 4 weeks vs later?',
			'Which parts of the previous team’s code do you still trust?',
		],
		avoid: ['Promising full rewrite without discovery', 'Committing to fixed price before audit'],
		match: (p) => p.directions.includes('Existing Product Rescue'),
		fallbackGoals: ['stabilize existing SaaS', 'finish half-finished SaaS'],
		fallbackPainPoints: ['previous developer disappeared', 'product is slow'],
	},
	{
		id: 'pb-marketplace',
		cluster: 'Marketplace',
		targetPattern: 'Two-sided marketplace, Stripe Connect payouts, MVP-ready scope.',
		openingAngle: 'Anchor on Stripe Connect + trust/vetting flows Sargas has shipped before.',
		proofPoints: [
			'Prior marketplace with payouts and disputes',
			'KYC/vetting patterns',
			'Onboarding cohort metrics',
		],
		technicalEmphasis: [
			'Payout topology up front',
			'Idempotent webhooks',
			'Both-sided onboarding UX',
		],
		discoveryQuestions: [
			'Are payouts split, escrow, or direct?',
			'What defines the first "healthy" cohort of both sides?',
			'What is the smallest first vertical you can win?',
		],
		avoid: [
			'Building both sides at once beyond a landing page',
			'Feature-complete admin before real transactions',
		],
		match: (p) => p.directions.includes('Marketplace Development'),
		fallbackGoals: ['launch two-sided marketplace'],
		fallbackPainPoints: ['need Stripe Connect experience', 'need architecture help'],
	},
	{
		id: 'pb-automation',
		cluster: 'Workflow Automation',
		targetPattern: 'n8n / Node-RED / OpenAI automation replacing manual ops.',
		openingAngle:
			'Position as an operator-friendly automation partner, not a raw scripting shop.',
		proofPoints: [
			'Before/after ops savings',
			'Guardrails for LLM steps',
			'Runbooks and operator UIs',
		],
		technicalEmphasis: [
			'Observable workflows',
			'Retry and dead-letter handling',
			'Cost-aware LLM steps',
		],
		discoveryQuestions: [
			'How is the workflow currently done?',
			'How is success measured post-launch?',
			'Who will operate this after handover?',
		],
		avoid: ['Pitching custom code where n8n does the job', 'Fixed price on undefined edge cases'],
		match: (p) => p.directions.includes('Workflow Automation'),
		fallbackGoals: ['automate recurring operations'],
		fallbackPainPoints: ['manual reconciliation', 'no technical leadership'],
	},
	{
		id: 'pb-mvp',
		cluster: 'MVP Development',
		targetPattern: 'Early-stage founder, tight scope, launch within 6-10 weeks.',
		openingAngle:
			'Lead with a scoped MVP plan and a fixed sprint cadence, not open-ended discovery.',
		proofPoints: [
			'MVP launch case studies',
			'Post-launch support samples',
			'Founder testimonials on speed',
		],
		technicalEmphasis: [
			'Small, boring stack',
			'Analytics from day one',
			'Ship path to next paying customer',
		],
		discoveryQuestions: [
			'Who is the first paying customer?',
			'What is the single MVP loop?',
			'What is out of scope until v2?',
		],
		avoid: ['Feature creep', 'Custom infra before traction'],
		match: (p) => p.directions.includes('MVP Development'),
		fallbackGoals: ['launch MVP fast'],
		fallbackPainPoints: ['no technical leadership', 'need quick MVP launch'],
	},
	{
		id: 'pb-cto',
		cluster: 'Architecture / CTO Support',
		targetPattern: 'Fractional CTO or architect advisory, coaching without hands-on coding.',
		openingAngle:
			'Sell judgment and continuity: recurring architecture reviews, coaching, ship confidence.',
		proofPoints: [
			'Advisory retainers with retained clients',
			'Sample architecture review deliverables',
			'Hiring / leveling guidance samples',
		],
		technicalEmphasis: [
			'Architecture decision records',
			'Ship risk framing',
			'Reversible bets first',
		],
		discoveryQuestions: [
			'What is the biggest technical bet in the next quarter?',
			'Who is the lead engineer we would partner with?',
			'What would "great" look like in 90 days?',
		],
		avoid: ['Committing to shipping code inside advisory scope', 'Vague deliverables'],
		match: (p) =>
			p.title.toLowerCase().includes('cto') || p.title.toLowerCase().includes('architect'),
		fallbackGoals: ['scale engineering', 'architecture guidance'],
		fallbackPainPoints: ['no technical leadership', 'need architecture help'],
	},
]
