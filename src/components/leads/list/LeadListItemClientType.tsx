import { ApiClientType } from "../../../store/leads/types/definition";
import { Chip, Text } from "../../../ui";

const clientTypeColor: Record<ApiClientType, string> = {
  company:    "#9155FD",
  individual: "#FF9F43",
};

const clientTypeLabel: Record<ApiClientType, string> = {
  company:    "Company",
  individual: "Individual",
};

const LeadListItemClientType = ({ clientType }: { clientType: ApiClientType | null }) => {
  if (!clientType) return <Text>—</Text>;
  return (
    <Chip
      label={clientTypeLabel[clientType]}
      skin="light"
      size="small"
      color={clientTypeColor[clientType]}
      styles={{ whiteSpace: "nowrap", color: "#000000" }}
    />
  );
};

export default LeadListItemClientType;
