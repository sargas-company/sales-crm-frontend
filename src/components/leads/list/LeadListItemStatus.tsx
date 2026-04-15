import { LeadStatus } from "../../../store/leads/types/definition";
import { Chip } from "../../../ui";

const statusColor: Record<LeadStatus, string> = {
  "Conversation Ongoing": "info",
  "Trial":                "warning",
  "Hold":                 "#607D8B",
  "Archived":             "#9E9E9E",
  "Contract Offer":       "#9155FD",
  "Accept Contract":      "success",
  "Start Contract":       "#00897B",
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
