import styled from 'styled-components'
import { T } from '../_shared/tokens'

export const SortableTable = styled('table')`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-size: 12.5px;

	thead th {
		text-align: left;
		padding: 8px 10px;
		font-size: 11.5px;
		font-weight: 600;
		color: ${T.textSecondary};
		letter-spacing: 0.2px;
		background: ${T.cardBg};
		border-bottom: 1px solid ${T.divider};
		user-select: none;
	}
	thead th.numeric {
		text-align: right;
	}
	thead th.sortable {
		cursor: pointer;
	}
	thead th.sortable:hover {
		color: ${T.primary};
	}
	thead th .arrow {
		font-size: 10px;
		margin-left: 3px;
		color: ${T.textMuted};
	}
	thead th .arrow.active {
		color: ${T.primary};
	}
	tbody td {
		padding: 10px;
		border-bottom: 1px solid ${T.divider};
		vertical-align: middle;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tbody tr:hover {
		background: ${T.subtleBg};
	}
	.numeric {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.name {
		font-weight: 500;
		color: ${T.textStrong};
	}
	.dir-name {
		color: ${T.purple};
	}
	.tech-name {
		color: ${T.primary};
	}
	.kpi-delta {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 2px 6px;
		border-radius: ${T.radiusPill};
		font-weight: 600;
		font-size: 11px;
	}
	.kpi-delta.up {
		color: ${T.success};
		background: ${T.successTint};
	}
	.kpi-delta.down {
		color: ${T.error};
		background: ${T.errorTint};
	}
	.kpi-delta.flat {
		color: ${T.textSecondary};
		background: ${T.subtleBg};
	}
`
