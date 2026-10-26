import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import useTheme from '../../theme/useTheme'
import Card from '../card/Card'
const NavContent: FC<{ children: ReactNode }> = ({ children }) => {
	const {
		theme: {
			menuStyle: { collapse },
		},
	} = useTheme()
	return (
		<StyledNavContent
			height='100%'
			position='fixed'
			/* Keep in sync with StyledNavContainer in NavContainer.tsx —
			 * mismatched widths make the fixed sidebar overlay or
			 * under-reserve space from the main content column. */
			width={collapse ? '72px' : '260px'}
			isCollapsed={collapse}
		>
			<NavInner>{children}</NavInner>
		</StyledNavContent>
	)
}

const NavInner = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`

const StyledNavContent = styled(Card)<{ isCollapsed: boolean }>`
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1);
  padding-right: ${({ isCollapsed }) => (isCollapsed ? '0' : '20px')};
  border-radius: 0;
  overflow: hidden;
  ${({ isCollapsed }) =>
		!isCollapsed &&
		`box-shadow: unset;
  background: transparent !important;`}

  /* Label hiding + sub-group visibility are now driven by the
   * NavContainer wrapper's collapse CSS; keeping the hover-expand
   * behaviour here would fight the explicit toggle. */

  @media screen and (max-width: 1200px) {
    & {
      left: -260px;
    }
  }
`

export default NavContent
