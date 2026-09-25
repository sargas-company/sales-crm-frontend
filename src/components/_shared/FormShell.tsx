import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import useTheme from '../../theme/useTheme'
import {
	BackChip,
	Dot,
	FieldError,
	FieldHint,
	FieldInput,
	FieldLabel,
	FieldLabelRow,
	FieldRoot,
	FieldSpan,
	HeaderBlock,
	HeaderRow,
	IconTile,
	LoadingBlock,
	ModeBadge,
	ModeTone,
	ReqStar,
	SectionHeadWrap,
	SectionHint,
	SectionNum,
	SectionText,
	SectionTitle,
	Shell,
	SubTitle,
	Surface,
	Title,
	TitleCol,
} from './formShell.styled'

/* ── Header ─────────────────────────────────────────────────────────────── */

interface FormHeaderProps {
	backTo: string
	backLabel: string
	icon: ReactNode
	title: string
	subtitle: string
	badgeLabel: string
	badgeTone: ModeTone
}

export const FormHeader = ({
	backTo,
	backLabel,
	icon,
	title,
	subtitle,
	badgeLabel,
	badgeTone,
}: FormHeaderProps) => {
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const primary = theme.primaryColor.color
	return (
		<HeaderBlock $dark={isDark}>
			<BackChip $dark={isDark} onClick={() => navigate(backTo)} type='button'>
				<svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
					<path
						d='M15 6l-6 6 6 6'
						stroke='currentColor'
						strokeWidth='2.2'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
				</svg>
				<span>{backLabel}</span>
			</BackChip>
			<HeaderRow>
				<IconTile $dark={isDark} $primary={primary}>
					{icon}
				</IconTile>
				<TitleCol>
					<Title>{title}</Title>
					<SubTitle $dark={isDark}>{subtitle}</SubTitle>
				</TitleCol>
				<ModeBadge $dark={isDark} $tone={badgeTone}>
					<Dot $tone={badgeTone} />
					{badgeLabel}
				</ModeBadge>
			</HeaderRow>
		</HeaderBlock>
	)
}

/* ── Section head ──────────────────────────────────────────────────────── */

interface SectionHeadProps {
	num: string
	title: string
	hint: string
}

export const SectionHead = ({ num, title, hint }: SectionHeadProps) => {
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const primary = theme.primaryColor.color
	return (
		<SectionHeadWrap>
			<SectionNum $dark={isDark} $primary={primary}>
				{num}
			</SectionNum>
			<SectionText>
				<SectionTitle>{title}</SectionTitle>
				<SectionHint $dark={isDark}>{hint}</SectionHint>
			</SectionText>
		</SectionHeadWrap>
	)
}

/* ── Field ─────────────────────────────────────────────────────────────── */

interface FieldProps {
	label: string
	required?: boolean
	hint?: string
	error?: string
	span?: FieldSpan
	children: ReactNode
}

export const Field = ({
	label,
	required,
	hint,
	error,
	span = 'auto',
	children,
}: FieldProps) => (
	<FieldRoot $span={span}>
		<FieldLabelRow>
			<FieldLabel>
				{label}
				{required && <ReqStar>*</ReqStar>}
			</FieldLabel>
			{hint && <FieldHint>{hint}</FieldHint>}
		</FieldLabelRow>
		<FieldInput>{children}</FieldInput>
		{error && <FieldError>{error}</FieldError>}
	</FieldRoot>
)

/* ── Loading / not-found shells ─────────────────────────────────────────── */

interface CenteredShellProps {
	children: ReactNode
	maxWidth?: number
}

export const CenteredShell = ({ children, maxWidth }: CenteredShellProps) => {
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark} $maxWidth={maxWidth}>
				{children}
			</Surface>
		</Shell>
	)
}

interface FormLoadingProps {
	label?: string
}

export const FormLoading = ({ label = 'Loading…' }: FormLoadingProps) => {
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	return (
		<CenteredShell>
			<LoadingBlock $dark={isDark}>
				<span className='spinner' />
				<span>{label}</span>
			</LoadingBlock>
		</CenteredShell>
	)
}

interface FormNotFoundProps {
	label: string
}

export const FormNotFound = ({ label }: FormNotFoundProps) => {
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	return (
		<CenteredShell>
			<LoadingBlock $dark={isDark}>
				<span>{label}</span>
			</LoadingBlock>
		</CenteredShell>
	)
}
