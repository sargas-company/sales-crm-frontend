import { ArrowDropDown } from '@mui/icons-material'
import {
	Children,
	createContext,
	CSSProperties,
	FC,
	MouseEvent,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { createPortal } from 'react-dom'
import Box from '../../../components/box/Box'
import useTheme from '../../../theme/useTheme'
import { InputVarient } from '../type'
import StyledSelectWrapper, { StyledSelectButton } from './styled'

interface DefaultProps {
	handleOnChange: (value: string, name: string, icon?: string) => void
	currentSelection: string
}
interface SelectProp {
	label?: string
	placeholder?: string
	defaultValue?: string
	value?: string
	classes?: string
	selectId?: string
	id?: string
	children: ReactNode
	onChange?: (value: string, name?: string) => void
	varient?: InputVarient
	labelWidth?: string
	width?: string
	containerWidth?: string
	sizes?: 'small' | 'normal'
}
const SelectCtx = createContext<
	(DefaultProps & { close: () => void }) | undefined
>(undefined)

const Select: FC<SelectProp> = (props) => {
	const {
		theme: { mode, primaryColor },
	} = useTheme()
	const {
		label,
		placeholder,
		defaultValue: _defaultValue,
		value: _value,
		classes,
		selectId,
		id,
		children,
		onChange,
		varient,
		labelWidth,
		sizes,
		width,
		containerWidth,
	} = props
	// Accept either `value` (controlled) or `defaultValue` (uncontrolled)
	// so both call-site idioms work.
	const defaultValue = _value ?? _defaultValue ?? ''
	// `id` is a convenience alias; both `selectId` and `id` land on the
	// outer wrapper.
	const effectiveSelectId = selectId ?? id ?? ''
	const [selectOpen, setSelectOpen] = useState(false)
	const wrapperRef = useRef<HTMLDivElement>(null)
	const listRef = useRef<HTMLUListElement>(null)
	const [portalPos, setPortalPos] = useState<CSSProperties>({})

	const derivedSelection = useMemo(() => {
		if (!defaultValue) return { label: '', value: '', icon: '' }
		let match = { label: '', value: '', icon: '' }
		Children.forEach(
			children as any,
			(ele: {
				props?: {
					label?: string
					value?: string
					icon?: string
					children?: unknown
				}
			}) => {
				const p = ele?.props
				if (!p || p.value === undefined) return
				if (p.value.toLowerCase() === defaultValue.toLowerCase()) {
					match = {
						label:
							p.label ??
							(typeof p.children === 'string' ? p.children : ''),
						value: p.value,
						icon: p.icon ?? '',
					}
				}
			}
		)
		return match
	}, [defaultValue, children])

	const [pendingSelection, setPendingSelection] = useState<
		{ label: string; value: string; icon: string } | null
	>(null)
	const selectedItem = pendingSelection ?? derivedSelection

	useEffect(() => {
		setPendingSelection(null)
	}, [defaultValue])

	const handleClose = useCallback(() => {
		setSelectOpen(false)
	}, [])

	const updatePortalPos = useCallback(() => {
		if (!wrapperRef.current) return
		const r = wrapperRef.current.getBoundingClientRect()
		setPortalPos({
			position: 'fixed',
			top: r.bottom + 4,
			left: r.left,
			width: r.width,
			zIndex: 9500,
		})
	}, [])

	useLayoutEffect(() => {
		if (!selectOpen) return
		updatePortalPos()
		const onWinChange = () => updatePortalPos()
		window.addEventListener('scroll', onWinChange, true)
		window.addEventListener('resize', onWinChange)
		return () => {
			window.removeEventListener('scroll', onWinChange, true)
			window.removeEventListener('resize', onWinChange)
		}
	}, [selectOpen, updatePortalPos])

	useEffect(() => {
		if (!selectOpen) return
		const onDocPointerDown = (evt: Event) => {
			const target = evt.target as Node | null
			if (!target) return
			if (wrapperRef.current && wrapperRef.current.contains(target)) return
			if (listRef.current && listRef.current.contains(target)) return
			handleClose()
		}
		const onEsc = (evt: KeyboardEvent) => {
			if (evt.key === 'Escape') handleClose()
		}
		document.addEventListener('mousedown', onDocPointerDown, true)
		document.addEventListener('touchstart', onDocPointerDown, true)
		document.addEventListener('keydown', onEsc)
		return () => {
			document.removeEventListener('mousedown', onDocPointerDown, true)
			document.removeEventListener('touchstart', onDocPointerDown, true)
			document.removeEventListener('keydown', onEsc)
		}
	}, [selectOpen, handleClose])

	const handleToggle = (eve: MouseEvent) => {
		eve.preventDefault()
		eve.stopPropagation()
		setSelectOpen((prev) => !prev)
	}

	const handleOnChange = (value: string, itemLabel: string, icon?: string) => {
		setPendingSelection({ value, label: itemLabel, icon: icon ?? '' })
		setSelectOpen(false)
		onChange && onChange(value, itemLabel)
	}

	const itemListShow = selectOpen ? 'show-select-item' : ''
	return (
		<div ref={wrapperRef} style={{ position: 'relative', width: containerWidth ?? 'auto' }}>
			<StyledSelectWrapper
				theme={{ mode, primaryColor }}
				varient={varient}
				className={classes ? classes : ''}
				id={effectiveSelectId}
				width={width}
				sizes={sizes}
				containerWidth={containerWidth}
			>
				<Box
					display='flex'
					flexDirection='column'
					onClick={handleToggle}
				>
					<StyledSelectButton
						theme={{ mode, primaryColor }}
						as='div'
						className={`select-button input-button`}
						varient={varient}
						role='select'
						width={labelWidth}
						sizes={sizes}
					>
						<span
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								color:
									!selectedItem.label && !defaultValue && placeholder
										? '#94a3b8'
										: undefined,
							}}
						>
							{selectedItem.label ||
								defaultValue ||
								placeholder ||
								''}
							{selectedItem.icon && (
								<img
									src={selectedItem.icon}
									alt=''
									style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 2 }}
								/>
							)}
						</span>
					</StyledSelectButton>
					<span
						className={`input-label floating-label select-label ${
							selectOpen || defaultValue || selectedItem.value ? 'floating-label-top' : ''
						}`}
					>
						{label}
					</span>
					<ArrowDropDown
						className={`select-status-arrow ${selectOpen ? 'rotateUp' : 'rotateDown'}`}
					/>
					{(varient === 'standard' || varient === 'filled') && (
						<span
							className={`input-border ${selectOpen ? 'active-border-transition' : ''}`}
						></span>
					)}
				</Box>
			</StyledSelectWrapper>
			{selectOpen &&
				createPortal(
					<SelectCtx.Provider
						value={{
							handleOnChange,
							currentSelection: selectedItem.value,
							close: handleClose,
						}}
					>
						<ul
							ref={listRef}
							className={`select-list-container select-portal ${itemListShow}`}
							style={{
								...portalPos,
								background: mode.name === 'dark' ? mode.foreground : '#ffffff',
								minWidth: portalPos.width,
								borderRadius: 8,
								boxShadow:
									mode.name === 'dark'
										? '0 8px 24px rgba(0, 0, 0, 0.5)'
										: '0 8px 24px rgba(15, 23, 42, 0.14)',
								padding: '4px 0',
								overflow: 'hidden',
								maxHeight: 300,
								overflowY: 'auto',
							}}
						>
							{children}
						</ul>
					</SelectCtx.Provider>,
					document.body
				)}
		</div>
	)
}
export default Select

export const SelectItem: FC<SelectItemProps> = ({
	label,
	value,
	icon,
	textAlign,
	children,
}) => {
	const han = useContext(SelectCtx)
	const displayText =
		label ?? (typeof children === 'string' ? children : '')
	const onClick = (evt: MouseEvent) => {
		evt.preventDefault()
		evt.stopPropagation()
		han?.handleOnChange(value, displayText, icon)
	}
	return (
		<li
			onClick={onClick}
			role='option'
			value={value}
			aria-label={label}
			className={`select-option-item ${han?.currentSelection === value ? 'selected-item' : ''}`}
			style={{
				padding: '10px 14px',
				cursor: 'pointer',
				textTransform: 'capitalize',
				background:
					han?.currentSelection === value ? 'rgba(3, 105, 161, 0.12)' : 'transparent',
				color: han?.currentSelection === value ? '#0369a1' : 'inherit',
				fontWeight: han?.currentSelection === value ? 600 : 500,
				...(textAlign ? { textAlign } : {}),
			}}
			onMouseEnter={(e) => {
				if (han?.currentSelection !== value) {
					e.currentTarget.style.background = 'rgba(3, 105, 161, 0.06)'
				}
			}}
			onMouseLeave={(e) => {
				if (han?.currentSelection !== value) {
					e.currentTarget.style.background = 'transparent'
				}
			}}
		>
			<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				{label ?? children}
				{icon && (
					<img
						src={icon}
						alt=''
						style={{
							width: 20,
							height: 20,
							objectFit: 'contain',
							borderRadius: 2,
							flexShrink: 0,
						}}
					/>
				)}
			</span>
		</li>
	)
}

interface SelectItemProps {
	label?: string
	value: string
	icon?: string
	textAlign?: 'center' | 'left' | 'right'
	children?: ReactNode
}
