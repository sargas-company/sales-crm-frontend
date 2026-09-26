import { FC } from 'react'
import styled, { keyframes } from 'styled-components'
import { Icon } from '@iconify/react'
import Logo from '../logo/Logo'

/**
 * Global route-loading overlay. Fixed to the viewport so the
 * layout underneath does not shift when the loader mounts or
 * unmounts. The logo `<img>` gets both explicit `width` and
 * `height`, matching the source PNG's aspect ratio (1939 × 3001
 * → 49 × 76 at h=76), so it does not re-flow when the image
 * finishes loading.
 */
const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`

const Overlay = styled.div`
	position: fixed;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${({ theme }) => theme.colors!.bg.canvas};
	z-index: ${({ theme }) => theme.zIndex!.overlay};
	animation: ${fadeIn} 220ms ease-out;
`

const Stack = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.md}px;
`

/*
 * Reserves the exact logo-image box so `<img>` load never
 * changes the frame. 49 × 76 matches the source PNG's 1939 × 3001
 * aspect ratio.
 */
const LogoFrame = styled.div`
	width: 49px;
	height: 76px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const Dots = styled.span`
	display: inline-flex;
	font-size: 48px;
	line-height: 1;
	color: ${({ theme }) => theme.colors!.accent.primary};
`

const PageLoading: FC = () => {
	return (
		<Overlay role='status' aria-live='polite' aria-label='Loading'>
			<Stack>
				<LogoFrame>
					<Logo height='76px' width='49px' />
				</LogoFrame>
				<Dots>
					<Icon icon='eos-icons:three-dots-loading' />
				</Dots>
			</Stack>
		</Overlay>
	)
}

export default PageLoading
