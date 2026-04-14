import { Link } from "react-router-dom";

import DataGrid from "../../layout/data-grid/DataGrid";
import Box from "../../box/Box";
import DataGridCell from "../../data-grid-item/DataGridCell";
import LeadListItemStatus from "./LeadListItemStatus";
import DataGridUserDetail from "../../data-grid/DataGridUserDetail";
import { Text, Chip } from "../../../ui";

import { TrendingUp } from "@mui/icons-material";

import type { DataGridColoumn } from "../../layout/data-grid/type";
import { LeadList } from "../../../store/leads/types/definition";
import { useAppSelector } from "../../../hooks";
import LeadListAction from "./LeadListAction";

const columns: DataGridColoumn[] = [
  {
    fieldId: "id",
    label: "#",
    width: "120px",
  },
  {
    fieldId: "status",
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
    fieldId: "createdAt",
    label: "Created At",
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

const LeadTable = () => {
  const leadList: LeadList[] = useAppSelector(
    (state) => state.lead.data
  );
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
            width={field["status"].width}
            children={<LeadListItemStatus itemStatus={row.status} />}
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
            width={field["createdAt"].width}
            value={row.createdAt}
          />
          <DataGridCell width={field["balance"].width}>
            {row.balance === 0 ? (
              <Chip label="Paid" skin="light" size="small" color="success" />
            ) : (
              row.balance
            )}
          </DataGridCell>
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
    </Box>
  );
};
export default LeadTable;
