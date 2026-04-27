import ChatPanel from '../../chat/panel/ChatPanel'

interface Props {
	leadId: string
	/** Proposal ID needed for WebSocket send_message. null = read-only (proposal deleted) */
	proposalId: string | null
	model?: string
}

const LeadChat = ({ leadId, proposalId, model }: Props) => {
	return <ChatPanel historyUrl={`/leads/${leadId}/chat`} proposalId={proposalId} model={model} />
}

export default LeadChat
