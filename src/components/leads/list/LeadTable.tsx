import { useState } from "react";
import { Link } from "react-router-dom";
import { Snackbar, Alert, IconButton, Tooltip } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";

import DataGrid from "../../layout/data-grid/DataGrid";
import Box from "../../box/Box";
import DataGridCell from "../../data-grid-item/DataGridCell";
import LeadListItemStatus from "./LeadListItemStatus";
import { Text } from "../../../ui";

import type { DataGridColoumn } from "../../layout/data-grid/type";
import { LeadList } from "../../../store/leads/types/definition";
import { useAppSelector } from "../../../hooks";
import LeadListAction from "./LeadListAction";

const columns: DataGridColoumn[] = [
  { fieldId: "id",         label: "#",           width: "100px" },
  { fieldId: "name",       label: "Lead Name",   width: "200px" },
  { fieldId: "status",     label: "Status",      width: "170px" },
  { fieldId: "clientType", label: "Client Type", width: "120px" },
  { fieldId: "rate",       label: "Rate",        width: "90px"  },
  { fieldId: "location",   label: "Location",    width: "160px" },
  { fieldId: "repliedAt",  label: "Replied At",  width: "120px" },
  { fieldId: "acceptedAt", label: "Accepted At", width: "120px" },
  { fieldId: "holdOnAt",   label: "Hold On At",  width: "120px" },
  { fieldId: "bidId",      label: "Bid ID",      width: "80px"  },
  { fieldId: "actions",    label: "Actions",     width: "80px"  },
];

const LeadTable = () => {
  const [toastOpen, setToastOpen] = useState(false);

  const leadList: LeadList[] = useAppSelector(
    (state) => state.lead.data
  );

  const handleCopyBidId = (id: string) => {
    navigator.clipboard.writeText(id);
    setToastOpen(true);
  };

  if (!leadList || leadList.length === 0) return <></>;
  return (
    <Box padding={24} pl={40}>
      <DataGrid
        rows={leadList}
        renderGridData={(row, field) => (
          <>
            <DataGridCell
              width={field["id"].width}
              children={
                <Link to={`/leads/preview/${row.id}`}>
                  <Text skinColor>#{row.id}</Text>
                </Link>
              }
            />
            <DataGridCell width={field["name"].width} value={row.name} />
            <DataGridCell
              width={field["status"].width}
              children={<LeadListItemStatus itemStatus={row.status} />}
            />
            <DataGridCell width={field["clientType"].width} value={row.clientType} />
            <DataGridCell width={field["rate"].width}       value={`$${row.rate}`} />
            <DataGridCell width={field["location"].width}   value={row.location} />
            <DataGridCell width={field["repliedAt"].width}  value={row.repliedAt} />
            <DataGridCell width={field["acceptedAt"].width} value={row.acceptedAt} />
            <DataGridCell width={field["holdOnAt"].width}   value={row.holdOnAt} />
            <DataGridCell
              width={field["bidId"].width}
              children={
                <Tooltip title={row.jobId} placement="top">
                  <IconButton size="small" onClick={() => handleCopyBidId(row.jobId)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            />
            <DataGridCell width={field["actions"].width}>
              <LeadListAction leadId={row.id} />
            </DataGridCell>
          </>
        )}
        columns={columns}
        gridDataKey={(item) => item.id}
        pagination
        rowPerPage={8}
        rowPerPageOption={[5, 8, 20]}
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
