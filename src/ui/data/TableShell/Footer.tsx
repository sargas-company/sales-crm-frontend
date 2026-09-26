import { CSSProperties, FC, ReactNode } from 'react'

/**
 * Thin `<tfoot>` wrapper matching the existing `TableHead` / `TableBody`
 * shape from `components/table/`. Kept purely structural — page-level
 * styling comes from the surrounding TableShell rows.
 */
interface Props {
	classes?: string
	children: ReactNode
	style?: CSSProperties
}

const Footer: FC<Props> = ({ classes, children, style }) => (
	<tfoot className={`holy-table-foot ${classes ? classes : ''}`} style={style}>
		{children}
	</tfoot>
)

export default Footer
