import { ReactNode } from 'react'
import styled from 'styled-components'
import { InboxOutlined } from '@mui/icons-material'
import { T } from './tokens'

interface Props {
	title: string
	description?: string
	icon?: ReactNode
	className?: string
}

const EmptyState = ({ title, description, icon, className }: Props) => (
	<Wrap className={className}>
		<div className='es-icon'>{icon ?? <InboxOutlined style={{ fontSize: 24 }} />}</div>
		<div className='es-title'>{title}</div>
		{description && <div className='es-desc'>{description}</div>}
	</Wrap>
)

export default EmptyState

const Wrap = styled('div')`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 32px 20px;
	text-align: center;
	color: ${T.textSecondary};

	.es-icon {
		width: 44px;
		height: 44px;
		border-radius: ${T.radiusSm};
		background: ${T.subtleBg};
		display: flex;
		align-items: center;
		justify-content: center;
		color: ${T.textMuted};
		margin-bottom: 6px;
	}
	.es-title {
		font-size: 14px;
		font-weight: 700;
		color: ${T.textStrong};
	}
	.es-desc {
		font-size: 13px;
		color: ${T.textSecondary};
		max-width: 420px;
		line-height: 1.5;
	}
`
