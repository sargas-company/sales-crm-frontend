import { forwardRef, ReactNode } from 'react'
import styled from 'styled-components'
import { T } from './tokens'

interface Props {
	title?: ReactNode
	hint?: ReactNode
	action?: ReactNode
	padding?: string
	className?: string
	children: ReactNode
}

const SectionCard = forwardRef<HTMLDivElement, Props>(
	({ title, hint, action, padding, className, children }, ref) => (
		<Panel ref={ref} className={className}>
			{(title || hint || action) && (
				<PanelHead>
					<div className='sc-titles'>
						{title && <div className='sc-title'>{title}</div>}
						{hint && <div className='sc-hint'>{hint}</div>}
					</div>
					{action && <div className='sc-action'>{action}</div>}
				</PanelHead>
			)}
			<Body $padding={padding}>{children}</Body>
		</Panel>
	)
)

SectionCard.displayName = 'SectionCard'

export default SectionCard

const Panel = styled('section')`
	background: ${T.cardBg};
	border: 1px solid ${T.border};
	border-radius: 18px;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`

const PanelHead = styled('header')`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 22px 22px;
	border-bottom: 1px solid ${T.divider};

	.sc-titles {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.sc-title {
		font-size: 16px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.2px;
	}
	.sc-hint {
		font-size: 12.5px;
		font-weight: 500;
		color: ${T.textSecondary};
	}
	.sc-action {
		flex-shrink: 0;
	}
`

const Body = styled('div')<{ $padding?: string }>`
	padding: ${({ $padding }) => $padding ?? '22px'};
`
