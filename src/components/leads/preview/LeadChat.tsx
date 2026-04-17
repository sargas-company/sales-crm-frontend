import ChatPanel from '../../chat/panel/ChatPanel'

interface Props {
  leadId: string
  /** Proposal ID needed for WebSocket send_message. null = read-only (proposal deleted) */
  proposalId: string | null
}

const LeadChat = ({ leadId, proposalId }: Props) => {
  return (
    <ChatPanel
      historyUrl={`/leads/${leadId}/chat`}
      proposalId={proposalId}
    />
  )
}

export default LeadChat
