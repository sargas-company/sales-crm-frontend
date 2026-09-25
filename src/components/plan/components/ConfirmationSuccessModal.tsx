import { CheckCircleOutline } from '@mui/icons-material'
import useModal from '../../../hooks/useModal'
import { Button } from '../../../ui'
import Modal from '../../modal/Modal'
import ModalSurface from '../../_shared/ModalSurface'
import Confirmation from './Confirmation'

const ConfirmationSuccessModal = ({ onConfirmDone }: { onConfirmDone: () => void }) => {
	const { show, toggleModal } = useModal()
	const handelDone = () => {
		toggleModal()
		onConfirmDone && onConfirmDone()
	}
	return (
		<>
			<Button color='error' onClick={toggleModal}>
				Yes, cancel
			</Button>
			{show ? (
				<Modal handleOutClick={toggleModal}>
					<ModalSurface maxWidth={460} padding={32}>
						<Confirmation
							title='Unsubscribed'
							subtitle='Your subscription was cancelled successfully.'
							icon={<CheckCircleOutline />}
							iconColor='success'
							onConfirmDone={handelDone}
						/>
					</ModalSurface>
				</Modal>
			) : (
				''
			)}
		</>
	)
}
export default ConfirmationSuccessModal
