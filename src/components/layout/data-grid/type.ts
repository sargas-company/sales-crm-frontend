import { ReactNode } from "react";
export default interface DataGridOptions<T> {
    rows: Array<T>;
    columns: DataGridColoumn[];
    rowPerPage?: number;
    rowPerPageOption?: number[];
    pagination?: boolean;
    height?: string;
    width?: string;
    renderGridData: (row: T, column: { [field: string]: DataGridColoumn }, index: number) => ReactNode;
    gridDataKey: (item: T) => string | number;
}

export interface DataGridColoumn {
    fieldId: string;
    label: string | ReactNode;
    width: number | string;
    flex?: number;
    wrapLabel?: boolean;
}

type FieldName = string | "";
type BySort = 'asc' | 'desc' | "";
export interface SortOption {
    fieldName: FieldName;
    by: BySort;
}

export interface DataOptionContext {
    sortByAsc: (option: SortOption) => void;
    sortByDesc: (option: SortOption) => void;
    hideColumn: (fieldId: FieldName) => void;
    handleOpenColumnsCustomizer: () => void;
    handleShowFilter: () => void;
}

export interface StyledProps {
    width?: string;
}