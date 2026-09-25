import styled, { css, keyframes } from 'styled-components'

export const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const isDark = (t: any) => t.mode?.name === 'dark'
const accent = (t: any) => t.primaryColor?.color || 'rgba(3, 105, 161, 1)'
const cardBg = (t: any) => (isDark(t) ? '#252d3a' : '#ffffff')
const pageBg = (t: any) => (isDark(t) ? '#1B2430' : '#f8f5ff')
const textCol = (t: any) => (isDark(t) ? '#d3d3d3' : '#3a3541')
const mutedCol = (t: any) => (isDark(t) ? 'rgba(211, 211, 211, 0.55)' : '#7a7686')
const dimCol = (t: any) => (isDark(t) ? 'rgba(211, 211, 211, 0.35)' : '#a5a1b0')
const lineCol = (t: any) => (isDark(t) ? 'rgba(255, 255, 255, 0.06)' : '#eeecf3')
const subtleBg = (t: any) => (isDark(t) ? 'rgba(255, 255, 255, 0.03)' : '#f6f4fb')
const accentSoft = (t: any) => (isDark(t) ? 'rgba(3, 105, 161, 0.18)' : '#f0f9ff')

/* ============ Layout ============ */
export const ShellCard = styled('div')`
	background: ${({ theme }) => cardBg(theme)};
	border-radius: 28px;
	box-shadow: ${({ theme }) =>
		isDark(theme)
			? '0 12px 35px rgba(0, 0, 0, 0.28)'
			: '0 12px 35px rgba(39, 36, 45, 0.06)'};
	overflow: hidden;
	color: ${({ theme }) => textCol(theme)};
`

export const ShellInner = styled('div')`
	padding: 28px 32px 32px;

	@media (max-width: 720px) {
		padding: 20px 20px 24px;
	}
`

export const Crumbs = styled('nav')`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	font-weight: 500;
	color: ${({ theme }) => mutedCol(theme)};
	margin-bottom: 10px;

	.sep {
		opacity: 0.5;
	}
	.link {
		background: none;
		border: 0;
		padding: 0;
		cursor: pointer;
		font: inherit;
		color: inherit;
		transition: color 160ms ${EASE};
	}
	.link:hover {
		color: ${({ theme }) => accent(theme)};
	}
	.current {
		color: ${({ theme }) => textCol(theme)};
	}
`

export const PageHead = styled('div')`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24px;
	padding-bottom: 24px;
	border-bottom: 1px solid ${({ theme }) => lineCol(theme)};
	margin-bottom: 24px;

	.title h1 {
		font-size: 26px;
		font-weight: 800;
		line-height: 1.15;
		margin: 0;
		color: ${({ theme }) => textCol(theme)};
	}
	.title p {
		color: ${({ theme }) => mutedCol(theme)};
		margin: 6px 0 0;
		max-width: 60ch;
		font-size: 14px;
	}
	@media (max-width: 720px) {
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
	}
`

/* ============ Panels & tables ============ */
export const Panel = styled('div')`
	background: ${({ theme }) => cardBg(theme)};
	border: 1px solid ${({ theme }) => lineCol(theme)};
	border-radius: 18px;
	overflow: hidden;
`

export const PanelHead = styled('div')`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 16px 20px;
	border-bottom: 1px solid ${({ theme }) => lineCol(theme)};

	.count {
		font-size: 13px;
		font-weight: 600;
		color: ${({ theme }) => mutedCol(theme)};
	}
`

export const Search = styled('div')`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: ${({ theme }) => subtleBg(theme)};
	border: 1px solid transparent;
	border-radius: 12px;
	min-width: 240px;
	transition:
		border-color 160ms ${EASE},
		background 160ms ${EASE};

	&:focus-within {
		border-color: ${({ theme }) => accent(theme)};
		background: ${({ theme }) => cardBg(theme)};
	}
	input {
		border: 0;
		outline: 0;
		background: none;
		font-family: inherit;
		font-size: 14px;
		color: ${({ theme }) => textCol(theme)};
		width: 100%;
	}
	input::placeholder {
		color: ${({ theme }) => dimCol(theme)};
	}
	svg {
		width: 16px;
		height: 16px;
		color: ${({ theme }) => mutedCol(theme)};
	}
`

export const RolesTable = styled('table')`
	width: 100%;
	border-collapse: collapse;

	th,
	td {
		text-align: left;
		padding: 16px 20px;
	}
	th {
		font-size: 12px;
		font-weight: 600;
		color: ${({ theme }) => mutedCol(theme)};
		text-transform: uppercase;
		letter-spacing: 0.6px;
		border-bottom: 1px solid ${({ theme }) => lineCol(theme)};
	}
	tbody tr {
		border-top: 1px solid ${({ theme }) => lineCol(theme)};
		cursor: pointer;
		transition: background 160ms ${EASE};
	}
	tbody tr:first-child {
		border-top: 0;
	}
	tbody tr:hover {
		background: ${({ theme }) => subtleBg(theme)};
	}
	td.num {
		font-size: 14px;
		color: ${({ theme }) => textCol(theme)};
	}
	td.actions {
		text-align: right;
	}
	.row-actions {
		display: inline-flex;
		gap: 4px;
		opacity: 0;
		transform: translateX(6px);
		transition:
			opacity 180ms ${EASE},
			transform 180ms ${EASE};
	}
	tbody tr:hover .row-actions {
		opacity: 1;
		transform: translateX(0);
	}
`

export const RoleName = styled('div')`
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 15px;
	font-weight: 700;
	color: ${({ theme }) => textCol(theme)};
`
export const RoleDesc = styled('div')`
	color: ${({ theme }) => mutedCol(theme)};
	font-size: 13px;
	margin-top: 3px;
`

/* Badges — все в акцентной палитре, без охры */
export const Badge = styled('span')<{ variant: 'system' | 'default' | 'custom' | 'neutral' }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	padding: 4px 10px;
	border-radius: 8px;

	${({ variant, theme }) => {
		if (variant === 'system')
			return css`
				color: ${accent(theme)};
				background: ${accentSoft(theme)};
			`
		if (variant === 'default')
			return css`
				color: ${accent(theme)};
				background: ${accentSoft(theme)};
				opacity: 0.85;
			`
		if (variant === 'custom')
			return css`
				color: ${mutedCol(theme)};
				background: ${subtleBg(theme)};
			`
		return css`
			color: ${mutedCol(theme)};
			background: ${subtleBg(theme)};
		`
	}}
`

/* Avatars */
export const AvatarCluster = styled('span')`
	display: inline-flex;
	align-items: center;
`

export const AvatarChip = styled('span')<{ bg: string; dark: boolean }>`
	width: 26px;
	height: 26px;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	font-weight: 700;
	color: #fff;
	background: ${({ bg }) => bg};
	border: 2px solid ${({ dark }) => (dark ? '#252d3a' : '#ffffff')};
	margin-left: -8px;
	&:first-child {
		margin-left: 0;
	}
`

/* Meter */
export const Meter = styled('div')`
	display: inline-flex;
	align-items: center;
	gap: 10px;

	.bar {
		width: 76px;
		height: 6px;
		background: ${({ theme }) => (isDark(theme) ? 'rgba(255, 255, 255, 0.08)' : '#ececf3')};
		border-radius: 4px;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		background: ${({ theme }) => accent(theme)};
		border-radius: 4px;
		transition: width 320ms ${EASE};
	}
	.num {
		font-size: 13px;
		font-weight: 600;
		color: ${({ theme }) => textCol(theme)};
	}
	.num .sub {
		color: ${({ theme }) => mutedCol(theme)};
		font-weight: 500;
		margin-left: 2px;
	}
`

/* ============ Editor ============ */
export const EditorHead = styled('div')`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24px;
	padding-bottom: 24px;
	border-bottom: 1px solid ${({ theme }) => lineCol(theme)};
	margin-bottom: 20px;

	.role-title {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.role-title h1 {
		margin: 0;
		font-size: 26px;
		font-weight: 800;
		line-height: 1.2;
		color: ${({ theme }) => textCol(theme)};
	}
	.role-title-meta {
		margin: 6px 0 0;
		color: ${({ theme }) => mutedCol(theme)};
		font-size: 14px;
	}
	.save-cluster {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.diff {
		font-size: 13px;
		font-weight: 600;
		color: ${({ theme }) => mutedCol(theme)};
		display: inline-flex;
		gap: 10px;
	}
	.diff .plus {
		color: ${({ theme }) => accent(theme)};
	}
	.diff .minus {
		color: ${({ theme }) => (isDark(theme) ? '#ef8b8b' : '#c94b4b')};
	}
	@media (max-width: 720px) {
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
		.save-cluster {
			justify-content: flex-end;
		}
	}
`

export const LockedBanner = styled('div')`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 18px;
	margin-bottom: 20px;
	background: ${({ theme }) => accentSoft(theme)};
	color: ${({ theme }) => textCol(theme)};
	border-radius: 14px;
	font-size: 14px;

	strong {
		color: ${({ theme }) => accent(theme)};
	}
	svg {
		color: ${({ theme }) => accent(theme)};
		flex-shrink: 0;
	}
`

export const Toolbar = styled('div')`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 14px;
	flex-wrap: wrap;

	.left {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.hint {
		font-size: 13px;
		color: ${({ theme }) => mutedCol(theme)};
	}
`

/* Matrix */
export const MatrixWrap = styled('div')`
	background: ${({ theme }) => cardBg(theme)};
	border: 1px solid ${({ theme }) => lineCol(theme)};
	border-radius: 18px;
	overflow: hidden;
`

export const Matrix = styled('div')`
	display: grid;
	grid-template-columns: minmax(190px, 1.4fr) repeat(4, minmax(82px, 1fr)) 96px;
	font-size: 14px;

	@media (max-width: 720px) {
		grid-template-columns: minmax(130px, 1.2fr) repeat(4, minmax(54px, 1fr)) 72px;
		font-size: 12.5px;
	}
`

export const MatrixHead = styled('div')<{ interactive?: boolean }>`
	padding: 14px 16px;
	background: ${({ theme }) => subtleBg(theme)};
	border-bottom: 1px solid ${({ theme }) => lineCol(theme)};
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: ${({ theme }) => mutedCol(theme)};
	user-select: none;
	text-align: center;
	transition:
		color 160ms ${EASE},
		background 160ms ${EASE};

	&.first {
		text-align: left;
	}
	${({ interactive, theme }) =>
		interactive &&
		css`
			cursor: pointer;
			&:hover {
				color: ${accent(theme)};
				background: ${accentSoft(theme)};
			}
		`}
`

export const MatrixRes = styled('div')<{ isLast?: boolean }>`
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 14px 16px;
	border-bottom: ${({ isLast, theme }) => (isLast ? 'none' : `1px solid ${lineCol(theme)}`)};
	cursor: pointer;
	transition: background 160ms ${EASE};
	user-select: none;

	&:hover {
		background: ${({ theme }) => subtleBg(theme)};
	}

	.r-name {
		font-size: 14px;
		font-weight: 600;
		color: ${({ theme }) => textCol(theme)};
	}
	.r-hint {
		font-size: 12.5px;
		color: ${({ theme }) => mutedCol(theme)};
		margin-top: 3px;
	}
`

export const MatrixCell = styled('div')<{ isLast?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 14px 8px;
	border-bottom: ${({ isLast, theme }) => (isLast ? 'none' : `1px solid ${lineCol(theme)}`)};
	cursor: pointer;
	transition: background 160ms ${EASE};

	&:hover {
		background: ${({ theme }) => subtleBg(theme)};
	}
	&:active .cb {
		transform: scale(0.92);
	}
`

export const MatrixCount = styled('div')<{ isLast?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 14px 8px;
	border-bottom: ${({ isLast, theme }) => (isLast ? 'none' : `1px solid ${lineCol(theme)}`)};
	font-size: 13px;
	color: ${({ theme }) => mutedCol(theme)};

	.n {
		color: ${({ theme }) => textCol(theme)};
		font-weight: 700;
	}
`

/* Checkbox */
export const Checkmark = styled('span')<{ on: boolean }>`
	width: 20px;
	height: 20px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	background: ${({ on, theme }) => (on ? accent(theme) : isDark(theme) ? '#1B2430' : '#ffffff')};
	border: 1.5px solid
		${({ on, theme }) =>
			on ? accent(theme) : isDark(theme) ? 'rgba(255, 255, 255, 0.14)' : '#d9d6e4'};
	transition:
		background 180ms ${EASE},
		border-color 180ms ${EASE},
		transform 120ms ${EASE};

	svg {
		width: 13px;
		height: 13px;
		color: #fff;
		opacity: ${({ on }) => (on ? 1 : 0)};
		transform: scale(${({ on }) => (on ? 1 : 0.6)});
		transition:
			opacity 160ms ${EASE},
			transform 160ms ${EASE};
	}
`

/* Toast */
const toastIn = keyframes`
	from { opacity: 0; transform: translate(-50%, 20px); }
	to { opacity: 1; transform: translate(-50%, 0); }
`
const toastOut = keyframes`
	from { opacity: 1; transform: translate(-50%, 0); }
	to { opacity: 0; transform: translate(-50%, 20px); }
`

export const ToastEl = styled('div')<{ leaving?: boolean }>`
	position: fixed;
	left: 50%;
	bottom: 32px;
	transform: translateX(-50%);
	background: ${({ theme }) => (isDark(theme) ? '#f6f4fb' : '#252d3a')};
	color: ${({ theme }) => (isDark(theme) ? '#252d3a' : '#f8f5ff')};
	padding: 12px 20px;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	box-shadow: 0 12px 40px rgba(20, 22, 27, 0.25);
	z-index: 2000;
	animation: ${({ leaving }) => (leaving ? toastOut : toastIn)} 220ms ${EASE} forwards;

	svg {
		width: 17px;
		height: 17px;
		color: ${({ theme }) => accent(theme)};
	}
`

/* Modal */
export const ModalCard = styled('div')`
	background: ${({ theme }) => cardBg(theme)};
	border-radius: 20px;
	width: min(460px, 92vw);
	padding: 28px;
	box-shadow: 0 24px 64px rgba(20, 22, 27, 0.25);
	animation: modalIn 220ms ${EASE};

	@keyframes modalIn {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	h3 {
		margin: 0;
		font-size: 20px;
		font-weight: 800;
		color: ${({ theme }) => textCol(theme)};
	}
	.m-desc {
		color: ${({ theme }) => mutedCol(theme)};
		font-size: 14px;
		margin-top: 6px;
	}
	label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: ${({ theme }) => mutedCol(theme)};
		margin: 22px 0 8px;
	}
	input,
	textarea {
		width: 100%;
		padding: 12px 14px;
		background: ${({ theme }) => subtleBg(theme)};
		border: 1px solid transparent;
		border-radius: 12px;
		color: ${({ theme }) => textCol(theme)};
		font-family: inherit;
		font-size: 14px;
		outline: 0;
		transition:
			border-color 160ms ${EASE},
			background 160ms ${EASE};
	}
	input:focus,
	textarea:focus {
		border-color: ${({ theme }) => accent(theme)};
		background: ${({ theme }) => cardBg(theme)};
	}
	textarea {
		resize: vertical;
		min-height: 72px;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 28px;
	}
`

/* View fade */
const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to { opacity: 1; transform: translateY(0); }
`

export const ViewFade = styled('div')`
	animation: ${fadeUp} 220ms ${EASE};
`
