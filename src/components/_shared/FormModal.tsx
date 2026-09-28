import { FormEvent, ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import { CloseOutlined } from '@mui/icons-material'
import Modal from '../modal/Modal'
import { Button } from '../../ui'
import useTheme from '../../theme/useTheme'
import { PrimarySolidButton, type ModeTone } from './formShell.styled'

interface Props {
	title: string
	subtitle?: string
	badgeLabel?: string
	badgeTone?: ModeTone
	onClose: () => void
	onSubmit?: (e: FormEvent) => void
	submitLabel: string
	submitLoadingLabel?: string
	cancelLabel?: string
	isLoading?: boolean
	isSubmitDisabled?: boolean
	maxWidth?: number
	children: ReactNode
	footerHint?: ReactNode
}

const FormModal = ({
	title,
	subtitle,
	badgeLabel,
	badgeTone = 'draft',
	onClose,
	onSubmit,
	submitLabel,
	submitLoadingLabel,
	cancelLabel = 'Cancel',
	isLoading,
	isSubmitDisabled,
	maxWidth = 640,
	children,
	footerHint,
}: Props) => {
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const primary = theme.primaryColor.color

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		onSubmit?.(e)
	}

	return (
		<Modal handleOutClick={onClose}>
			<Surface $dark={isDark} $maxWidth={maxWidth}>
				<Header $dark={isDark}>
					<HeaderText>
						<TitleRow>
							<TitleText>{title}</TitleText>
							{badgeLabel && (
								<Badge $dark={isDark} $tone={badgeTone} $primary={primary}>
									{badgeLabel}
								</Badge>
							)}
						</TitleRow>
						{subtitle && <SubtitleText $dark={isDark}>{subtitle}</SubtitleText>}
					</HeaderText>
					<CloseBtn $dark={isDark} type='button' onClick={onClose} aria-label='Close'>
						<CloseOutlined style={{ fontSize: 18 }} />
					</CloseBtn>
				</Header>

				<form onSubmit={handleSubmit} noValidate>
					<Body>{children}</Body>

					<Footer $dark={isDark}>
						{footerHint ? <FooterHint $dark={isDark}>{footerHint}</FooterHint> : <span />}
						<Actions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={onClose}
								disabled={isLoading}
							>
								{cancelLabel}
							</Button>
							<PrimarySolidButton type='submit' disabled={isLoading || isSubmitDisabled}>
								{isLoading ? (submitLoadingLabel ?? 'Saving…') : submitLabel}
							</PrimarySolidButton>
						</Actions>
					</Footer>
				</form>
			</Surface>
		</Modal>
	)
}

export default FormModal

/* ── Styles ─────────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(6px) scale(0.985); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const Surface = styled.div<{ $dark: boolean; $maxWidth: number }>`
	max-width: ${({ $maxWidth }) => $maxWidth}px;
	width: 100%;
	margin: 1rem;
	background: ${({ $dark }) => ($dark ? '#252d3a' : '#ffffff')};
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#eceaf3')};
	border-radius: 18px;
	box-shadow: ${({ $dark }) =>
		$dark
			? '0 40px 80px -30px rgba(0, 0, 0, 0.7), 0 4px 10px rgba(0, 0, 0, 0.2)'
			: '0 40px 80px -30px rgba(63, 51, 111, 0.30), 0 4px 10px rgba(63, 51, 111, 0.08)'};
	overflow: hidden;
	animation: ${fadeIn} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
	display: flex;
	flex-direction: column;
	max-height: calc(100vh - 2rem);
`

const Header = styled.header<{ $dark: boolean }>`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	padding: 20px 24px 16px;
	border-bottom: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#f0eef7')};
`

const HeaderText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

const TitleText = styled.h3`
	margin: 0;
	font-family: 'Inter', sans-serif;
	font-size: 18px;
	font-weight: 700;
	letter-spacing: -0.01em;
	color: inherit;
`

const SubtitleText = styled.p<{ $dark: boolean }>`
	margin: 0;
	font-size: 12.5px;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#7a7591')};
`

const Badge = styled.span<{ $dark: boolean; $tone: ModeTone; $primary: string }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	background: ${({ $tone, $dark, $primary }) => {
		if ($tone === 'edit') return $dark ? 'rgba(59, 130, 246, 0.15)' : '#e0edff'
		if ($tone === 'draft') return $dark ? 'rgba(245, 158, 11, 0.15)' : '#fff4e0'
		if ($tone === 'danger') return $dark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2'
		if ($tone === 'new') return $dark ? 'rgba(34, 197, 94, 0.15)' : '#e5f8ec'
		return $dark ? `${$primary}22` : `${$primary}18`
	}};
	color: ${({ $tone, $dark }) => {
		if ($tone === 'edit') return $dark ? '#93c5fd' : '#1d4ed8'
		if ($tone === 'draft') return $dark ? '#fcd34d' : '#a26608'
		if ($tone === 'danger') return $dark ? '#fca5a5' : '#b91c1c'
		return $dark ? '#86efac' : '#15803d'
	}};
`

const CloseBtn = styled.button<{ $dark: boolean }>`
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: transparent;
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#eceaf3')};
	color: ${({ $dark }) => ($dark ? '#c7c9d3' : '#5a5476')};
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 160ms ease;

	&:hover {
		background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.05)' : '#f5f3fb')};
		color: ${({ $dark }) => ($dark ? '#e8e9ee' : '#3a3541')};
	}
`

const Body = styled.div`
	padding: 20px 24px 8px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 16px;
	flex: 1 1 auto;
	min-height: 0;
`

const Footer = styled.footer<{ $dark: boolean }>`
	padding: 14px 24px 18px;
	border-top: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#f0eef7')};
	background: ${({ $dark }) =>
		$dark ? 'rgba(255, 255, 255, 0.015)' : 'linear-gradient(to bottom, transparent, #faf9fd)'};
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;

	@media (max-width: 480px) {
		flex-direction: column-reverse;
		align-items: stretch;
	}
`

const FooterHint = styled.span<{ $dark: boolean }>`
	font-size: 12px;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#8a85a3')};
`

const Actions = styled.div`
	display: flex;
	gap: 10px;
	align-items: center;

	@media (max-width: 480px) {
		justify-content: flex-end;
	}
`
