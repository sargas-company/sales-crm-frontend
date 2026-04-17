import { ApiLeadStatus } from "../../../store/leads/types/definition";
import { Chip } from "../../../ui";

const statusColor: Record<ApiLeadStatus, string> = {
  conversation_ongoing: "info",
  trial:                "warning",
  hold:                 "#607D8B",
  contract_offer:       "#9155FD",
  accept_contract:      "success",
  start_contract:       "#00897B",
  suspended:            "#9E9E9E",
};

const statusLabel: Record<ApiLeadStatus, string> = {
  conversation_ongoing: "Conversation Ongoing",
  trial:                "Trial",
  hold:                 "Hold",
  contract_offer:       "Contract Offer",
  accept_contract:      "Accept Contract",
  start_contract:       "Start Contract",
  suspended:            "Suspended",
};

const LeadListItemStatus = ({ itemStatus }: { itemStatus: ApiLeadStatus }) => (
  <Chip
    label={statusLabel[itemStatus]}
    skin="light"
    size="small"
    color={statusColor[itemStatus]}
    styles={{ whiteSpace: "nowrap", color: "#000000" }}
  />
);

export default LeadListItemStatus;
