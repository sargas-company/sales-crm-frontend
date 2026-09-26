import { FC, ReactNode } from 'react'
import styled from 'styled-components'

/**
 * Composition primitive for a labelled form control. Renders a
 * label above the control and — mutually exclusive — either an
 * error message or a help hint below. All type / spacing / color
 * decisions come from tokens.
 *
 * Example:
 *
 *     <FormField label='Email' htmlFor='email' error={errors.email}>
 *       <Input name='email' id='email' />
 *     </FormField>
 */
interface FormFieldProps {
	label?: ReactNode
	help?: ReactNode
	error?: ReactNode
	required?: boolean
	htmlFor?: string
	children: ReactNode
	className?: string
}

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
	min-width: 0;
`

const Label = styled.label`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.caption.fontFamily};
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
	line-height: ${({ theme }) => theme.typography!.caption.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.caption.fontWeight};
	letter-spacing: ${({ theme }) => theme.typography!.caption.letterSpacing};
`

const RequiredMark = styled.span`
	color: ${({ theme }) => theme.colors!.status.danger};
	margin-inline-start: 2px;
`

const HelpText = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.caption.fontFamily};
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
	line-height: ${({ theme }) => theme.typography!.caption.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.caption.fontWeight};
`

const ErrorText = styled(HelpText)`
	color: ${({ theme }) => theme.colors!.status.danger};
`

const FormField: FC<FormFieldProps> = ({
	label,
	help,
	error,
	required,
	htmlFor,
	children,
	className,
}) => {
	return (
		<Wrapper className={className}>
			{label && (
				<Label htmlFor={htmlFor}>
					{label}
					{required && <RequiredMark aria-hidden='true'>*</RequiredMark>}
				</Label>
			)}
			{children}
			{error ? (
				<ErrorText role='alert'>{error}</ErrorText>
			) : help ? (
				<HelpText>{help}</HelpText>
			) : null}
		</Wrapper>
	)
}

export default FormField
