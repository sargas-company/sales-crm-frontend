import DataGrid from "../../layout/data-grid/DataGrid";
import Box from "../../box/Box";
import DataGridCell from "../../data-grid-item/DataGridCell";
import { Text } from "../../../ui";
import type { DataGridColoumn } from "../../layout/data-grid/type";
import type { PlatformItem } from "../../../store/platforms/platformsApi";
import PlatformListAction from "./PlatformListAction";

const columns: DataGridColoumn[] = [
  { fieldId: "title",     label: "Title",   width: "200px" },
  { fieldId: "imageUrl",  label: "Logo",    width: "100px" },
  { fieldId: "createdAt", label: "Created", width: "180px" },
  { fieldId: "actions",   label: "Actions", width: "120px" },
];

interface PlatformTableProps {
  items: PlatformItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

const PlatformTable = ({ items, isLoading, onDelete }: PlatformTableProps) => {
  if (isLoading || !items) return <></>;

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
            <DataGridCell width={field["title"].width} value={row.title} />
            <DataGridCell
              width={field["imageUrl"].width}
              justify="center"
              children={
                row.imageUrl ? (
                  <img
                    src={row.imageUrl}
                    alt={row.title}
                    style={{ width: 32, height: 32, objectFit: "contain" }}
                  />
                ) : (
                  <Text secondary>—</Text>
                )
              }
            />
            <DataGridCell
              width={field["createdAt"].width}
              value={new Date(row.createdAt).toLocaleDateString()}
            />
            <DataGridCell width={field["actions"].width}>
              <PlatformListAction platformId={row.id} onDelete={onDelete} />
            </DataGridCell>
          </>
        )}
      />
    </Box>
  );
};

export default PlatformTable;
