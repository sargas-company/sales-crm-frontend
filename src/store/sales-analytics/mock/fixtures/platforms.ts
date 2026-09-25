export interface MockPlatform {
	id: string
	name: string
}

export const MOCK_PLATFORMS: MockPlatform[] = [
	{ id: 'plat-upwork', name: 'Upwork' },
	{ id: 'plat-freelancer', name: 'Freelancer' },
	{ id: 'plat-toptal', name: 'Toptal' },
	{ id: 'plat-vibeworker', name: 'Vibeworker' },
]

export const MOCK_COUNTRIES = ['US', 'UK', 'DE', 'CA', 'AU', 'NL', 'FR', 'SE', 'CH', 'AE']
