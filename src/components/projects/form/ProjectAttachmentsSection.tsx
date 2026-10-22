import AttachmentsSection from '../../_shared/attachments/AttachmentsSection'
import {
	fetchProjectAttachmentDownload,
	useDeleteProjectAttachmentMutation,
	useListProjectAttachmentsQuery,
	useUploadProjectAttachmentMutation,
} from '../../../store/project/projectAttachmentsApi'

interface Props {
	projectId: string
	/** Hide the "Add more files" trigger. Delete still works. */
	hideAdd?: boolean
}

/** Thin binding of the generic AttachmentsSection to the Project
 *  endpoints — mirror of EmployeeAttachmentsSection. */
const ProjectAttachmentsSection = ({ projectId, hideAdd = false }: Props) => {
	const { data = [], isLoading } = useListProjectAttachmentsQuery(projectId)
	const [upload] = useUploadProjectAttachmentMutation()
	const [del] = useDeleteProjectAttachmentMutation()
	return (
		<AttachmentsSection
			items={data}
			isLoading={isLoading}
			onUpload={(file) => upload({ projectId, file }).unwrap()}
			onDelete={(attachmentId) =>
				del({ projectId, attachmentId }).unwrap()
			}
			fetchDownloadUrl={(attachmentId) =>
				fetchProjectAttachmentDownload(projectId, attachmentId)
			}
			hideAdd={hideAdd}
		/>
	)
}

export default ProjectAttachmentsSection
