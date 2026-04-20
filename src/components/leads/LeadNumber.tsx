import Box from '../box/Box'
import { Text, TextField } from '../../ui'

const LeadNumber = ({ value }: { value?: number }) => {
	return (
		<Box display='flex' align='center' justify='flex-start' px={20}>
			<Text heading='h6' styles={{ minWidth: 120 }}>
				Lead
			</Text>
			<TextField
				type='number'
				name='lead-no'
				sizes='small'
				startAdornment={<Text weight='medium'>#</Text>}
				defaultValue={value}
				maxWidth='250px'
				disable
			/>
		</Box>
	)
}
export default LeadNumber
