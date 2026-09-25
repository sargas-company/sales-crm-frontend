import { createRef, FC, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import NavOptions, { Childrens } from '../type'
import NavGroupButton from './NavGroupButton'
import NavItem from './NavItem'

const collectPaths = (items?: Childrens[]): string[] => {
	if (!items) return []
	return items.flatMap((item) => {
		const own = item.path ? [item.path.toLowerCase()] : []
		const nested = item.childrens ? collectPaths(item.childrens) : []
		const nestedRoot = item.parent?.rootPath ? [item.parent.rootPath.toLowerCase()] : []
		return [...own, ...nestedRoot, ...nested]
	})
}

const NavGroup: FC<Props> = ({ navData: { childrens, parent }, onChildClick }) => {
	const { pathname } = useLocation()
	const [isActive, setIsActive] = useState(false)
	const navItemContainer = createRef<HTMLDivElement>()

	useEffect(() => {
		const stripSlash = (v: string) => v.replace(/\/+$/, '')
		const lowered = stripSlash(pathname.toLowerCase())
		const rootMatch = parent?.rootPath
			? lowered.startsWith(stripSlash(parent.rootPath.toLowerCase()))
			: false
		const childMatch = collectPaths(childrens).some((p) => {
			const base = stripSlash(p)
			return lowered === base || lowered.startsWith(base + '/')
		})

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
							return (
								<NavItem
									{...item}
									label={item.label!}
									path={item.path!}
									icon={item?.icon}
									key={key}
									onClick={onChildClick}
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
