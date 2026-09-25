import styled, { keyframes } from 'styled-components'

const bellShake = keyframes`
	0%, 100% { transform: rotate(0deg); }
	10% { transform: rotate(-12deg); }
	20% { transform: rotate(10deg); }
	30% { transform: rotate(-8deg); }
	40% { transform: rotate(6deg); }
	50% { transform: rotate(-4deg); }
	60% { transform: rotate(2deg); }
`

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

const backdropFadeOut = keyframes`
	from { opacity: 1; }
	to   { opacity: 0; }
`

const itemFadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateX(6px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
`

const badgePulse = keyframes`
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.15); }
`

const backdropFade = keyframes`
	from { opacity: 0; }
	to   { opacity: 1; }
`

export const BellWrap = styled('div')`
	position: relative;
	display: inline-flex;

	.bell-button {
		position: relative;
		border: none;
		background: transparent;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: inherit;
		transition: background 0.2s ease, color 0.2s ease;
	}
	.bell-icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transform-origin: 50% 15%;
	}
	.bell-icon-wrap.wiggle {
		animation: ${bellShake} 0.7s ease;
	}
	.bell-button svg {
		font-size: 24px;
		transition: transform 0.2s ease;
	}
	.bell-button:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	.bell-button.is-open {
		background: rgba(0, 0, 0, 0.06);
	}

	.bell-badge {
		position: absolute;
		top: 5px;
		right: 5px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: linear-gradient(135deg, #f97377 0%, #ee5a68 100%);
		color: #fff;
		font-size: 10.5px;
		font-weight: 800;
		border-radius: 999px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 6px -1px rgba(238, 90, 104, 0.5);
		letter-spacing: 0.2px;
		animation: ${badgePulse} 2s ease-in-out infinite;
		pointer-events: none;
	}

	@media (prefers-color-scheme: dark) {
		.bell-button:hover {
			background: rgba(255, 255, 255, 0.08);
		}
		.bell-button.is-open {
			background: rgba(255, 255, 255, 0.1);
		}
	}
`

export const Backdrop = styled('div')<{ closing?: boolean }>`
	position: fixed;
	inset: 0;
	background: transparent;
	z-index: 998;
	animation: ${({ closing }) => (closing ? backdropFadeOut : backdropFade)} 0.2s ease-out both;
`

export const Popover = styled('div')<{ closing?: boolean }>`
	position: absolute;
	top: calc(100% + 10px);
	right: 0;
	width: 360px;
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

	/* Little arrow pointing to the bell */
	&::before {
		content: '';
		position: absolute;
		top: -6px;
		right: 16px;
		width: 12px;
		height: 12px;
		background: #ffffff;
		transform: rotate(45deg);
		border-top: 1px solid rgba(15, 23, 42, 0.06);
		border-left: 1px solid rgba(15, 23, 42, 0.06);
	}
`

export const PopoverHead = styled('div')`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px 20px 14px;
	border-bottom: 1px solid #f1f5f9;

	.head-title {
		font-size: 15px;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.2px;
	}
	.head-count {
		font-size: 11.5px;
		font-weight: 700;
		color: #dc2626;
		background: #fee2e2;
		border-radius: 999px;
		padding: 3px 10px;
		letter-spacing: 0.2px;
	}
`

export const NotifList = styled('ul')`
	list-style: none;
	margin: 0;
	padding: 10px 12px;
	max-height: 380px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 4px;

	li {
		display: grid;
		grid-template-columns: 36px 1fr auto;
		gap: 12px;
		align-items: flex-start;
		padding: 12px;
		border-radius: 12px;
		cursor: pointer;
		transition: background 0.18s ease;
		animation: ${itemFadeIn} 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	li:hover {
		background: #f8fafc;
	}
	li.unread {
		background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%);
	}
	li.unread:hover {
		background: linear-gradient(90deg, #dbeafe 0%, #f1f5f9 100%);
	}

	li:nth-child(1) { animation-delay: 40ms; }
	li:nth-child(2) { animation-delay: 90ms; }
	li:nth-child(3) { animation-delay: 140ms; }
	li:nth-child(4) { animation-delay: 190ms; }
	li:nth-child(5) { animation-delay: 240ms; }
	li:nth-child(6) { animation-delay: 290ms; }

	.notif-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.notif-icon svg {
		font-size: 18px !important;
	}

	.notif-body {
		min-width: 0;
	}
	.notif-title {
		font-size: 13px;
		font-weight: 700;
		color: #0f172a;
		line-height: 1.35;
	}
	.notif-desc {
		font-size: 12px;
		color: #64748b;
		margin-top: 2px;
		line-height: 1.4;
	}
	.notif-time {
		font-size: 11px;
		font-weight: 600;
		color: #94a3b8;
		white-space: nowrap;
		padding-top: 2px;
	}

	.notif-unread-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #3b82f6;
		margin-top: 6px;
		flex-shrink: 0;
	}
`

export const PopoverFoot = styled('div')`
	padding: 12px 16px;
	border-top: 1px solid #f1f5f9;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #fafbfc;

	button {
		border: none;
		background: transparent;
		font-size: 12.5px;
		font-weight: 700;
		color: #1976d2;
		cursor: pointer;
		padding: 6px 12px;
		border-radius: 8px;
		transition: background 0.15s ease, color 0.15s ease;
	}
	button:hover {
		background: #f0f9ff;
	}
	button.muted {
		color: #64748b;
	}
	button.muted:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #0f172a;
	}
`
