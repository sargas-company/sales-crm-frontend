import { Link } from "react-router-dom";
import DataGrid from "../../layout/data-grid/DataGrid";
import Box from "../../box/Box";
import DataGridCell from "../../data-grid-item/DataGridCell";
import { Text, Chip } from "../../../ui";
import type { DataGridColoumn } from "../../layout/data-grid/type";
import { BaseKnowledgeItem } from "../../../store/baseKnowledge/baseKnowledgeApi";
import BaseKnowledgeListAction from "./BaseKnowledgeListAction";

const columns: DataGridColoumn[] = [
  { fieldId: "title",     label: "Title",      width: "35%" },
  { fieldId: "category",  label: "Category",   width: "15%" },
  { fieldId: "createdAt", label: "Created",    width: "20%" },
  { fieldId: "updatedAt", label: "Updated",    width: "20%" },
  { fieldId: "actions",   label: "Actions",    width: "10%" },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

interface Props {
  items: BaseKnowledgeItem[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BaseKnowledgeTable = ({ items, isLoading, onEdit, onDelete }: Props) => {
  if (isLoading) return <Box padding={24}><Text>Loading…</Text></Box>;
  if (items.length === 0) return <Box padding={24}><Text>No records found.</Text></Box>;

  return (
    <Box padding={24} pl={40}>
      <DataGrid
        rows={items}
        columns={columns}
        gridDataKey={(item: BaseKnowledgeItem) => item.id}
        renderGridData={(row: BaseKnowledgeItem, field) => (
          <>
            <DataGridCell width={field["title"].width}>
              <Link to={`/knowledge/preview/${row.id}`}>
                <Text skinColor>{row.title}</Text>
              </Link>
            </DataGridCell>
            <DataGridCell width={field["category"].width}>
              {row.category ? (
                <Chip label={row.category} skin="light" size="small" color="info" />
              ) : (
                <Text>—</Text>
              )}
            </DataGridCell>
            <DataGridCell width={field["createdAt"].width} value={formatDate(row.createdAt)} />
            <DataGridCell width={field["updatedAt"].width} value={formatDate(row.updatedAt)} />
            <DataGridCell width={field["actions"].width}>
              <BaseKnowledgeListAction id={row.id} onEdit={onEdit} onDelete={onDelete} />
            </DataGridCell>
          </>
        )}
      />
    </Box>
  );
};

export default BaseKnowledgeTable;
