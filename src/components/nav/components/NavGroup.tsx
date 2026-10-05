import { createRef, FC, useEffect, useMemo, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import NavOptions, { Childrens } from '../type'
import { navSectionRoot } from '../navMatch'
import NavGroupButton from './NavGroupButton'
import NavItem from './NavItem'

// Collect the match-roots contributed by a subtree: each leaf child
// contributes its section root (list/add/edit/view all fold into the
// same feature namespace), and each nested group contributes its own
// rootPath plus its descendants'.
const collectSectionRoots = (items?: Childrens[]): string[] => {
	if (!items) return []
	return items.flatMap((item) => {
		const own = item.path ? [navSectionRoot(item.path)] : []
		const nestedRoot = item.parent?.rootPath ? [item.parent.rootPath] : []
		const nested = item.childrens ? collectSectionRoots(item.childrens) : []
		return [...own, ...nestedRoot, ...nested]
	})
}

const matchesUnder = (pathname: string, root: string): boolean =>
	matchPath({ path: root, end: false }, pathname) !== null

const NavGroup: FC<Props> = ({ navData: { childrens, parent }, onChildClick }) => {
	const { pathname } = useLocation()
	const [isActive, setIsActive] = useState(false)
	const navItemContainer = createRef<HTMLDivElement>()

	// Pick the single leaf child whose section root is the longest
	// prefix of the current pathname. Siblings that also match by
	// shorter prefix (e.g. Projects "List" at `/projects` when the URL
	// is `/projects/reports/xxx`) get suppressed via
	// `activeSectionRoot` so only the most specific item highlights.
	const activeSectionRoot = useMemo(() => {
		if (!childrens) return undefined
		let best: string | undefined
		for (const item of childrens) {
			if (!item.path) continue
			const root = navSectionRoot(item.path)
			if (matchesUnder(pathname, root)) {
				if (!best || root.length > best.length) best = root
			}
		}
		return best
	}, [childrens, pathname])

	useEffect(() => {
		const rootMatch = parent?.rootPath ? matchesUnder(pathname, parent.rootPath) : false
		const childMatch = collectSectionRoots(childrens).some((root) =>
			matchesUnder(pathname, root),
		)

		if (parent?.rootPath || childrens) {
			setIsActive(rootMatch || childMatch)
		}
	}, [pathname])

	useEffect(() => {
		const el = navItemContainer.current
		if (!el) return

		const targetHeight = el.scrollHeight

		if (isActive) {
			el.style.height = '0px'
			requestAnimationFrame(() => {
				el.style.height = `${targetHeight}px`
			})
			const handleEnd = (e: TransitionEvent) => {
				if (e.propertyName !== 'height') return
				el.style.height = 'auto'
				el.removeEventListener('transitionend', handleEnd)
			}
			el.addEventListener('transitionend', handleEnd)
			return () => el.removeEventListener('transitionend', handleEnd)
		}

		el.style.height = `${el.scrollHeight}px`
		requestAnimationFrame(() => {
			el.style.height = '0px'
		})
	}, [isActive])

	return (
		<StyledNavGroup>
			{parent && (
				<NavGroupButton
					isActive={isActive}
					label={parent!.title}
					icon={parent.icon}
					soon={parent.soon}
					onHandleClick={() => setIsActive((prevState) => !prevState)}
				/>
			)}
			<div
				className={`nav-item-container ${isActive ? 'show-nav-item' : ''}`}
				ref={navItemContainer}
			>
				<ul className='nav-item-inner'>
					{childrens &&
						childrens.map((item, i) => {
							const key = String(i)
							if (item.childrens) {
								return (
									<NavGroup
										{...item}
										navData={{ parent: item.parent, childrens: item.childrens }}
										key={key}
										onChildClick={onChildClick}
									/>
								)
							}
							const itemRoot = navSectionRoot(item.path!)
							const isActiveOverride = activeSectionRoot === itemRoot
							return (
								<NavItem
									{...item}
									label={item.label!}
									path={item.path!}
									icon={item?.icon}
									key={key}
									onClick={onChildClick}
									isActiveOverride={isActiveOverride}
								/>
							)
						})}
				</ul>
			</div>
		</StyledNavGroup>
	)
}
export default NavGroup

interface Props {
	navData: NavOptions
	onChildClick?: () => void
}

const StyledNavGroup = styled('ul')`
	display: flex;
	flex-direction: column;

	& > .nav-item-container {
		min-height: 0px;
		height: 0px;
		overflow: hidden;
		opacity: 0;
		transform: translateY(-4px);
		transition:
			height 280ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 220ms ease,
			transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	& > .nav-item-container > .nav-item-inner {
		padding: 0;
		margin: 0;
		padding-bottom: 20px;
		list-style: none;
	}

	& > .show-nav-item {
		opacity: 1;
		transform: translateY(0);
	}
`
