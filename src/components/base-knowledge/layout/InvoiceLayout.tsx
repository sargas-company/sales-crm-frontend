import { Children, FC, ReactNode } from "react";
import { GridInnerContainer, GridItem } from "../../layout";

const InvoiceLayout: FC<Props> = ({ children }) => {
  const [left, right] = Children.toArray(children);
  return (
    <GridInnerContainer spacing={1.6}>
      <GridItem xs={12} md={12}>
        {left}
      </GridItem>

    </GridInnerContainer>
  );
};
export default InvoiceLayout;
interface Props {
  children: ReactNode;
}
