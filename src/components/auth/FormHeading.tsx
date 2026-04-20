import Box from '../box/Box'
import { Text } from '../../ui'
import { FC, ReactNode } from 'react'
import { BLUE_COLOR } from '../../theme/colors'

const FormHeading: FC<Props> = ({ title, subtitle }) => {
	return (
		<Box display='flex' flexDirection='column' space={0.6} my={32}>
			{typeof title === 'string' ? (
				<Box display={'flex'}>
					<Text heading='h5' weight='extraBold'>
						{title}
					</Text>
					<Text heading='h5' weight='extraBold' styles={{ marginLeft: 5 }} color={BLUE_COLOR}>
						Sargas
					</Text>
				</Box>
			) : (
				title
			)}
			{typeof subtitle === 'string' ? (
				<Text varient='body2' weight='medium' paragraph secondary>
					{subtitle}
				</Text>
			) : (
				subtitle
			)}
		</Box>
	)
}
export default FormHeading
interface Props {
	title: string | ReactNode
	subtitle: string | ReactNode
}
