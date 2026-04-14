import { useState } from "react";
import { Link } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";

import upworkLogo from "../../../image/logo/upwork2.png"; // TODO: replace with Upwork logo
import type { Platform } from "../../../store/invoices/types/definition";

const platformLogos: Record<Platform, string> = {
  Upwork: upworkLogo,
  LinkedIn: upworkLogo, // TODO: replace with LinkedIn logo
  Jobble: upworkLogo,   // TODO: replace with Jobble logo
};

import DataGrid from "../../layout/data-grid/DataGrid";
import Box from "../../box/Box";
import DataGridCell from "../../data-grid-item/DataGridCell";
import InvoiceListItemStatus from "./InvoiceListItemStatus";
import DataGridUserDetail from "../../data-grid/DataGridUserDetail";
import { Text, Chip } from "../../../ui";

import { TrendingUp } from "@mui/icons-material";

import type { DataGridColoumn } from "../../layout/data-grid/type";
import { InvoiceList } from "../../../store/invoices/types/definition";
import { useAppSelector } from "../../../hooks";
import InvoiceListAction from "./InvoiceListAction";

const columns: DataGridColoumn[] = [
  {
    fieldId: "id",
    label: "#",
    width: "120px",
  },
  {
    fieldId: "jobId",
    label: "JobID",
    width: "200px",
  },
  {
    fieldId: "account",
    label: "Account",
    width: "140px",
  },
  {
    fieldId: "platform",
    label: "Platform",
    width: "120px",
  },
  {
    fieldId: "invoiceStatus",
    label: <TrendingUp style={{ fontSize: 18 }} />,
    width: "120px",
  },
  {
    fieldId: "name",
    label: "client",
    width: "320px",
  },
  {
    fieldId: "total",
    label: "total",
    width: "10%",
  },
  {
    fieldId: "issuedDate",
    label: "Issued date",
    width: "15%",
  },
  {
    fieldId: "balance",
    label: "balance",
    width: "10%",
  },
  {
    fieldId: "actions",
    label: "Actions",
    width: "10%",
  },
];

const InvoiceTable = () => {
  const [toastOpen, setToastOpen] = useState(false);

  const invoiceList: InvoiceList[] = useAppSelector(
    (state) => state.invoice.data
  );

  const handleCopyJobId = (url: string) => {
    navigator.clipboard.writeText(url);
    setToastOpen(true);
  };

  if (!invoiceList || invoiceList.length === 0) return <></>;
  return (
    <Box padding={24} pl={40}>
      <DataGrid
        rows={invoiceList}
        renderGridData={(row, field) => (
          <>
            <DataGridCell
              width={field["id"].width}
              children={
                <Link to={`/proposal/preview/${row.id}`}>
                  <Text skinColor>#{row.id}</Text>
                </Link>
              }
            />
            <DataGridCell
              width={field["jobId"].width}
              children={
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCopyJobId(row.jobId)}
                >
                  <Text skinColor>{row.jobId.replace(/.*~/, "")}</Text>
                </span>
              }
            />
            <DataGridCell
              width={field["account"].width}
              value={row.account}
            />
            <DataGridCell
              width={field["platform"].width}
              children={
                <img
                  src={platformLogos[row.platform]}
                  alt={row.platform}
                  style={{ width: 24, height: 24, objectFit: "contain" }}
                />
              }
            />
            <DataGridCell
              width={field["invoiceStatus"].width}
              children={<InvoiceListItemStatus itemStatus={row.invoiceStatus} />}
            />
            <DataGridCell
              width={field["name"].width}
              children={
                <DataGridUserDetail
                  userName={row.name}
                  userid={row.companyEmail}
                  avatarColor={row.avatarColor}
                  avatarsrc={row.avatar}
                />
              }
            />
            <DataGridCell width={field["total"].width} value={`$${row.total}`} />
            <DataGridCell
              width={field["issuedDate"].width}
              value={row.issuedDate}
            />
            <DataGridCell width={field["balance"].width}>
              {row.balance === 0 ? (
                <Chip label="Paid" skin="light" size="small" color="success" />
              ) : (
                row.balance
              )}
            </DataGridCell>
            <DataGridCell width={field["actions"].width}>
              <InvoiceListAction invoiceId={row.id} />
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
          Job URL copied to clipboard
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default InvoiceTable;
