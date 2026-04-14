import React, { useCallback, useState } from "react";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import CreateNewProposal from "../../../components/proposal/list/CreateNewProposal";
// import ProposalFilter from "../../../components/proposal/list/ProposalFilter";
import ProposalTable from "../../../components/proposal/list/ProposalTable";
import { GridInnerContainer, GridItem } from "../../../components/layout";
import { searchData } from "../../../store/proposals/proposalsSlice";
import { useAppDispatch } from "../../../hooks";
import { TextField } from "../../../ui";

const ProposalList = () => {
  const dispatch = useAppDispatch();
  const [searchKey, setSearchKey] = useState("");
  // const [filterKey, setFilterKey] = useState("");
  const handleChangeSearch = useCallback(
    (eve: React.ChangeEvent<HTMLInputElement>) => {
      setTimeout(() => {
        dispatch(searchData(eve.target.value));
        setSearchKey(eve.target.value);
      }, 500);
    },
    []
  );
  // const handleChangeFilter = useCallback((invoiceStatus: string) => {
  //   dispatch(searchData(invoiceStatus));
  //   setFilterKey(filterKey);
  // }, []);
  return (
    <Card>
      <Box display="flex" justify="space-between" padding={20}>
        <GridInnerContainer alignItems="center" justifyContent="space-between">
          <GridItem xs={12} md={6}>
            <TextField
                type="text"
                name="search-invoice"
                placeholder="Search proposal"
                sizes="small"
                maxWidth="280px"
                onChange={handleChangeSearch}
                defaultValue={searchKey}
            />
          </GridItem>
          {/*<GridItem xs={12} md={6}>*/}
          {/*  <InvoiceFilter*/}
          {/*    status={filterKey}*/}
          {/*    changeFilter={handleChangeFilter}*/}
          {/*  />*/}
          {/*</GridItem>*/}

          <GridItem xs={12} md={6}>
            <Box display="flex" justify="flex-end">
              <CreateNewProposal />
            </Box>
          </GridItem>
        </GridInnerContainer>
      </Box>

      <ProposalTable />
    </Card>
  );
};
export default ProposalList;
