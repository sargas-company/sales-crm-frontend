import { FC, Fragment, useMemo } from 'react'
import { Check } from '@mui/icons-material'
import { ACTIONS, RESOURCES, buildPermission } from '../../store/roles/types'
import {
	Checkmark,
	Matrix,
	MatrixCell,
	MatrixCount,
	MatrixHead,
	MatrixRes,
	MatrixWrap,
} from './roles.styled'

interface Props {
	permissions: Set<string>
	disabled?: boolean
	onToggle: (perm: string) => void
	onToggleRow: (resource: string) => void
	onToggleColumn: (action: string) => void
}

const RolePermissionsMatrix: FC<Props> = ({
	permissions,
	disabled,
	onToggle,
	onToggleRow,
	onToggleColumn,
}) => {
	const columnState = useMemo(() => {
		const map: Record<string, { on: number; total: number }> = {}
		ACTIONS.forEach((a) => {
			const total = RESOURCES.length
			let on = 0
			RESOURCES.forEach((r) => {
				if (permissions.has(buildPermission(r.key, a))) on++
			})
			map[a] = { on, total }
		})
		return map
	}, [permissions])

	return (
		<MatrixWrap>
			<Matrix>
				<MatrixHead className='first'>Resource</MatrixHead>
				{ACTIONS.map((a) => (
					<MatrixHead
						key={a}
						interactive={!disabled}
						onClick={() => !disabled && onToggleColumn(a)}
						title={disabled ? undefined : `Toggle entire "${a}" column`}
					>
						{a}
						{columnState[a].on > 0 && columnState[a].on < columnState[a].total ? '·' : ''}
					</MatrixHead>
				))}
				<MatrixHead>Total</MatrixHead>

				{RESOURCES.map((r, ri) => {
					const isLast = ri === RESOURCES.length - 1
					let rowCount = 0
					const cells = ACTIONS.map((a) => {
						const p = buildPermission(r.key, a)
						const on = permissions.has(p)
						if (on) rowCount++
						return (
							<MatrixCell
								key={a}
								isLast={isLast}
								onClick={() => !disabled && onToggle(p)}
							>
								<Checkmark on={on} className='cb'>
									<Check />
								</Checkmark>
							</MatrixCell>
						)
					})
					return (
						<Fragment key={r.key}>
							<MatrixRes
								isLast={isLast}
								onClick={() => !disabled && onToggleRow(r.key)}
								title={disabled ? undefined : `Toggle entire "${r.label}" row`}
							>
								<span className='r-name'>{r.label}</span>
								<span className='r-hint'>{r.hint}</span>
							</MatrixRes>
							{cells}
							<MatrixCount isLast={isLast}>
								<span>
									<span className='n'>{rowCount}</span>/{ACTIONS.length}
								</span>
							</MatrixCount>
						</Fragment>
					)
				})}
			</Matrix>
		</MatrixWrap>
	)
}

export default RolePermissionsMatrix
