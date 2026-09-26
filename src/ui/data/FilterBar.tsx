import { FC, ReactNode } from 'react'
import styled from 'styled-components'

/**
 * Toolbar row for list / table filters. Left slot for search /
 * primary filter, right slot for secondary controls / actions
 * (e.g. "Create", column toggles). Wraps to a second line on
 * narrow viewports.
 */
interface FilterBarProps {
	children?: ReactNode
	actions?: ReactNode
	className?: string
}

const Root = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: ${({ theme }) => theme.spacing!.md}px;
	padding-block: ${({ theme }) => theme.spacing!.sm}px;
	border-bottom: 1px solid ${({ theme }) => theme.colors!.border.subtle};
`

const Left = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	min-width: 0;
	flex: 1 1 auto;
`

const Right = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	flex-shrink: 0;
`

const FilterBar: FC<FilterBarProps> = ({ children, actions, className }) => (
	<Root className={className}>
		<Left>{children}</Left>
		{actions && <Right>{actions}</Right>}
	</Root>
)

export default FilterBar
