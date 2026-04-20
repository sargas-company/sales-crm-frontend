import { memo } from 'react'
import { Button } from '../../../ui'

interface Props {
	onClick: () => void
}

const CreateKnowledgeButton = ({ onClick }: Props) => {
	return <Button onClick={onClick}>Create Knowledge</Button>
}
export default memo(CreateKnowledgeButton)
