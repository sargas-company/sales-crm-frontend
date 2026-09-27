import { ReactNode } from 'react'
export interface Parent {
	title: string
	icon: ReactNode
	rootPath: string
	soon?: boolean
}

// Permission gating (spec §4). `permission` is a single capability key
// or an all-of list. Absent → entry always renders (backward-compatible).
export type NavPermission = string | string[]

export interface Childrens {
	parent?: Parent
	label?: string
	path?: string
	icon?: ReactNode
	childrens?: Childrens[]
	hideIcon?: boolean
	permission?: NavPermission
}

export interface NavItemType {
	label: string
	path: string
	icon?: ReactNode
	hideIcon?: boolean
	permission?: NavPermission
}

export default interface NavOptions {
	icon?: ReactNode
	label?: string
	path?: string
	parent?: Parent
	childrens?: Childrens[]
	hideIcon?: boolean
	permission?: NavPermission
}
