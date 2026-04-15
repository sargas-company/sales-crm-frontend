import { FC, memo, ReactNode } from "react";
import { Text } from "../../ui";
import Box from "../box/Box";

const DataGridCell: FC<Props> = ({ value, width, hidden, children, justify }) => {
  if (hidden) return <></>;
  const cellWidth = typeof width === "number" ? `${width}px` : width;
  return (
    <Box
      display="flex"
      align="center"
      justify={justify}
      wrap="nowrap"
      className="data-grid-cell"
      style={{
        width: `${cellWidth}`,
        minWidth: `${cellWidth}`,
        maxWidth: `${cellWidth}`,
        minHeight: 58,
        maxHeight: 58,
      }}
      padding={24}
    >
      {value && !children && (
        <Text varient="body2" textOverflow="ellipsis" paragraph>
          {value}
        </Text>
      )}
      {children && children}
    </Box>
  );
};
export default memo(DataGridCell);
interface Props {
  value?: string | number;
  width: number | string;
  hidden?: boolean;
  children?: ReactNode;
  justify?: 'space-between' | 'space-around' | 'space-evenly' | 'flex-start' | 'center' | 'flex-end';
}
