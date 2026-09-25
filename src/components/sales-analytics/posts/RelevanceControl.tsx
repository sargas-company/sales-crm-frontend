import styled from 'styled-components'
import {
	CheckOutlined,
	ClearOutlined,
	StarOutlineOutlined,
	ThumbDownOutlined,
} from '@mui/icons-material'
import { useSyncExternalStore } from 'react'
import { useSetRelevanceFeedbackMutation } from '../../../store/sales-analytics/salesAnalyticsApi'
import { getMockState, subscribeMockState } from '../../../store/sales-analytics/mock/state'
import type { ManualRelevance } from '../../../store/sales-analytics/types/feedback'

interface Props {
	postId: string
	compact?: boolean
}

const Wrap = styled('div')<{ $compact: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;

	button {
		background: transparent;
		border: 1px solid transparent;
		padding: ${({ $compact }) => ($compact ? '3px 6px' : '5px 9px')};
		margin: 0;
		min-width: 0;
		border-radius: 8px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: inherit;
		text-transform: none;
		letter-spacing: normal;
		font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};
		font-weight: 600;
		line-height: 1;
		color: #64748b;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}
	button:hover {
		background: rgba(3, 105, 161, 0.08);
		color: rgba(3, 105, 161, 1);
	}
	button.active-very {
		background: rgba(124, 58, 237, 0.08);
		color: #7c3aed;
		border-color: #ddd6fe;
	}
	button.active-rel {
		background: #d1fae5;
		color: #065f46;
		border-color: #a7f3d0;
	}
	button.active-not {
		background: #fee2e2;
		color: #991b1b;
		border-color: #fecaca;
	}
	button:focus-visible {
		outline: 2px solid rgba(3, 105, 161, 1);
		outline-offset: 2px;
	}
`

const useCurrent = (postId: string): ManualRelevance | null =>
	useSyncExternalStore(
		subscribeMockState,
		() => getMockState().feedback.get(postId)?.rating ?? null,
		() => null
	)

const RelevanceControl = ({ postId, compact = false }: Props) => {
	const [setFeedback] = useSetRelevanceFeedbackMutation()
	const current = useCurrent(postId)

	const submit = (rating: ManualRelevance | null) => {
		setFeedback({ postId, rating })
	}

	return (
		<Wrap $compact={compact} role='group' aria-label='Manual relevance'>
			<button
				type='button'
				aria-pressed={current === 'very_relevant'}
				aria-label='Very relevant'
				className={current === 'very_relevant' ? 'active-very' : ''}
				onClick={() => submit(current === 'very_relevant' ? null : 'very_relevant')}
			>
				<StarOutlineOutlined style={{ fontSize: compact ? 14 : 16 }} />
				{!compact && 'Very'}
			</button>
			<button
				type='button'
				aria-pressed={current === 'relevant'}
				aria-label='Relevant'
				className={current === 'relevant' ? 'active-rel' : ''}
				onClick={() => submit(current === 'relevant' ? null : 'relevant')}
			>
				<CheckOutlined style={{ fontSize: compact ? 14 : 16 }} />
				{!compact && 'Relevant'}
			</button>
			<button
				type='button'
				aria-pressed={current === 'not_relevant'}
				aria-label='Not relevant'
				className={current === 'not_relevant' ? 'active-not' : ''}
				onClick={() => submit(current === 'not_relevant' ? null : 'not_relevant')}
			>
				<ThumbDownOutlined style={{ fontSize: compact ? 14 : 16 }} />
				{!compact && 'No'}
			</button>
			{current && (
				<button
					type='button'
					onClick={() => submit(null)}
					aria-label='Clear relevance rating'
					title='Clear'
				>
					<ClearOutlined style={{ fontSize: compact ? 14 : 16 }} />
				</button>
			)}
		</Wrap>
	)
}

export default RelevanceControl
