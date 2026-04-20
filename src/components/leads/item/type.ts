export interface LeadItem {
	id: number
	title: string
	description: string
	cost: number
	discount: number
	hours: number
}

export interface NewItemHandle {
	items: Array<LeadItem>
}
