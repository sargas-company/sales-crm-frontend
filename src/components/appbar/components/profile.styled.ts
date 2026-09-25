import styled, { keyframes } from 'styled-components'

const popIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(-8px) scale(0.96);
		filter: blur(4px);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
		filter: blur(0);
	}
`

const popOut = keyframes`
	from {
		opacity: 1;
		transform: translateY(0) scale(1);
		filter: blur(0);
	}
	to {
		opacity: 0;
		transform: translateY(-6px) scale(0.97);
		filter: blur(3px);
	}
`

const itemFadeIn = keyframes`
	from { opacity: 0; transform: translateX(6px); }
	to   { opacity: 1; transform: translateX(0); }
`

const statusPulse = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
	50%      { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
`

export const TriggerWrap = styled('div')`
	position: relative;
	display: inline-flex;
`

export const Trigger = styled('button')<{ isOpen?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	cursor: pointer;
	padding: 4px 10px 4px 4px;
	border-radius: 999px;
	background: #ffffff;
	border: 1px solid #e7e7e7;
	transition: background 0.2s ease, border-color 0.2s ease;

	&:hover {
		background: rgba(0, 0, 0, 0.03);
		border-color: rgba(15, 23, 42, 0.14);
	}

	${({ isOpen }) =>
		isOpen &&
		`
			background: rgba(0, 0, 0, 0.04);
			border-color: rgba(15, 23, 42, 0.14);
		`}

	.trigger-chevron {
		color: #64748b;
		transition: transform 0.25s ease;
		font-size: 22px;
	}
	${({ isOpen }) =>
		isOpen &&
		`
			.trigger-chevron { transform: rotate(180deg); }
		`}

	@media (prefers-color-scheme: dark) {
		&:hover {
			background: rgba(255, 255, 255, 0.08);
		}
	}
`

export const Popover = styled('div')<{ closing?: boolean }>`
	position: absolute;
	top: calc(100% + 10px);
	right: 0;
	width: 300px;
	max-width: calc(100vw - 32px);
	background: #ffffff;
	border-radius: 16px;
	box-shadow:
		0 24px 60px -20px rgba(15, 23, 42, 0.28),
		0 8px 24px -12px rgba(15, 23, 42, 0.1);
	z-index: 999;
	overflow: hidden;
	animation: ${({ closing }) => (closing ? popOut : popIn)}
		${({ closing }) => (closing ? '0.2s' : '0.28s')}
		cubic-bezier(0.22, 1, 0.36, 1) both;
	transform-origin: top right;
	border: 1px solid rgba(15, 23, 42, 0.06);

	/* Little arrow pointing to the trigger */
	&::before {
		content: '';
		position: absolute;
		top: -6px;
		right: 22px;
		width: 12px;
		height: 12px;
		background: #ffffff;
		transform: rotate(45deg);
		border-top: 1px solid rgba(15, 23, 42, 0.06);
		border-left: 1px solid rgba(15, 23, 42, 0.06);
	}
`

export const ProfileHead = styled('div')`
	padding: 20px 20px 18px;
	display: flex;
	align-items: center;
	gap: 14px;
	border-bottom: 1px solid #f1f5f9;
	background: linear-gradient(180deg, #f4f8ff 0%, #ffffff 100%);

	.p-avatar {
		position: relative;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background-position: center;
		background-size: cover;
		box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.24);
		flex-shrink: 0;
	}
	.p-avatar-status {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 13px;
		height: 13px;
		background: #10b981;
		border-radius: 50%;
		border: 2.5px solid #ffffff;
		animation: ${statusPulse} 2.4s ease-in-out infinite;
	}
	.p-body {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.p-name {
		font-size: 15.5px;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.2px;
	}
	.p-role {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 10.5px;
		font-weight: 700;
		color: #1e40af;
		background: linear-gradient(135deg, #f0f9ff 0%, #ede9fe 100%);
		padding: 3px 9px;
		border-radius: 999px;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		border: 1px solid rgba(25, 118, 210, 0.15);
		align-self: flex-start;
	}
	.p-role svg {
		font-size: 11px !important;
	}
`

export const MenuList = styled('ul')`
	list-style: none;
	margin: 0;
	padding: 10px 12px;
	display: flex;
	flex-direction: column;
	gap: 2px;

	li {
		display: grid;
		grid-template-columns: 34px 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 10px 12px;
		border-radius: 12px;
		cursor: pointer;
		transition: background 0.18s ease, color 0.18s ease;
		animation: ${itemFadeIn} 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
		color: #0f172a;
	}
	li:hover {
		background: #f8fafc;
	}

	li:nth-child(1) { animation-delay: 40ms; }
	li:nth-child(2) { animation-delay: 90ms; }
	li:nth-child(3) { animation-delay: 140ms; }
	li:nth-child(4) { animation-delay: 190ms; }
	li:nth-child(5) { animation-delay: 240ms; }

	.item-icon {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: #f0f9ff;
		color: #1976d2;
		transition: background 0.18s ease, color 0.18s ease;
	}
	.item-icon svg {
		font-size: 18px !important;
	}
	li:hover .item-icon {
		background: #dfeaff;
		color: #1e40af;
	}
	.item-label {
		font-size: 13.5px;
		font-weight: 600;
		letter-spacing: -0.1px;
	}
	.item-arrow {
		color: #cbd5e1;
		font-size: 18px !important;
		transition: color 0.15s ease, transform 0.18s ease;
	}
	li:hover .item-arrow {
		color: #94a3b8;
		transform: translateX(2px);
	}
`

export const MenuFoot = styled('div')`
	padding: 8px 12px 12px;
	border-top: 1px solid #f1f5f9;
	background: #fafbfc;

	.logout-btn {
		width: 100%;
		display: grid;
		grid-template-columns: 34px 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 10px 12px;
		border-radius: 12px;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background 0.18s ease;
		text-align: left;
		color: #dc2626;
		animation: ${itemFadeIn} 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: 290ms;
	}
	.logout-btn:hover {
		background: #fef2f2;
	}
	.logout-icon {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fef2f2;
		color: #dc2626;
	}
	.logout-icon svg {
		font-size: 18px !important;
	}
	.logout-label {
		font-size: 13.5px;
		font-weight: 700;
		letter-spacing: -0.1px;
	}
	.logout-arrow {
		color: #fca5a5;
		font-size: 18px !important;
		transition: color 0.15s ease, transform 0.18s ease;
	}
	.logout-btn:hover .logout-arrow {
		color: #dc2626;
		transform: translateX(2px);
	}
`
