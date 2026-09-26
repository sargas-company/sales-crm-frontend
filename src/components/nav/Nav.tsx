import styled, { useTheme } from 'styled-components'
import ScrollContainer from '../scroll-container/ScrollContainer'
import NavGroup from './components/NavGroup'
import NavHeading from './components/NavHeading'
import NavItem from './components/NavItem'
import NavContainer from './NavContainer'
import NavContent from './NavContent'
import navList, { secondaryNavList } from './navLists'

const Nav = () => {
	const theme = useTheme()

	const renderNavItem = (nav: (typeof navList)[number], index: number) => {
		const key = String(index)
		if (nav.childrens) {
			return <NavGroup navData={{ parent: nav.parent!, childrens: nav.childrens }} key={key} />
		}
		return <NavItem label={nav.label!} path={nav.path!} icon={nav.icon} key={key} />
	}

	return (
		<NavContainer>
			<NavContent>
				<PrimaryNav>
					<NavHeading />
					<ScrollContainer
						maxHeight='calc(100vh - 10rem)'
						scrollBarSize={`${theme.spacing!.xs}px`}
					>
						{navList.map(renderNavItem)}
					</ScrollContainer>
				</PrimaryNav>
				<div>
					<NavDivider />
					{secondaryNavList.map(renderNavItem)}
				</div>
			</NavContent>
		</NavContainer>
	)
}
export default Nav

const PrimaryNav = styled('div')`
	margin-bottom: 70px;
`

const NavDivider = styled('hr')`
	border: 0;
	border-top: 1px solid ${({ theme }) => theme.colors!.border.default};
	margin: 0 0 ${({ theme }) => `${theme.spacing!.sm}px`} 0;
`
