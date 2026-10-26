import { useEffect, useRef, useState } from 'react'
import { CloudUploadOutlined } from '@mui/icons-material'

import ConfirmModal from '../../components/_shared/ConfirmModal'
import { enqueueUploads } from './uploadQueueStore'
import { UploadSuccessModal } from './UploadSuccessModal'

interface Props {
	folderId: string | null
	onClose: () => void
}

/* Upload modal — uses the shared ConfirmModal shell with the
 * `bodyBorder='dashed'` prop so the whole upper block (icon + title
 * + description) is framed as a dashed drop zone. Dragging anywhere
 * on the window while the modal is open accepts the files. */
type Phase = 'input' | 'exiting-input' | 'success'

export const UploadModal = ({ folderId, onClose }: Props) => {
	const [dragging, setDragging] = useState(false)
	const [phase, setPhase] = useState<Phase>('input')
	const pendingFilesRef = useRef<File[] | null>(null)
	const inputRef = useRef<HTMLInputElement | null>(null)
	const dragCounter = useRef(0)

	const phaseRef = useRef<Phase>('input')
	useEffect(() => {
		phaseRef.current = phase
	}, [phase])

	const accept = (files: FileList | File[]) => {
		const arr = Array.from(files)
		if (arr.length === 0) return
		/* Hold the files until the success beat has played, then
		 * enqueue them. Keeps the tray from popping in behind the
		 * success panel while the user is still watching the check. */
		pendingFilesRef.current = arr
		/* First trigger the ConfirmModal close animation; once it's
		 * done unmounting we swap to the success panel. */
		setPhase('exiting-input')
		/* Keep in sync with closeDurationMs passed to ConfirmModal
		 * below — exit anim and setTimeout must agree, otherwise the
		 * modal would un-render before (or after) it finishes fading. */
		window.setTimeout(() => setPhase('success'), 400)
	}

	/* The ConfirmModal's forceClose triggers its own onClose when
	 * the exit anim finishes — that would unmount us entirely and
	 * the success modal would never show. Only honour the callback
	 * when the user genuinely dismissed the drop zone (phase still
	 * 'input'). All other phases are internal transitions where
	 * ConfirmModal's own timer may fire after React has already
	 * moved us to 'success', and calling onClose there would kill
	 * the success panel before it mounts. */
	const handleConfirmModalClose = () => {
		if (phaseRef.current !== 'input') return
		onClose()
	}

	const finish = () => {
		if (pendingFilesRef.current) {
			enqueueUploads(pendingFilesRef.current, folderId)
			pendingFilesRef.current = null
		}
		onClose()
	}

	useEffect(() => {
		const onDragEnter = (e: DragEvent) => {
			if (!e.dataTransfer?.types?.includes('Files')) return
			e.preventDefault()
			dragCounter.current += 1
			if (dragCounter.current === 1) setDragging(true)
		}
		const onDragOver = (e: DragEvent) => {
			if (!e.dataTransfer?.types?.includes('Files')) return
			e.preventDefault()
			if (!dragging) setDragging(true)
		}
		const onDragLeave = (e: DragEvent) => {
			if (!e.dataTransfer?.types?.includes('Files')) return
			dragCounter.current = Math.max(0, dragCounter.current - 1)
			if (dragCounter.current === 0) setDragging(false)
		}
		const onDrop = (e: DragEvent) => {
			dragCounter.current = 0
			setDragging(false)
			if (!e.dataTransfer?.files?.length) return
			e.preventDefault()
			accept(e.dataTransfer.files)
		}
		window.addEventListener('dragenter', onDragEnter)
		window.addEventListener('dragover', onDragOver)
		window.addEventListener('dragleave', onDragLeave)
		window.addEventListener('drop', onDrop)
		return () => {
			window.removeEventListener('dragenter', onDragEnter)
			window.removeEventListener('dragover', onDragOver)
			window.removeEventListener('dragleave', onDragLeave)
			window.removeEventListener('drop', onDrop)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (phase === 'success') {
		/* Hold the success panel ~1.9s so the user clearly sees the
		 * check draw + title slide-up + sub slide-up before the
		 * modal fades and the tray takes over. */
		return <UploadSuccessModal onDone={finish} duration={1920} />
	}

	return (
		<ConfirmModal
			forceClose={phase === 'exiting-input'}
			closeDurationMs={400}
			icon={<CloudUploadOutlined />}
			iconTone='ink'
			title='Upload files'
			description={
				<>
					Drop files below or choose them from your device.
					<br />
					Up to 5 GB per file · 2 files upload at once · the rest wait in queue.
				</>
			}
			confirmLabel='Choose files'
			confirmColor='ink'
			cancelLabel='Close'
			onConfirm={() => inputRef.current?.click()}
			onClose={handleConfirmModalClose}
			maxWidth={520}
			bodyBorder='dashed'
			bodyBorderActive={dragging}
		>
			<input
				ref={inputRef}
				type='file'
				multiple
				hidden
				onChange={(e) => {
					if (e.target.files) {
						accept(e.target.files)
						e.target.value = ''
					}
				}}
			/>
		</ConfirmModal>
	)
}
