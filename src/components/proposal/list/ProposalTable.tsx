import { useState } from "react";
import { Link } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import { Tooltip } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { IconButton } from "../../../ui";

import upworkLogo from "../../../image/logo/upwork2.png";
import type { Platform, ProposalItem } from "../../../store/proposals/types/definition";
import { formatDate, shortUuid } from "../../../utils/formatDate";

import DataGrid from "../../layout/data-grid/DataGrid";
import Box from "../../box/Box";
import DataGridCell from "../../data-grid-item/DataGridCell";
import ProposalListItemStatus from "./ProposalListItemStatus";
import ProposalListItemType from "./ProposalListItemType";
import ProposalListItemBoosted from "./ProposalListItemBoosted";
import Modal from "../../modal/Modal";
import ModalContentLayout from "../../users/layout/ModalContentLayout";
import { Text } from "../../../ui";

import type { DataGridColoumn } from "../../layout/data-grid/type";
import ProposalListAction from "./ProposalListAction";

const platformLogos: Record<Platform, string> = {
  Upwork: upworkLogo,
  LinkedIn: upworkLogo,
  Jobble: upworkLogo,
};

const columns: DataGridColoumn[] = [
  { fieldId: "id",           label: "#",            width: "120px" },
  { fieldId: "jobUrl",        label: "Job URL",      width: "130px" },
  { fieldId: "status",       label: "Status",       width: "120px" },
  { fieldId: "manager",      label: "Manager",      width: "160px" },
  { fieldId: "account",      label: "Account",      width: "140px" },
  { fieldId: "platform",     label: "Platform",     width: "120px" },
  { fieldId: "proposalType", label: "Type",         width: "160px" },
  { fieldId: "boosted",      label: "Boosted",      width: "175px" },
  { fieldId: "connects",     label: "Connects",     width: "110px" },
  { fieldId: "createdAt",    label: "Created At",   width: "160px" },
  { fieldId: "sentAt",       label: "Sent At",      width: "160px" },
  { fieldId: "coverLetter",  label: "Cover Letter", width: "320px" },
  { fieldId: "actions",      label: "Actions",      width: "140px" },
];

interface Props {
  items: ProposalItem[];
  isLoading: boolean;
}

const ProposalTable = ({ items, isLoading }: Props) => {
  const [toastOpen, setToastOpen] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState<string | null>(null);

  const handleCopyJobId = (url: string) => {
    navigator.clipboard.writeText(url);
    setToastOpen(true);
  };

  if (isLoading) return <Box padding={24}><Text>Loading…</Text></Box>;
  if (items.length === 0) return <></>;

  return (
    <Box padding={24} pl={40}>
      <DataGrid
        rows={items}
        renderGridData={(row, field) => (
          <>
            <DataGridCell
              width={field["id"].width}
              children={
                <Link to={`/proposal/preview/${row.id}`}>
                  <Tooltip title={row.id} placement="top">
                    <span><Text skinColor>#{shortUuid(row.id)}</Text></span>
                  </Tooltip>
                </Link>
              }
            />
            <DataGridCell
              width={field["jobUrl"].width}
              justify="center"
              children={
                row.jobUrl ? (
                  <Box display="flex" align="center">
                    <span style={{ cursor: "pointer" }} onClick={() => handleCopyJobId(row.jobUrl!)}>
                      <Text skinColor>{row.jobUrl.slice(-4)}</Text>
                    </span>
                    <Tooltip title={row.jobUrl} placement="top">
                      <span style={{ marginLeft: 4 }}>
                        <IconButton varient="text" size={30} fontSize={21} contentOpacity={5} onClick={() => handleCopyJobId(row.jobUrl!)}>
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
            <DataGridCell
              width={field["status"].width}
              children={<ProposalListItemStatus itemStatus={row.status} />}
            />
            <DataGridCell width={field["manager"].width} value={row.manager} />
            <DataGridCell width={field["account"].width} value={row.account} />
            <DataGridCell
              width={field["platform"].width}
              justify="center"
              children={
                <img
                  src={platformLogos[row.platform]}
                  alt={row.platform}
                  style={{ width: 24, height: 24, objectFit: "contain" }}
                />
              }
            />
            <DataGridCell
              width={field["proposalType"].width}
              children={<ProposalListItemType itemType={row.proposalType} />}
            />
            <DataGridCell
              width={field["boosted"].width}
              children={
                <ProposalListItemBoosted itemBoosted={row.boosted ? "Boosted" : "Not Boosted"} />
              }
            />
            <DataGridCell width={field["connects"].width} justify="center" value={String(row.connects)} />
            <DataGridCell width={field["createdAt"].width} value={formatDate(row.createdAt)} />
            <DataGridCell width={field["sentAt"].width}    value={formatDate(row.sentAt)} />
            <DataGridCell
              width={field["coverLetter"].width}
              children={
                row.coverLetter ? (
                  <span
                    onClick={() => setCoverLetterText(row.coverLetter)}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      fontSize: 13,
                      lineHeight: "1.5",
                      cursor: "pointer",
                    }}
                  >
                    {row.coverLetter}
                  </span>
                ) : (
                  <Text>—</Text>
                )
              }
            />
            <DataGridCell width={field["actions"].width}>
              <ProposalListAction proposalId={row.id} />
            </DataGridCell>
          </>
        )}
        columns={columns}
        gridDataKey={(item) => item.id}
      />

      {coverLetterText && (
        <Modal handleOutClick={() => setCoverLetterText(null)}>
          <ModalContentLayout maxWidth="600px">
            <Box display="flex" flexDirection="column" space={3}>
              <Text heading="h6">Cover Letter</Text>
              <Box style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <Text varient="body2" paragraph>
                  {coverLetterText}
                </Text>
              </Box>
            </Box>
          </ModalContentLayout>
        </Modal>
      )}

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

export default ProposalTable;
