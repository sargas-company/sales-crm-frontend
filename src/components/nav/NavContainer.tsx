import { ChevronLeftRounded } from '@mui/icons-material'
import { ReactNode, FC } from 'react'
import styled from 'styled-components'
import useTheme from '../../theme/useTheme'
const NavContainer: FC<{ children: ReactNode }> = ({ children }) => {
	const {
		theme: {
			menuStyle: { collapse, visible, layout },
		},
		dispatch,
	} = useTheme()
	if (visible || layout === 'horizontal') {
		return null
	}
	return (
		<StyledNavContainer collapsed={collapse}>
			{children}
			<CollapseToggle
				type='button'
				aria-label={collapse ? 'Expand menu' : 'Collapse menu'}
				onClick={dispatch?.handleChangeMenuCollapse}
				collapsed={collapse}
			>
				<ChevronLeftRounded style={{ fontSize: 18 }} />
			</CollapseToggle>
		</StyledNavContainer>
	)
}

const StyledNavContainer = styled('div')<{ collapsed: boolean }>`
	position: relative;
	flex: 0 0 auto;
	/* Reserve exactly what NavContent takes when expanded (no extra
	 * gap — the main content column already has its own padding).
	 * When collapsed we keep ~16px breathing room so the main page
	 * doesn't butt right up against the icon strip. */
	width: ${({ collapsed }) => (collapsed ? 88 : 260)}px;
	transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1);
	z-index: 1000;
	overflow: hidden;
	--sidebar-w: ${({ collapsed }) => (collapsed ? 72 : 260)}px;

	@media screen and (max-width: 1200px) {
		transform: translateX(-260px);
		display: none;
	}

	& .app-text-logo {
		opacity: ${({ collapsed }) => (collapsed ? 0 : 1)};
		transition: opacity 220ms ease;
		pointer-events: ${({ collapsed }) => (collapsed ? 'none' : 'auto')};
	}

	/* Labels and the "soon" badge get the slide-out treatment on
	 * collapse. The .navgrp-arrow is excluded so the rotate(90deg)
	 * applied by NavGroupButton's .rotate-down class survives — a
	 * blanket transform here would otherwise override it. */
	& .nav-label,
	& .soon-badge {
		display: inline-block;
		opacity: 1;
		transform: translateX(0);
		max-width: 220px;
		white-space: nowrap;
		overflow: hidden;
		transition:
			opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
			max-width 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	& .navgrp-arrow {
		opacity: 1;
		max-width: 220px;
		transition:
			opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
			max-width 320ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	${({ collapsed }) =>
		collapsed &&
		`
		& .nav-label,
		& .soon-badge {
			opacity: 0;
			transform: translateX(-12px);
			max-width: 0;
			pointer-events: none;
		}
		& .navgrp-arrow,
		& .nav-group-btn:hover > .navgrp-arrow {
			opacity: 0;
			max-width: 0;
			pointer-events: none;
		}
		& .nav-item,
		& .nav-group-btn {
			justify-content: center;
			padding-left: 0.9rem !important;
			padding-right: 0.9rem !important;
		}
		/* Active row: blue pill keeps a 10px gap to the sidebar's
		 * right edge (so it doesn't glue to the border).
		 * Non-active rows: shift the icon slightly to the right so
		 * it visually sits where the active icon sits inside the
		 * pill — no horizontal "jump" when the active state moves. */
		& .nav-item.nav-item-active,
		& .nav-group-btn.is-active {
			margin-right: 10px;
		}
		& .nav-item:not(.nav-item-active),
		& .nav-group-btn:not(.is-active) {
			padding-left: 1.8rem !important;
			padding-right: 0.6rem !important;
		}
		& .nav-group-btn > div {
			flex: none !important;
			justify-content: center;
		}
		& .nav-item-container {
			height: 0 !important;
		}
		/* Active group row in collapsed mode gets the same strong
		 * blue pill treatment as an active leaf NavItem — so the
		 * user still sees "I'm somewhere inside Sales" even without
		 * labels. Only applied in collapsed; expanded keeps the
		 * subtle isActive background from NavGroupButton itself. */
		& .nav-group-btn.is-active {
			background: linear-gradient(270deg, #0284c7, #075985) !important;
			box-shadow: rgba(3, 105, 161, 0.28) -2px 6px 16px -4px;
			color: #ffffff;
		}
		& .nav-group-btn.is-active svg {
			color: #ffffff;
		}
	`}
`

const CollapseToggle = styled('button')<{ collapsed: boolean }>`
	position: fixed;
	/* Pixel-measured positions (via DOM getBoundingClientRect on the
	 * live app) so the toggle sits on real sidebar anchors:
	 *  - expanded: center over the group-chevron column (centerX=218)
	 *    and vertically aligned with the SARGAS logo center (y≈42);
	 *  - collapsed: hangs on the sidebar's right edge (center at
	 *    x=72, half outside), so it doesn't block the S logo icon. */
	top: 28px;
	left: ${({ collapsed }) => (collapsed ? 72 - 14 : 218 - 14)}px;
	width: 28px !important;
	height: 28px !important;
	min-width: 28px;
	min-height: 28px;
	max-width: 28px;
	max-height: 28px;
	box-sizing: border-box;
	padding: 0;
	margin: 0;
	flex: none;
	border-radius: 50%;
	border: none;
	outline: none;
	background: #ffffff;
	color: #334155;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6px 18px -6px rgba(15, 23, 42, 0.28), 0 1px 3px rgba(15, 23, 42, 0.1);
	z-index: 2000;
	transition:
		left 320ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 220ms cubic-bezier(0.4, 0, 0.2, 1),
		box-shadow 220ms ease,
		background 160ms ease;

	svg {
		transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
		transform: rotate(${({ collapsed }) => (collapsed ? 180 : 0)}deg);
	}

	&:hover {
		background: #ffffff;
		box-shadow: 0 10px 22px -6px rgba(15, 23, 42, 0.35), 0 2px 4px rgba(15, 23, 42, 0.12);
		transform: scale(1.1);
	}
	&:active {
		transform: scale(0.94);
	}
	&:focus-visible {
		box-shadow:
			0 0 0 2px rgba(59, 130, 246, 0.5),
			0 6px 18px -6px rgba(15, 23, 42, 0.28);
	}

	@media screen and (max-width: 1200px) {
		display: none;
	}
`

export default NavContainer
