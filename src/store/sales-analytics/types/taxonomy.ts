export type TaxonomyType = 'technology' | 'direction' | 'signal'

export interface TaxonomyItem {
	id: string
	type: TaxonomyType
	name: string
	slug: string
	description?: string
	status: 'active' | 'archived'
	parentId?: string
	aliases: string[]
	createdAt: string
	updatedAt: string
}

export interface JobPostTaxonomyMatch {
	jobPostId: string
	taxonomyItemId: string
	confidence?: number
	source: 'analyzer' | 'manual' | 'rule'
}

export interface CanonicalTaxonomy {
	technologies: TaxonomyItem[]
	directions: TaxonomyItem[]
	aliases: Record<string, string>
}
