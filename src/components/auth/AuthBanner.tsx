import React, { FC, ReactNode } from 'react'
import Box from '../box/Box'
import { Text } from '../../ui'
import { BLUE_COLOR } from '../../theme/colors'

declare global {
	namespace JSX {
		interface IntrinsicElements {
			'model-viewer': React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					src?: string
					alt?: string
					'camera-controls'?: boolean
					'auto-rotate'?: boolean
					'shadow-intensity'?: string
				},
				HTMLElement
			>
		}
	}
}

const AuthBanner: FC<Props> = () => {
	return (
		<Box
			display={'flex'}
			flexDirection={'column'}
			justify={'center'}
			align={'center'}
			height={'100%'}
			style={{
				background:
					'radial-gradient(circle at 35% 40%, rgb(33 150 243 / 0%) 0%, rgb(238 238 238) 35%, rgb(234, 242, 255) 65%, rgb(154 164 183) 100%)',
			}}
		>
			<Box display='flex' flexDirection='column' space={0.6} my={32}>
				<Box display={'flex'}>
					<Text heading='h3' weight='extraBold' color={'black'}>
						Your Sales Pipeline
					</Text>
				</Box>
				<Text
					heading='h5'
					weight='bold'
					paragraph
					secondary
					color={BLUE_COLOR}
					align={'center'}
					styles={{ border: '1px solid', padding: '6px', borderRadius: '8px' }}
				>
					CLEAN, FOCUSE, UNDER CONTROL
				</Text>
			</Box>

			<model-viewer
				src='/snowflake.glb'
				alt='Snowflake'
				camera-controls
				auto-rotate
				shadow-intensity='1'
				style={{ display: 'block', width: '100%', height: '400px' }}
			/>

			<h5 style={{ fontWeight: 400 }}></h5>
		</Box>
	)
}
export default AuthBanner
interface Props {
	children?: ReactNode
	bgDark: string
	bgLight: string
}
