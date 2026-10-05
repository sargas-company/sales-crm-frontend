import { KeyboardArrowRight } from '@mui/icons-material'
import { FC, ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import useTheme from '../../../theme/useTheme'
import { Text } from '../../../ui'
import Box from '../../box/Box'

const NavGroupButton: FC<Props> = (props) => {
	const { label, icon, isActive, onHandleClick, soon } = props
	const {
		theme: { mode },
	} = useTheme()
	return (
		<StyledNavGroupButton
			onClick={onHandleClick}
			isActive={isActive}
			mode={mode.name}
			soon={soon}
		>
			<Box display='flex' space={0.6} align='center' flex={1}>
				{icon && (
					<Text
						size={22}
						styles={{ display: 'flex' }}
						secondary={true}
						classes='navgrp-icon'
					>
						{icon}
					</Text>
				)}
				<span className='nav-label'>{label}</span>
				{soon && (
					<span className='soon-badge' aria-label='Coming soon'>
						<span className='soon-dot' />
						Soon
					</span>
				)}
			</Box>
			<span className={`navgrp-arrow flex ${isActive ? 'rotate-down' : ''}`}>
				{<KeyboardArrowRight />}
			</span>
		</StyledNavGroupButton>
	)
}
export default NavGroupButton
interface Props {
	label: string
	icon?: ReactNode
	isActive: boolean
	soon?: boolean
	onHandleClick: () => void
}

const soonPulse = keyframes`
	0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.55); }
	50%      { transform: scale(1.15); box-shadow: 0 0 0 5px rgba(220, 38, 38, 0); }
`

const StyledNavGroupButton = styled('div')<{
	isActive: boolean
	mode: 'dark' | 'light'
	soon?: boolean
}>`
	display: flex;
	flex: 1;
	padding: 0.6rem 0;
	padding-right: 0.6rem;
	padding-left: 1.6rem;
	cursor: ${({ soon }) => (soon ? 'not-allowed' : 'pointer')};
	border-top-right-radius: 1.4rem;
	border-bottom-right-radius: 1.4rem;
	margin-bottom: 4px;
	overflow: hidden;
	background: ${({ isActive, mode }) =>
		isActive
			? mode === 'dark'
				? '#ffffff14'
				: 'rgba(0, 0, 0, 0.04)'
			: 'transparent'};
	transition:
		background 220ms cubic-bezier(0.4, 0, 0.2, 1),
		color 220ms cubic-bezier(0.4, 0, 0.2, 1);

	& .nav-label {
		font-size: 14px;
		font-weight: 500;
		letter-spacing: 0.1px;
	}

	&:hover {
		background: ${({ mode }) => (mode === 'dark' ? '#ffffff14' : 'rgba(0, 0, 0, 0.04)')};
	}

	& .navgrp-icon svg {
		transition:
			transform 220ms cubic-bezier(0.4, 0, 0.2, 1),
			color 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	&:hover .navgrp-icon svg {
		transform: scale(1.08);
	}

	& > .navgrp-arrow {
		display: flex;
		opacity: 0.6;
		transition:
			transform 280ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 220ms ease;
	}

	&:hover > .navgrp-arrow {
		opacity: 1;
	}

	& .rotate-down {
		transform: rotate(90deg);
	}

	& .soon-badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-left: 8px;
		padding: 2px 8px 2px 7px;
		background: ${({ mode }) =>
			mode === 'dark' ? 'rgba(220, 38, 38, 0.18)' : '#fee2e2'};
		color: ${({ mode }) => (mode === 'dark' ? '#fca5a5' : '#dc2626')};
		font-size: 9.5px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.6px;
		border-radius: 999px;
		line-height: 1;
		border: 1px solid ${({ mode }) =>
			mode === 'dark' ? 'rgba(252, 165, 165, 0.24)' : 'rgba(220, 38, 38, 0.18)'};
	}

	& .soon-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: ${({ mode }) => (mode === 'dark' ? '#fca5a5' : '#dc2626')};
		animation: ${soonPulse} 1.8s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		& .soon-dot {
			animation: none;
		}
	}
`
