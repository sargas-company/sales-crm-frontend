import { WarningAmberRounded } from '@mui/icons-material'

import ConfirmModal from '../../components/_shared/ConfirmModal'

/* Two small modals that pop up during the resume-with-file flow:
 *   - SizeNameMismatchModal — user picked a file whose name/size
 *     don't match the paused upload (likely a different file)
 *   - HashMismatchModal — name/size match but SHA-1 differs (file
 *     was edited between pause and resume) */

export const SizeNameMismatchModal = ({
	expectedName,
	expectedSize,
	pickedName,
	pickedSize,
	onCancel,
	onRestartAnyway,
}: {
	expectedName: string
	expectedSize: number
	pickedName: string
	pickedSize: number
	onCancel: () => void
	onRestartAnyway: () => void
}) => (
	<ConfirmModal
		icon={<WarningAmberRounded />}
		iconTone='orange'
		title='Different file selected'
		description={
			<>
				You selected <strong>{pickedName}</strong> ({fmt(pickedSize)}). The
				paused upload was <strong>{expectedName}</strong> ({fmt(expectedSize)}).
				These look like different files.
				<br />
				<br />
				If you continue, the paused upload will be cancelled and the newly
				selected file will start a fresh upload.
			</>
		}
		confirmLabel='Start new upload'
		confirmColor='ink'
		cancelLabel='Cancel'
		onConfirm={onRestartAnyway}
		onClose={onCancel}
		maxWidth={520}
	/>
)

export const HashMismatchModal = ({
	fileName,
	onDiscard,
	onRestart,
}: {
	fileName: string
	onDiscard: () => void
	onRestart: () => void
}) => (
	<ConfirmModal
		icon={<WarningAmberRounded />}
		iconTone='orange'
		title='File has changed'
		description={
			<>
				<strong>{fileName}</strong> matches the paused upload by name and size,
				but the file contents are different (edited after the upload paused?).
				<br />
				<br />
				Resuming would corrupt the result. You can either discard this upload
				entirely, or restart from scratch with the current file.
			</>
		}
		confirmLabel='Upload from scratch'
		confirmColor='ink'
		cancelLabel='Discard'
		onConfirm={onRestart}
		onClose={onDiscard}
		maxWidth={520}
	/>
)

const fmt = (n: number) => {
	if (n < 1024) return `${n} B`
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
	if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
	return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}
