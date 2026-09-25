import { ArrowDropDown, ArrowDropUp, HorizontalRule } from '@mui/icons-material'

interface Props {
	value: number | null
	suffix?: string
	invertGood?: boolean
	className?: string
}

const TrendPill = ({ value, suffix = '%', invertGood, className }: Props) => {
	if (value == null) {
		return (
			<span className={`kpi-delta flat ${className ?? ''}`}>
				<HorizontalRule style={{ fontSize: 12 }} />
				new
			</span>
		)
	}
	let cls: 'up' | 'down' | 'flat' = 'flat'
	if (value !== 0) {
		const isUp = value > 0
		cls = invertGood ? (isUp ? 'down' : 'up') : isUp ? 'up' : 'down'
	}
	return (
		<span className={`kpi-delta ${cls} ${className ?? ''}`}>
			{value === 0 ? (
				<HorizontalRule style={{ fontSize: 12 }} />
			) : value > 0 ? (
				<ArrowDropUp style={{ fontSize: 14 }} />
			) : (
				<ArrowDropDown style={{ fontSize: 14 }} />
			)}
			{Math.abs(value)}
			{suffix}
		</span>
	)
}

export default TrendPill
