import { FC, ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import { Icon } from '@iconify/react'

/**
 * In-flow loading state. Sits inside whatever parent renders it
 * (e.g. a page body, a table shell, a section card). For a
 * boot / auth full-viewport overlay, use
 * `components/loading/PageLoading` instead.
 */
interface LoadingProps {
	label?: ReactNode
	className?: string
}

const spin = keyframes`
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
`

const Root = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	padding: ${({ theme }) => theme.spacing!.xl}px;
`

const Spinner = styled.span`
	display: inline-flex;
	font-size: 32px;
	line-height: 1;
	color: ${({ theme }) => theme.colors!.accent.primary};
	animation: ${spin} 1000ms linear infinite;
`

const Label = styled.span`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.bodySm.fontFamily};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
	line-height: ${({ theme }) => theme.typography!.bodySm.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.bodySm.fontWeight};
`

const Loading: FC<LoadingProps> = ({ label = 'Loading…', className }) => (
	<Root role='status' aria-live='polite' className={className}>
		<Spinner>
			<Icon icon='line-md:loading-twotone-loop' />
		</Spinner>
		{label && <Label>{label}</Label>}
	</Root>
)

export default Loading
