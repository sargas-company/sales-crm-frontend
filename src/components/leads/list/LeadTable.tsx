import { useState } from "react";
import { Link } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import { Tooltip } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { IconButton } from "../../../ui";

import DataGrid from "../../layout/data-grid/DataGrid";
import Box from "../../box/Box";
import DataGridCell from "../../data-grid-item/DataGridCell";
import LeadListItemStatus from "./LeadListItemStatus";
import { Text } from "../../../ui";

import type { DataGridColoumn } from "../../layout/data-grid/type";
import type { LeadItem } from "../../../store/leads/types/definition";
import LeadListAction from "./LeadListAction";
import LeadListItemClientType from "./LeadListItemClientType";
import {formatDate} from '../../../utils/formatDate'

const columns: DataGridColoumn[] = [
  { fieldId: "number",     label: "#",           width: "100px" },
  { fieldId: "proposalId", label: "Bid ID",      width: "130px" },
  { fieldId: "leadName",   label: "Lead Name",   width: "200px" },
  { fieldId: "status",     label: "Status",      width: "210px" },
  { fieldId: "clientType", label: "Client Type", width: "160px" },
  { fieldId: "rate",       label: "Rate",        width: "90px"  },
  { fieldId: "location",   label: "Location",    width: "160px" },
  { fieldId: "repliedAt",  label: "Replied At",  width: "160px" },
  { fieldId: "acceptedAt", label: "Accepted At", width: "160px" },
  { fieldId: "holdAt",     label: "Hold On At",  width: "160px" },
  { fieldId: "actions",    label: "Actions",     width: "140px" },
];

interface LeadTableProps {
  items: LeadItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

const LeadTable = ({ items, isLoading, onDelete }: LeadTableProps) => {
  const [toastOpen, setToastOpen] = useState(false);

  const handleCopyBidId = (id: string) => {
    navigator.clipboard.writeText(id);
    setToastOpen(true);
  };

  if (isLoading || !items || items.length === 0) return <></>;

  return (
    <Box padding={24} pl={40}>
      <DataGrid
        rows={items}
        renderGridData={(row, field) => (
          <>
            <DataGridCell
              width={field["number"].width}
              children={
                <Link to={`/leads/preview/${row.id}`}>
                  <Text skinColor>#{row.number}</Text>
                </Link>
              }
            />
            <DataGridCell
              width={field["proposalId"].width}
              justify="center"
              children={
                row.proposalId ? (
                  <Box display="flex" align="center">
                    <span style={{ cursor: "pointer" }} onClick={() => handleCopyBidId(row.proposalId!)}>
                      <Text skinColor>{row.proposalId.slice(-4)}</Text>
                    </span>
                    <Tooltip title={row.proposalId} placement="top">
                      <span style={{ marginLeft: 4 }}>
                        <IconButton varient="text" size={30} fontSize={21} contentOpacity={5} onClick={() => handleCopyBidId(row.proposalId!)}>
                          <ContentCopy style={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                ) : (
                  <Text>—</Text>
                )
              }
            />
            <DataGridCell width={field["leadName"].width} value={row.leadName ?? "—"} />
            <DataGridCell
              width={field["status"].width}
              children={<LeadListItemStatus itemStatus={row.status} />}
            />
            <DataGridCell
              width={field["clientType"].width}
              children={<LeadListItemClientType clientType={row.clientType} />}
            />
            <DataGridCell width={field["rate"].width} justify="center" value={row.rate != null ? `$${row.rate}` : "—"} />
            <DataGridCell width={field["location"].width}   value={row.location ?? "—"} />
            <DataGridCell width={field["repliedAt"].width}  value={formatDate(row.repliedAt)} />
            <DataGridCell width={field["acceptedAt"].width} value={formatDate(row.acceptedAt) ?? "—"} />
            <DataGridCell width={field["holdAt"].width}     value={formatDate(row.holdAt) ?? "—"} />
            <DataGridCell width={field["actions"].width}>
              <LeadListAction leadId={row.id} onDelete={onDelete} />
            </DataGridCell>
          </>
        )}
        columns={columns}
        gridDataKey={(item) => item.id}
      />

      <Snackbar
        open={toastOpen}
        autoHideDuration={2000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToastOpen(false)}>
          Bid ID copied to clipboard
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadTable;
