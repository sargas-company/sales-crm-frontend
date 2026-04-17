import { ProposalType } from "../../../store/proposals/types/definition";
import { Chip } from "../../../ui";

const typeColor: Record<ProposalType, string> = {
  Bid: "info",
  Invite: "success",
  DirectMessage: "#FF9F43",
};

const typeLabel: Record<ProposalType, string> = {
  Bid: "Bid",
  Invite: "Invite",
  DirectMessage: "Direct Message",
};

const ProposalListItemType = ({ itemType }: { itemType: ProposalType }) => (
  <Chip
    label={typeLabel[itemType]}
    skin="light"
    size="small"
    color={typeColor[itemType]}
    styles={{ whiteSpace: "nowrap", color: "#000000" }}
  />
);

export default ProposalListItemType;
