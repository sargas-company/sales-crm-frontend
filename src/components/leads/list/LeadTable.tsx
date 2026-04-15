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
import { LeadList } from "../../../store/leads/types/definition";
import { useAppSelector } from "../../../hooks";
import LeadListAction from "./LeadListAction";
import LeadListItemClientType from "./LeadListItemClientType";

const columns: DataGridColoumn[] = [
  { fieldId: "id",         label: "#",           width: "100px" },
  { fieldId: "bidId",      label: "Bid ID",      width: "130px" },
  { fieldId: "name",       label: "Lead Name",   width: "200px" },
  { fieldId: "status",     label: "Status",      width: "210px" },
  { fieldId: "clientType", label: "Client Type", width: "160px" },
  { fieldId: "rate",       label: "Rate",        width: "90px"  },
  { fieldId: "location",   label: "Location",    width: "160px" },
  { fieldId: "repliedAt",  label: "Replied At",  width: "160px" },
  { fieldId: "acceptedAt", label: "Accepted At", width: "160px" },
  { fieldId: "holdOnAt",   label: "Hold On At",  width: "160px" },
  { fieldId: "actions",    label: "Actions",     width: "140px" },
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
            <DataGridCell
              width={field["bidId"].width}
              justify="center"
              children={
                <Box display="flex" align="center">
                  <span style={{ cursor: "pointer" }} onClick={() => handleCopyBidId(row.jobId)}>
                    <Text skinColor>...{row.jobId.slice(-4)}</Text>
                  </span>
                  <Tooltip title={row.jobId} placement="top">
                    <span style={{ marginLeft: 4 }}>
                      <IconButton varient="text" size={30} fontSize={21} contentOpacity={5} onClick={() => handleCopyBidId(row.jobId)}>
                        <ContentCopy style={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              }
            />
            <DataGridCell width={field["name"].width} value={row.name} />
            <DataGridCell
              width={field["status"].width}
              children={<LeadListItemStatus itemStatus={row.status} />}
            />
            <DataGridCell
              width={field["clientType"].width}
              children={<LeadListItemClientType clientType={row.clientType} />}
            />
            <DataGridCell width={field["rate"].width} justify="center" value={`$${row.rate}`} />
            <DataGridCell width={field["location"].width}   value={row.location} />
            <DataGridCell width={field["repliedAt"].width}  value={row.repliedAt} />
            <DataGridCell width={field["acceptedAt"].width} value={row.acceptedAt} />
            <DataGridCell width={field["holdOnAt"].width}   value={row.holdOnAt} />
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
