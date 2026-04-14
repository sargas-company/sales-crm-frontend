import { ProposalStatus } from "../../../store/proposals/types/definition";
import { Chip } from "../../../ui";

const statusColor: Record<ProposalStatus, string> = {
  Draft: "warning",
  Sent: "info",
  Viewed: "#9155FD",
  Replied: "success",
};

const ProposalListItemStatus = ({ itemStatus }: { itemStatus: ProposalStatus }) => (
  <Chip
    label={itemStatus}
    skin="light"
    size="small"
    color={statusColor[itemStatus]}
  />
);

export default ProposalListItemStatus;
