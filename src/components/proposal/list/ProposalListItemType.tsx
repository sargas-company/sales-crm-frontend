import { ProposalType } from "../../../store/proposals/types/definition";
import { Chip } from "../../../ui";

const typeColor: Record<ProposalType, string> = {
  Bid: "info",
  Invite: "success",
  "Direct Message": "#FF9F43",
};

const ProposalListItemType = ({ itemType }: { itemType: ProposalType }) => (
  <Chip
    label={itemType}
    skin="light"
    size="small"
    color={typeColor[itemType]}
    styles={{ whiteSpace: "nowrap" }}
  />
);

export default ProposalListItemType;
