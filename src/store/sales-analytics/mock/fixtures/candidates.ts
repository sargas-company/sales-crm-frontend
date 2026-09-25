import type { TaxonomyCandidate } from '../../types/candidates'
import { POSTS } from './dataset'

const NOW_ISO = new Date().toISOString()

const evidencePostsMatching = (predicate: (post: (typeof POSTS)[number]) => boolean): string[] =>
	POSTS.filter(predicate)
		.slice(0, 8)
		.map((p) => p.id)

const buildCandidate = (
	partial: Omit<TaxonomyCandidate, 'createdAt' | 'updatedAt'>
): TaxonomyCandidate => ({
	...partial,
	createdAt: NOW_ISO,
	updatedAt: NOW_ISO,
})

const daysAgoIso = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString()

export const BASELINE_CANDIDATES: TaxonomyCandidate[] = [
	buildCandidate({
		id: 'cand-ai-voice-agents',
		proposedName: 'AI Voice Agents',
		normalizedName: 'ai voice agents',
		proposedType: 'signal',
		status: 'candidate',
		description: 'Voice-first AI agents built on top of realtime LLM APIs.',
		definition: 'AI systems that handle voice interactions in real time.',
		whyEmerging:
			'Multiple posts mention Twilio + OpenAI Realtime combinations; term does not map to existing canonical taxonomy.',
		confidence: 0.72,
		sargasFit: 74,
		fitScore: 74,
		firstSeenAt: daysAgoIso(9),
		lastSeenAt: daysAgoIso(1),
		mentionCount: 6,
		uniquePostCount: 5,
		uniqueClientCount: 4,
		qualifiedPostCount: 3,
		hotPostCount: 1,
		averagePostScore: 72,
		relatedTaxonomyItemIds: ['technology-openai', 'direction-ai-integration'],
		evidencePostIds: evidencePostsMatching((p) =>
			(p.unknownTerms ?? []).some((t) => t.toLowerCase().includes('voice'))
		),
		scoreBreakdown: {
			sargasFit: 74,
			demandGrowth: 68,
			postQuality: 70,
			budgetQuality: 62,
			clientQuality: 66,
			novelty: 82,
			confidence: 60,
		},
		requirements: ['OpenAI Realtime', 'Twilio integration', 'low-latency backend'],
	}),
	buildCandidate({
		id: 'cand-multi-agent',
		proposedName: 'Multi-agent orchestration',
		normalizedName: 'multi-agent orchestration',
		proposedType: 'signal',
		status: 'candidate',
		description: 'Coordinated LLM agents solving tasks together.',
		definition: 'Systems that orchestrate multiple LLM agents with tool use and shared memory.',
		whyEmerging:
			'Distinct enough from generic AI Integration; anchor terms LangGraph, agent orchestration recurrent.',
		confidence: 0.66,
		sargasFit: 78,
		fitScore: 78,
		firstSeenAt: daysAgoIso(11),
		lastSeenAt: daysAgoIso(2),
		mentionCount: 5,
		uniquePostCount: 4,
		uniqueClientCount: 3,
		qualifiedPostCount: 3,
		hotPostCount: 2,
		averagePostScore: 78,
		relatedTaxonomyItemIds: ['technology-openai', 'direction-ai-integration'],
		evidencePostIds: evidencePostsMatching((p) =>
			(p.unknownTerms ?? []).some(
				(t) => t.toLowerCase().includes('multi-agent') || t === 'LangGraph'
			)
		),
		scoreBreakdown: {
			sargasFit: 78,
			demandGrowth: 74,
			postQuality: 80,
			budgetQuality: 74,
			clientQuality: 72,
			novelty: 76,
			confidence: 58,
		},
		requirements: ['LangGraph or equivalent', 'tool use', 'agent tracing'],
	}),
	buildCandidate({
		id: 'cand-cto-advisory',
		proposedName: 'CTO Advisory',
		normalizedName: 'cto advisory',
		proposedType: 'direction',
		status: 'watching',
		description: 'Fractional CTO / architect engagements without hands-on coding.',
		definition:
			'Advisory contracts where a senior engineer coaches leads, reviews architecture, and sets direction.',
		whyEmerging:
			'Recurring cluster distinct from full-stack build work; requires different playbook.',
		confidence: 0.6,
		sargasFit: 70,
		fitScore: 70,
		firstSeenAt: daysAgoIso(14),
		lastSeenAt: daysAgoIso(4),
		mentionCount: 3,
		uniquePostCount: 2,
		uniqueClientCount: 2,
		qualifiedPostCount: 2,
		hotPostCount: 0,
		averagePostScore: 74,
		relatedTaxonomyItemIds: ['direction-saas-development'],
		evidencePostIds: evidencePostsMatching(
			(p) => p.title.toLowerCase().includes('cto') || p.title.toLowerCase().includes('architect')
		),
		scoreBreakdown: {
			sargasFit: 70,
			demandGrowth: 55,
			postQuality: 78,
			budgetQuality: 65,
			clientQuality: 80,
			novelty: 60,
			confidence: 55,
		},
		requirements: ['senior architect', 'coaching skills', 'part-time'],
	}),
	buildCandidate({
		id: 'cand-ai-copilot',
		proposedName: 'AI Copilot',
		normalizedName: 'ai copilot',
		proposedType: 'signal',
		status: 'candidate',
		description: 'Copilot-style embedded assistants inside existing products.',
		definition:
			'In-product AI assistants that call product-specific tools and use per-tenant knowledge.',
		whyEmerging:
			'Distinct from generic OpenAI integrations; the framing is repeatable and Sargas-shaped.',
		confidence: 0.7,
		sargasFit: 82,
		fitScore: 82,
		firstSeenAt: daysAgoIso(7),
		lastSeenAt: daysAgoIso(1),
		mentionCount: 4,
		uniquePostCount: 4,
		uniqueClientCount: 3,
		qualifiedPostCount: 3,
		hotPostCount: 2,
		averagePostScore: 82,
		relatedTaxonomyItemIds: [
			'technology-openai',
			'direction-ai-integration',
			'direction-saas-development',
		],
		evidencePostIds: evidencePostsMatching((p) => (p.unknownTerms ?? []).includes('AI Copilot')),
		scoreBreakdown: {
			sargasFit: 82,
			demandGrowth: 78,
			postQuality: 84,
			budgetQuality: 76,
			clientQuality: 80,
			novelty: 70,
			confidence: 65,
		},
	}),
	buildCandidate({
		id: 'cand-supabase',
		proposedName: 'Supabase',
		normalizedName: 'supabase',
		proposedType: 'technology',
		status: 'approved',
		description: 'Open source Firebase alternative built on Postgres.',
		definition: 'Backend-as-a-service platform providing Postgres, auth, and storage APIs.',
		whyEmerging:
			'Term is already in canonical taxonomy; kept as an example of an approved candidate.',
		confidence: 0.9,
		sargasFit: 84,
		fitScore: 84,
		firstSeenAt: daysAgoIso(25),
		lastSeenAt: daysAgoIso(1),
		mentionCount: 12,
		uniquePostCount: 10,
		uniqueClientCount: 7,
		qualifiedPostCount: 7,
		hotPostCount: 3,
		averagePostScore: 78,
		relatedTaxonomyItemIds: ['technology-supabase'],
		evidencePostIds: evidencePostsMatching((p) => p.technologies.includes('Supabase')),
		scoreBreakdown: {
			sargasFit: 84,
			demandGrowth: 60,
			postQuality: 78,
			budgetQuality: 74,
			clientQuality: 78,
			novelty: 40,
			confidence: 80,
		},
		mergedIntoTaxonomyItemId: 'technology-supabase',
	}),
]

export const cloneBaselineCandidates = (): TaxonomyCandidate[] =>
	BASELINE_CANDIDATES.map((c) => ({ ...c, updatedAt: new Date().toISOString() }))
