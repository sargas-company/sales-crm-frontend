import { ErrorOutline } from '@mui/icons-material'
import useModal from '../../hooks/useModal'
import { Button, Text } from '../../ui'
import Box from '../box/Box'
import Modal from '../modal/Modal'
import ModalSurface from '../_shared/ModalSurface'
import ConfirmationAbortModal from './components/ConfirmationAbortModal'
import ConfirmationSuccessModal from './components/ConfirmationSuccessModal'

const CancelPlanModal = () => {
	const { show, toggleModal, hideModal } = useModal()
	return (
		<>
			<Button varient='outlined' color='error' onClick={toggleModal}>
				cancel subscription
			</Button>
			{show ? (
				<Modal handleOutClick={toggleModal}>
					<ModalSurface maxWidth={480} padding={32}>
						<Box
							display='flex'
							flexDirection='column'
							align='center'
							justify='center'
							space={2}
						>
							<div
								style={{
									width: 64,
									height: 64,
									borderRadius: '50%',
									background: 'rgba(239, 68, 68, 0.12)',
									color: '#ef4444',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 32,
								}}
							>
								<ErrorOutline fontSize='inherit' />
							</div>
							<Text align='center' weight='medium' size={17}>
								Are you sure you would like to cancel your subscription?
							</Text>
							<Text align='center' secondary varient='body2'>
								You will lose access to premium features at the end of the billing
								period. This action can be reverted before then.
							</Text>
							<Box display='flex' justify='center' space={1} style={{ marginTop: 8 }}>
								<ConfirmationAbortModal onConfirmDone={hideModal} />
								<ConfirmationSuccessModal onConfirmDone={hideModal} />
							</Box>
						</Box>
					</ModalSurface>
				</Modal>
			) : (
				''
			)}
		</>
	)
}
export default CancelPlanModal
