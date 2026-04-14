import { LeadStatus } from "../../../store/leads/types/definition";
import { Chip } from "../../../ui";

const statusColor: Record<LeadStatus, string> = {
  Draft: "warning",
  Sent: "info",
  Viewed: "#9155FD",
  Replied: "success",
};

const LeadListItemStatus = ({ itemStatus }: { itemStatus: LeadStatus }) => (
  <Chip
    label={itemStatus}
    skin="light"
    size="small"
    color={statusColor[itemStatus]}
  />
);

export default LeadListItemStatus;
