import AttachmentsSection from '../../_shared/attachments/AttachmentsSection'
import {
	fetchEmployeeAttachmentDownload,
	useDeleteEmployeeAttachmentMutation,
	useListEmployeeAttachmentsQuery,
	useUploadEmployeeAttachmentMutation,
} from '../../../store/employee/employeeAttachmentsApi'

interface Props {
	employeeId: string
	/** Hide the "Add more files" trigger. Delete still works. */
	hideAdd?: boolean
}

/** Thin binding of the generic AttachmentsSection to the Employee
 *  endpoints. All UI + state live in the shared component — this file
 *  only wires the RTK Query hooks + download helper. */
const EmployeeAttachmentsSection = ({ employeeId, hideAdd = false }: Props) => {
	const { data = [], isLoading } = useListEmployeeAttachmentsQuery(employeeId)
	const [upload] = useUploadEmployeeAttachmentMutation()
	const [del] = useDeleteEmployeeAttachmentMutation()
	return (
		<AttachmentsSection
			items={data}
			isLoading={isLoading}
			onUpload={(file) => upload({ employeeId, file }).unwrap()}
			onDelete={(attachmentId) =>
				del({ employeeId, attachmentId }).unwrap()
			}
			fetchDownloadUrl={(attachmentId) =>
				fetchEmployeeAttachmentDownload(employeeId, attachmentId)
			}
			hideAdd={hideAdd}
		/>
	)
}

export default EmployeeAttachmentsSection
