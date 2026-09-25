import { CancelOutlined } from '@mui/icons-material'
import useModal from '../../../hooks/useModal'
import { Button } from '../../../ui'
import Modal from '../../modal/Modal'
import ModalSurface from '../../_shared/ModalSurface'
import Confirmation from './Confirmation'

const ConfirmationAbortModal = ({ onConfirmDone }: { onConfirmDone: () => void }) => {
	const { show, toggleModal } = useModal()
	const handleDone = () => {
		toggleModal()
		onConfirmDone && onConfirmDone()
	}
	return (
		<>
			<Button varient='outlined' color='info' onClick={toggleModal}>
				Cancel
			</Button>
			{show ? (
				<Modal handleOutClick={toggleModal}>
					<ModalSurface maxWidth={460} padding={32}>
						<Confirmation
							title='Cancelled'
							subtitle='Unsubscription cancelled — your plan stays active.'
							icon={<CancelOutlined />}
							iconColor='error'
							onConfirmDone={handleDone}
						/>
					</ModalSurface>
				</Modal>
			) : (
				''
			)}
		</>
	)
}
export default ConfirmationAbortModal
