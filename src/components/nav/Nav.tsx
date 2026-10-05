import styled, { useTheme } from 'styled-components'
import ScrollContainer from '../scroll-container/ScrollContainer'
import NavGroup from './components/NavGroup'
import NavHeading from './components/NavHeading'
import NavItem from './components/NavItem'
import NavContainer from './NavContainer'
import NavContent from './NavContent'
import navList, { secondaryNavList } from './navLists'
import usePermissions from '../../hooks/usePermissions'
import type { Childrens, NavPermission } from './type'

// Nav entries without a `permission` field render as before
// (backward-compatible). Entries opting in are dropped when the caller
// lacks the listed key(s); a group parent is dropped when every one of
// its children is filtered out.
const permissionAllows = (
	perm: NavPermission | undefined,
	has: (key: string) => boolean
): boolean => {
	if (!perm) return true
	const keys = Array.isArray(perm) ? perm : [perm]
	return keys.every(has)
}

const Nav = () => {
	const theme = useTheme()
	const { has } = usePermissions()

	const filterChildrens = (children: Childrens[]) =>
		children.filter((c) => permissionAllows(c.permission, has))

	const renderNavItem = (nav: (typeof navList)[number], index: number) => {
		const key = String(index)
		if (nav.childrens) {
			if (!permissionAllows(nav.permission, has)) return null
			const visibleChildren = filterChildrens(nav.childrens)
			if (visibleChildren.length === 0) return null
			return <NavGroup navData={{ parent: nav.parent!, childrens: visibleChildren }} key={key} />
		}
		if (!permissionAllows(nav.permission, has)) return null
		return <NavItem label={nav.label!} path={nav.path!} icon={nav.icon} key={key} />
	}

	return (
		<NavContainer>
			<NavContent>
				<NavHeading />
				<ScrollContainer
					maxHeight='calc(100vh - 5.5rem)'
					scrollBarSize={`${theme.spacing!.xs}px`}
				>
					{navList.map(renderNavItem)}
					<SectionGap />
					<NavDivider />
					{secondaryNavList.map(renderNavItem)}
					<BottomPad />
				</ScrollContainer>
			</NavContent>
		</NavContainer>
	)
}
export default Nav

const SectionGap = styled('div')`
	height: 20px;
`

/* Bottom breathing room so the last fully-expanded group never sits
 * flush against the viewport edge. */
const BottomPad = styled('div')`
	height: 70px;
`

const NavDivider = styled('hr')`
	border: 0;
	border-top: 1px solid ${({ theme }) => theme.colors!.border.default};
	margin: 0 0 ${({ theme }) => `${theme.spacing!.sm}px`} 0;
`
