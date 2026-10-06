import styled, { keyframes } from 'styled-components'
import logoUrl from '../../../assets/logo.png'

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
	transition:
		background 0.2s ease,
		border-color 0.2s ease;

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
	isolation: isolate;
	animation: ${({ closing }) => (closing ? popOut : popIn)}
		${({ closing }) => (closing ? '0.2s' : '0.28s')} cubic-bezier(0.22, 1, 0.36, 1) both;
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
		z-index: 2;
	}

	/* Faint stretched brand logo behind the whole dropdown — 10%
	   visible (90% transparent) so it reads as a watermark. */
	&::after {
		content: '';
		position: absolute;
		inset: 0;
		background: url(${logoUrl}) center / cover no-repeat;
		opacity: 0.03;
		pointer-events: none;
		z-index: 0;
	}
	& > * {
		position: relative;
		z-index: 1;
	}
`

export const ProfileHead = styled('div')`
	padding: 20px 20px 18px;
	display: flex;
	align-items: center;
	gap: 14px;
	border-bottom: 1px solid #f1f5f9;
	background: transparent;

	/* Wrapper lives OUTSIDE any clip zone so the pulsing status dot
	   is never cut off by overflow on the avatar itself. */
	.p-avatar-wrap {
		position: relative;
		flex-shrink: 0;
	}
	.p-avatar-wrap > .MuiAvatar-root {
		box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.24);
	}
	.p-avatar-status {
		position: absolute;
		bottom: 1px;
		right: 1px;
		width: 13px;
		height: 13px;
		background: #10b981;
		border-radius: 50%;
		border: 2.5px solid #ffffff;
		animation: ${statusPulse} 2.4s ease-in-out infinite;
		pointer-events: none;
		z-index: 1;
	}

	.p-body {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex: 1;
	}
	.p-name {
		font-size: 15.5px;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.p-email {
		font-size: 11.5px;
		color: #64748b;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		letter-spacing: 0.2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		grid-template-columns: 20px 1fr;
		gap: 12px;
		align-items: center;
		padding: 10px 12px;
		border-radius: 10px;
		cursor: pointer;
		transition:
			background 0.18s ease,
			color 0.18s ease;
		animation: ${itemFadeIn} 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
		color: #1b2230;
	}
	li:hover {
		background: rgba(37, 45, 58, 0.04);
	}

	li:nth-child(1) {
		animation-delay: 40ms;
	}
	li:nth-child(2) {
		animation-delay: 90ms;
	}
	li:nth-child(3) {
		animation-delay: 140ms;
	}
	li:nth-child(4) {
		animation-delay: 190ms;
	}
	li:nth-child(5) {
		animation-delay: 240ms;
	}
	li:nth-child(6) {
		animation-delay: 290ms;
	}
	li:nth-child(7) {
		animation-delay: 340ms;
	}
	li:nth-child(8) {
		animation-delay: 390ms;
	}
	li:nth-child(9) {
		animation-delay: 440ms;
	}
	li:nth-child(10) {
		animation-delay: 490ms;
	}

	/* Hairline divider between menu groups — rendered as an li so the
	   stagger animation keeps alignment and nothing has to re-key. */
	li.menu-sep {
		height: 1px;
		margin: 6px 0;
		padding: 0;
		background: #f1f5f9;
		cursor: default;
		border-radius: 0;
		pointer-events: none;
		display: block;
	}
	li.menu-sep:hover {
		background: #f1f5f9;
	}

	/* External links have an extra "open in new tab" icon pinned to
	   the right edge of the row. */
	li.menu-external {
		grid-template-columns: 20px 1fr 16px;
	}
	li.menu-external .item-external {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #a5a1b0;
		opacity: 0;
		transform: translateX(-3px);
		transition:
			opacity 180ms ease,
			transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	li.menu-external .item-external svg {
		font-size: 14px !important;
	}
	li.menu-external:hover .item-external {
		opacity: 1;
		transform: translateX(0);
	}

	.item-icon {
		width: 20px;
		height: 20px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #6c6879;
	}
	.item-icon svg {
		font-size: 18px !important;
	}
	li:hover .item-icon {
		color: #1b2230;
	}
	.item-label {
		font-size: 13.5px;
		font-weight: 500;
		letter-spacing: -0.1px;
	}
`

export const MenuFoot = styled('div')`
	padding: 4px 12px 8px;
	border-top: 1px solid #f1f5f9;

	.logout-btn {
		width: 100%;
		display: grid;
		grid-template-columns: 20px 1fr;
		gap: 12px;
		align-items: center;
		padding: 10px 12px;
		border-radius: 10px;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background 0.18s ease;
		text-align: left;
		color: #c2410c;
		animation: ${itemFadeIn} 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: 290ms;
	}
	.logout-btn:hover {
		background: rgba(220, 38, 38, 0.05);
	}
	.logout-icon {
		width: 20px;
		height: 20px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #c2410c;
	}
	.logout-icon svg {
		font-size: 18px !important;
	}
	.logout-label {
		font-size: 13.5px;
		font-weight: 500;
		letter-spacing: -0.1px;
	}
`
