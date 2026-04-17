import DataGrid from "../../layout/data-grid/DataGrid";
import Box from "../../box/Box";
import DataGridCell from "../../data-grid-item/DataGridCell";
import { Text } from "../../../ui";
import type { DataGridColoumn } from "../../layout/data-grid/type";
import type { AccountItem } from "../../../store/accounts/accountsApi";
import AccountListAction from "./AccountListAction";

const columns: DataGridColoumn[] = [
  { fieldId: "firstName",  label: "First Name", width: "160px" },
  { fieldId: "lastName",   label: "Last Name",  width: "160px" },
  { fieldId: "platform",   label: "Platform",   width: "160px" },
  { fieldId: "createdAt",  label: "Created",    width: "160px" },
  { fieldId: "actions",    label: "Actions",    width: "120px" },
];

interface AccountTableProps {
  items: AccountItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

const AccountTable = ({ items, isLoading, onDelete }: AccountTableProps) => {
  if (isLoading || !items || items.length === 0) return <></>;

  return (
    <Box padding={24} pl={40}>
      <DataGrid
        rows={items}
        columns={columns}
        gridDataKey={(item) => item.id}
        pagination
        rowPerPage={10}
        rowPerPageOption={[10, 25, 50]}
        renderGridData={(row, field) => (
          <>
            <DataGridCell width={field["firstName"].width} value={row.firstName} />
            <DataGridCell width={field["lastName"].width} value={row.lastName} />
            <DataGridCell
              width={field["platform"].width}
              children={
                <Box display="flex" align="center" space={1}>
                  {row.platform?.imageUrl && (
                    <img
                      src={row.platform.imageUrl}
                      alt={row.platform.title}
                      style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                  )}
                  <Text varient="body2">{row.platform?.title ?? "—"}</Text>
                </Box>
              }
            />
            <DataGridCell
              width={field["createdAt"].width}
              value={new Date(row.createdAt).toLocaleDateString()}
            />
            <DataGridCell width={field["actions"].width}>
              <AccountListAction accountId={row.id} onDelete={onDelete} />
            </DataGridCell>
          </>
        )}
      />
    </Box>
  );
};

export default AccountTable;
