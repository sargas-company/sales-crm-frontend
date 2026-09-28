import { useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	CheckRounded,
	AddRounded,
	LockOutlined,
	DoneAllRounded,
	RemoveDoneRounded,
} from '@mui/icons-material'
import type { Permission, Role } from '../../store/roles/types'
import { OWNER_SLUG, ROLE_ERROR_MESSAGES } from '../../store/roles/types'

interface Props {
	role: Role
	catalogue: Permission[]
	selected: Set<string>
	onToggle: (key: string) => void
	disabled?: boolean
	onToggleAll?: (keys: string[], nextValue: boolean) => void
}

const BLUE_STRONG = 'rgba(3, 105, 161, 1)'
const BLUE_RING = 'rgba(3, 105, 161, 0.32)'
const BLUE_TINT = '#f0f9ff'
const BLUE_TINT_STRONG = '#e0f2fe'
const BLUE_LIGHT = '#38bdf8'

const prettyModule = (module: string) =>
	module
		.split('_')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ')

const moduleInitials = (module: string) => {
	const parts = module.split('_').filter(Boolean)
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
	return (parts[0][0] + parts[1][0]).toUpperCase()
}

const RolePermissionsMatrix = ({
	role,
	catalogue,
	selected,
	onToggle,
	disabled,
	onToggleAll,
}: Props) => {
	const ownerLocked = role.name === OWNER_SLUG
	const readOnly = disabled || ownerLocked
	const lockLabel = ROLE_ERROR_MESSAGES.OWNER_PERMISSIONS_LOCKED

	const grouped = useMemo(() => {
		const map = new Map<string, Permission[]>()
		for (const p of catalogue) {
			const list = map.get(p.module) ?? []
			list.push(p)
			map.set(p.module, list)
		}
		return Array.from(map.entries())
			.map(
				([module, perms]) =>
					[module, perms.sort((a, b) => a.action.localeCompare(b.action))] as const
			)
			.sort((a, b) => a[0].localeCompare(b[0]))
	}, [catalogue])

	const handleModuleToggle = (perms: Permission[], allSelected: boolean) => {
		if (readOnly) return
		const keys = perms.map((p) => p.key)
		if (onToggleAll) {
			onToggleAll(keys, !allSelected)
		} else {
			for (const k of keys) {
				const isOn = selected.has(k)
				if (isOn === allSelected) onToggle(k)
			}
		}
	}

	const totalPerms = catalogue.length
	const totalSelected = catalogue.reduce((acc, p) => acc + (selected.has(p.key) ? 1 : 0), 0)
	const allSelectedGlobal = totalPerms > 0 && totalSelected === totalPerms

	const handleGlobalToggle = () => {
		if (readOnly) return
		const keys = catalogue.map((p) => p.key)
		if (onToggleAll) {
			onToggleAll(keys, !allSelectedGlobal)
		} else {
			for (const k of keys) {
				const isOn = selected.has(k)
				if (isOn === allSelectedGlobal) onToggle(k)
			}
		}
	}

	return (
		<Wrapper>
			{ownerLocked && (
				<LockRibbon>
					<LockOutlined />
					<span>{lockLabel}</span>
				</LockRibbon>
			)}

			{!ownerLocked && !readOnly && (
				<Toolbar>
					<Summary>
						<SummaryCount key={totalSelected} $active={totalSelected > 0}>
							{totalSelected}
							<span>/ {totalPerms}</span>
						</SummaryCount>
						<SummaryLabel>permissions granted across all modules</SummaryLabel>
					</Summary>
					<ToolbarActions>
						<GlobalToggle
							type='button'
							onClick={handleGlobalToggle}
							disabled={readOnly}
							$primary
							aria-pressed={allSelectedGlobal}
						>
							{allSelectedGlobal ? <RemoveDoneRounded /> : <DoneAllRounded />}
							{allSelectedGlobal ? 'Clear all' : 'Select all'}
						</GlobalToggle>
					</ToolbarActions>
				</Toolbar>
			)}

			{!ownerLocked && readOnly && (
				<ViewSummary>
					<SummaryCount $active={totalSelected > 0}>
						{totalSelected}
						<span>/ {totalPerms}</span>
					</SummaryCount>
					<SummaryLabel>permissions granted across all modules</SummaryLabel>
				</ViewSummary>
			)}

			<Grid>
				{grouped.map(([module, perms], idx) => {
					const selectedCount = perms.reduce(
						(acc, p) => acc + (selected.has(p.key) ? 1 : 0),
						0
					)
					const allSelected = selectedCount === perms.length
					const noneSelected = selectedCount === 0

					return (
						<ModuleCard key={module} $active={selectedCount > 0} $delay={idx * 30}>
							<ModuleHead>
								<IconBadge $active={selectedCount > 0} aria-hidden='true'>
									{moduleInitials(module)}
								</IconBadge>
								<ModuleTitleGroup>
									<ModuleName>{prettyModule(module)}</ModuleName>
									<ModuleMeta $active={selectedCount > 0}>
										{selectedCount}/{perms.length} granted
									</ModuleMeta>
								</ModuleTitleGroup>
								{!readOnly && (
									<ModuleToggle
										type='button'
										onClick={() => handleModuleToggle([...perms], allSelected)}
										disabled={readOnly}
										$active={allSelected}
									>
										{allSelected ? 'Clear' : 'All'}
									</ModuleToggle>
								)}
							</ModuleHead>

							<ProgressTrack>
								<ProgressFill
									style={{
										width: `${(selectedCount / perms.length) * 100}%`,
									}}
								/>
							</ProgressTrack>

							<ChipRow>
								{perms.map((p) => {
									const isOn = selected.has(p.key)
									return (
										<PermChip
											key={p.id}
											type='button'
											$active={isOn}
											onClick={() => !readOnly && onToggle(p.key)}
											disabled={readOnly}
											title={ownerLocked ? lockLabel : (p.label ?? p.key)}
											aria-pressed={isOn}
											aria-label={p.key}
										>
											<ChipIcon>
												{isOn ? (
													<CheckRounded fontSize='inherit' />
												) : (
													<AddRounded fontSize='inherit' />
												)}
											</ChipIcon>
											<ChipLabel>{p.action}</ChipLabel>
										</PermChip>
									)
								})}
							</ChipRow>

							<EmptyModuleHint
								aria-hidden={!(!ownerLocked && noneSelected)}
								$visible={!ownerLocked && noneSelected}
							>
								Nothing granted yet
							</EmptyModuleHint>
						</ModuleCard>
					)
				})}
			</Grid>
		</Wrapper>
	)
}

export default RolePermissionsMatrix

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to   { opacity: 1; transform: translateY(0); }
`

const shimmer = keyframes`
	0%   { transform: translateX(-100%); }
	100% { transform: translateX(200%); }
`

const numberPop = keyframes`
	0%   { transform: scale(1); }
	40%  { transform: scale(1.15); }
	100% { transform: scale(1); }
`

const gradientShift = keyframes`
	0%   { background-position: 0% 50%; }
	50%  { background-position: 100% 50%; }
	100% { background-position: 0% 50%; }
`

const softPulse = keyframes`
	0%, 100% { box-shadow: 0 2px 6px rgba(3, 105, 161, 0.22); }
	50%      { box-shadow: 0 6px 16px rgba(3, 105, 161, 0.35); }
`

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const Toolbar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 18px;
	background: linear-gradient(135deg, #f8fafc 0%, #f4f2f8 100%);
	border: 1px solid #eeecf3;
	border-radius: 14px;
	flex-wrap: wrap;
`

const Summary = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const ViewSummary = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 14px 18px;
	background: ${BLUE_TINT};
	border: 1px solid #dbeafe;
	border-radius: 14px;
`

const SummaryCount = styled.span<{ $active: boolean }>`
	position: relative;
	font-size: 18px;
	font-weight: 700;
	color: ${({ $active }) => ($active ? BLUE_STRONG : '#252d3a')};
	line-height: 1;
	font-variant-numeric: tabular-nums;
	transition: color 200ms ease;
	display: inline-flex;
	align-items: baseline;
	gap: 2px;
	animation: ${numberPop} 320ms cubic-bezier(0.34, 1.56, 0.64, 1);

	span {
		color: #a5a1b0;
		font-weight: 600;
		font-size: 14px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const SummaryLabel = styled.span`
	font-size: 11.5px;
	color: #7a7686;
	line-height: 1.3;
`

const ToolbarActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
`

const GlobalToggle = styled.button<{ $primary?: boolean }>`
	position: relative;
	overflow: hidden;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 7px;
	padding: 9px 18px;
	background: ${({ $primary }) =>
		$primary
			? `linear-gradient(135deg, ${BLUE_STRONG} 0%, #0284c7 55%, #38bdf8 130%)`
			: 'transparent'};
	background-size: 200% 200%;
	color: ${({ $primary }) => ($primary ? '#fff' : BLUE_STRONG)};
	border: 1px solid ${({ $primary }) => ($primary ? 'transparent' : BLUE_RING)};
	border-radius: 999px;
	font-family: inherit;
	font-size: 11.5px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	cursor: pointer;
	transition:
		background-position 500ms ease,
		border-color 160ms ease,
		transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
		box-shadow 200ms ease;
	box-shadow: ${({ $primary }) => ($primary ? '0 2px 6px rgba(3, 105, 161, 0.22)' : 'none')};

	svg {
		position: relative;
		z-index: 1;
		font-size: 16px;
		transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	/* Diagonal shine sweep on hover */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -35%;
		width: 35%;
		background: linear-gradient(
			110deg,
			transparent 0%,
			rgba(255, 255, 255, 0) 35%,
			rgba(255, 255, 255, 0.55) 50%,
			rgba(255, 255, 255, 0) 65%,
			transparent 100%
		);
		transform: skewX(-14deg);
		transition: left 750ms ease;
		pointer-events: none;
	}

	&:hover:not(:disabled) {
		transform: translateY(-2px);
		background-position: 100% 50%;
		animation: ${softPulse} 1600ms ease-in-out infinite;
	}
	&:hover:not(:disabled)::before {
		left: 135%;
	}
	&:hover:not(:disabled) svg {
		transform: rotate(-8deg) scale(1.12);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) {
			animation: none;
			transform: translateY(-1px);
		}
		&::before {
			display: none;
		}
	}
`

const LockRibbon = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 14px;
	border-radius: 12px;
	background: linear-gradient(135deg, rgba(217, 119, 6, 0.14), rgba(217, 119, 6, 0.06));
	border: 1px solid rgba(217, 119, 6, 0.25);
	color: #92400e;
	font-size: 12.5px;
	font-weight: 600;
	line-height: 1.3;

	svg {
		font-size: 18px;
	}
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 14px;

	@media (max-width: 1023px) {
		grid-template-columns: 1fr;
	}
`

const ModuleCard = styled.div<{
	$active: boolean
	$delay: number
}>`
	position: relative;
	background: #fff;
	border: 1px solid #eeecf3;
	border-radius: 14px;
	padding: 16px 16px 14px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	transition:
		border-color 200ms ease,
		transform 200ms ease;
	animation: ${fadeUp} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${({ $delay }) => $delay}ms;

	&:hover {
		transform: translateY(-1px);
		border-color: #d5d3dc;
	}
`

const ModuleHead = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const IconBadge = styled.span<{ $active: boolean }>`
	flex: 0 0 auto;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: ${({ $active }) => ($active ? BLUE_TINT_STRONG : '#f4f2f8')};
	color: ${({ $active }) => ($active ? BLUE_STRONG : '#7a7686')};
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.4px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	transition:
		background 200ms ease,
		color 200ms ease;
`

const ModuleTitleGroup = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const ModuleName = styled.span`
	font-size: 13.5px;
	font-weight: 600;
	color: #252d3a;
	line-height: 1.25;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const ModuleMeta = styled.span<{ $active: boolean }>`
	font-size: 11px;
	font-weight: 600;
	color: ${({ $active }) => ($active ? '#7a7686' : '#a5a1b0')};
	letter-spacing: 0.2px;
`

const ModuleToggle = styled.button<{ $active: boolean }>`
	flex: 0 0 auto;
	min-width: 62px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: 1px solid #eeecf3;
	border-radius: 999px;
	padding: 4px 12px;
	font-family: inherit;
	font-size: 10.5px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.6px;
	color: #7a7686;
	cursor: pointer;
	text-align: center;
	transition:
		color 140ms ease,
		background 140ms ease,
		border-color 140ms ease;

	&:hover:not(:disabled) {
		color: #252d3a;
		border-color: #cec9d8;
		background: #f6f4fb;
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`

const ProgressTrack = styled.div`
	position: relative;
	height: 4px;
	border-radius: 999px;
	background: #f0eef5;
	overflow: hidden;
`

const ProgressFill = styled.span`
	display: block;
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, ${BLUE_STRONG} 0%, ${BLUE_LIGHT} 100%);
	transition: width 260ms cubic-bezier(0.22, 1, 0.36, 1);
`

const ChipRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const PermChip = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px 4px 6px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 11.5px;
	font-weight: 600;
	line-height: 1.3;
	cursor: pointer;
	transition:
		background 160ms ease,
		color 160ms ease,
		border-color 160ms ease,
		box-shadow 160ms ease,
		transform 120ms ease;

	background: ${({ $active }) => ($active ? BLUE_TINT : '#f6f4fb')};
	color: ${({ $active }) => ($active ? BLUE_STRONG : '#8a85a3')};
	border: 1px solid ${({ $active }) => ($active ? BLUE_RING : 'transparent')};

	${({ $active }) =>
		$active &&
		`
		box-shadow: inset 0 0 0 1px ${BLUE_RING};
	`}

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		color: ${BLUE_STRONG};
		background: ${BLUE_TINT};
		border-color: ${BLUE_RING};
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:focus-visible {
		outline: none;
		box-shadow:
			inset 0 0 0 1px ${BLUE_RING},
			0 0 0 3px ${BLUE_TINT};
	}

	&:disabled {
		cursor: default;
		transform: none;
	}

	&:disabled:hover {
		transform: none;
	}
`

const ChipIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.55);
	font-size: 12px;

	${PermChip}:not([aria-pressed='true']) & {
		background: transparent;
	}
`

const ChipLabel = styled.span`
	line-height: 1;
`

const EmptyModuleHint = styled.div<{ $visible: boolean }>`
	font-size: 11px;
	color: #a5a1b0;
	font-style: italic;
	padding-top: 2px;
	min-height: 16px;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transition: opacity 200ms ease;
`
