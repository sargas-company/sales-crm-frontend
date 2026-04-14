import { InvoiceStatus } from "../../../store/invoices/types/definition";
import { Chip } from "../../../ui";

const statusColor: Record<InvoiceStatus, string> = {
  Draft: "warning",
  Sent: "info",
  Viewed: "#9155FD",
  Replied: "success",
};

const InvoiceListItemStatus = ({ itemStatus }: { itemStatus: InvoiceStatus }) => (
  <Chip
    label={itemStatus}
    skin="light"
    size="small"
    color={statusColor[itemStatus]}
  />
);

export default InvoiceListItemStatus;
