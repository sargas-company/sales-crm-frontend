import { ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import { InboxOutlined } from '@mui/icons-material'
import { T } from './tokens'

interface Props {
	title: string
	// Kept for API compatibility with legacy call-sites; not rendered.
	description?: string
	icon?: ReactNode
	className?: string
}

const EmptyState = ({ title, icon, className }: Props) => (
	<Wrap className={className}>
		<div className='es-icon' aria-hidden='true'>
			<span className='es-icon-tile'>
				{icon ?? <InboxOutlined style={{ fontSize: 28 }} />}
			</span>
		</div>
		<div className='es-title'>{title}</div>
	</Wrap>
)

export default EmptyState

const float = keyframes`
	0%, 100% { transform: translateY(0); }
	50%      { transform: translateY(-3px); }
`

const Wrap = styled('div')`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 14px;
	padding: 48px 24px 52px;
	text-align: center;
	color: ${T.textSecondary};

	.es-icon {
		position: relative;
		width: 72px;
		height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: ${float} 6s ${T.ease} infinite;

		@media (prefers-reduced-motion: reduce) {
			animation: none;
		}
	}
	.es-icon-tile {
		position: relative;
		width: 56px;
		height: 56px;
		border-radius: 18px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(
			145deg,
			rgba(240, 249, 255, 0.95) 0%,
			rgba(237, 233, 254, 0.9) 100%
		);
		border: 1px solid rgba(3, 105, 161, 0.18);
		color: ${T.primary};
	}
	.es-title {
		font-size: 15px;
		font-weight: 500;
		color: ${T.textStrong};
		letter-spacing: -0.1px;
	}
`
