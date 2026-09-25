import styled from 'styled-components'
import { T } from '../../components/sales-analytics/_shared/tokens'

export const EmergingGrid = styled('div')`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 12px;

	.card {
		background: ${T.subtleBg};
		border-radius: ${T.radius};
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.card-title {
		font-size: 12px;
		font-weight: 600;
		color: ${T.textSecondary};
		letter-spacing: 0.2px;
	}
	.card-empty {
		font-size: 12px;
		color: ${T.textMuted};
		padding: 6px 0;
	}
	.item {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
		padding: 4px 0;
	}
	.item-name {
		font-size: 13px;
		font-weight: 500;
		color: ${T.textStrong};
		cursor: pointer;
		background: transparent;
		border: none;
		text-align: left;
		padding: 0;
	}
	.item-name:hover {
		color: ${T.primary};
	}
	.item-meta {
		font-size: 11.5px;
		color: ${T.textMuted};
	}
`

export const StatusPill = styled('span')<{ $status: string }>`
	display: inline-block;
	padding: 2px 8px;
	border-radius: ${T.radiusPill};
	font-size: 10.5px;
	font-weight: 600;
	letter-spacing: 0.2px;
	background: ${({ $status }) =>
		$status === 'approved'
			? T.successTint
			: $status === 'watching'
				? T.warningTint
				: $status === 'candidate'
					? T.primaryTint
					: $status === 'merged'
						? T.purpleTint
						: $status === 'rejected' || $status === 'ignored'
							? T.errorTint
							: T.subtleBg};
	color: ${({ $status }) =>
		$status === 'approved'
			? '#065f46'
			: $status === 'watching'
				? '#92400e'
				: $status === 'candidate'
					? T.primary
					: $status === 'merged'
						? T.purple
						: $status === 'rejected' || $status === 'ignored'
							? '#7f1d1d'
							: T.textSecondary};
`
