import { ClientType } from "../../../store/leads/types/definition";
import { Chip } from "../../../ui";

const clientTypeColor: Record<ClientType, string> = {
  Company:    "#9155FD",
  Individual: "#FF9F43",
};

const LeadListItemClientType = ({ clientType }: { clientType: ClientType }) => (
  <Chip
    label={clientType}
    skin="light"
    size="small"
    color={clientTypeColor[clientType]}
    styles={{ whiteSpace: "nowrap" }}
  />
);

export default LeadListItemClientType;
