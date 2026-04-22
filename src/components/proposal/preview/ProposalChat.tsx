import ChatPanel from '../../chat/panel/ChatPanel'

interface Props {
	proposalId: string
	model: string
}

const ProposalChat = ({ proposalId, model }: Props) => {
	return <ChatPanel historyUrl={`/proposals/${proposalId}/chat`} proposalId={proposalId} model={model} />
}

export default ProposalChat
