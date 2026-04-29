export type SettingType = 'string' | 'number' | 'boolean' | 'json'
export type SettingUiType = 'input' | 'textarea' | 'select' | 'toggle' | 'password'

export interface SettingItem {
	key: string
	title: string
	description: string | null
	type: SettingType
	uiType: SettingUiType
	isSecret: boolean
	isRequired: boolean
	order: number
	options: string[] | null
	validationSchema: { min?: number; max?: number } | null
	defaultValue: unknown
	value: unknown
}

export interface SettingSection {
	key: string
	title: string
	order: number
	settings: SettingItem[]
}

export interface UpdateSettingDto {
	value: unknown
}
