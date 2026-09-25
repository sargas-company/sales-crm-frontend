import styled from 'styled-components'
import { ErrorOutlineOutlined } from '@mui/icons-material'
import { T } from './tokens'

interface Props {
	title?: string
	description?: string
	onRetry?: () => void
	className?: string
}

const ErrorState = ({
	title = 'Something went wrong',
	description = 'This block could not load. Try again in a moment.',
	onRetry,
	className,
}: Props) => (
	<Wrap className={className} role='alert'>
		<div className='err-icon'>
			<ErrorOutlineOutlined style={{ fontSize: 20 }} />
		</div>
		<div className='err-body'>
			<div className='err-title'>{title}</div>
			<div className='err-desc'>{description}</div>
		</div>
		{onRetry && (
			<button type='button' className='err-retry' onClick={onRetry}>
				Retry
			</button>
		)}
	</Wrap>
)

export default ErrorState

const Wrap = styled('div')`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 14px 16px;
	background: ${T.errorTint};
	border-radius: ${T.radiusSm};

	.err-icon {
		width: 34px;
		height: 34px;
		border-radius: ${T.radiusXs};
		background: ${T.cardBg};
		color: ${T.error};
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.err-body {
		flex: 1;
		min-width: 0;
	}
	.err-title {
		font-size: 13.5px;
		font-weight: 700;
		color: #991b1b;
	}
	.err-desc {
		font-size: 12.5px;
		color: #b91c1c;
		margin-top: 2px;
	}
	.err-retry {
		background: ${T.cardBg};
		border: 1px solid #fecaca;
		color: #b91c1c;
		font-size: 12.5px;
		font-weight: 600;
		padding: 6px 12px;
		border-radius: ${T.radiusXs};
		cursor: pointer;
	}
	.err-retry:hover {
		background: ${T.errorTint};
	}
	.err-retry:focus-visible {
		outline: 2px solid #f87171;
		outline-offset: 2px;
	}
`
