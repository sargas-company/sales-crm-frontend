import React, { useCallback, useState } from "react";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import CreateNewLead from "../../../components/leads/list/CreateNewLead";
import LeadTable from "../../../components/leads/list/LeadTable";
import { GridInnerContainer, GridItem } from "../../../components/layout";
import { searchData } from "../../../store/leads/leadsSlice";
import { useAppDispatch } from "../../../hooks";
import { TextField } from "../../../ui";

const LeadList = () => {
  const dispatch = useAppDispatch();
  const [searchKey, setSearchKey] = useState("");
  const handleChangeSearch = useCallback(
    (eve: React.ChangeEvent<HTMLInputElement>) => {
      setTimeout(() => {
        dispatch(searchData(eve.target.value));
        setSearchKey(eve.target.value);
      }, 500);
    },
    []
  );
  return (
    <Card>
      <Box display="flex" justify="flex-end" padding={20}>
        <GridInnerContainer alignItems="center">
          <GridItem xs={12} md={6}>
            <TextField
                type="text"
                name="search-lead"
                placeholder="Search lead"
                sizes="small"
                maxWidth="280px"
                onChange={handleChangeSearch}
                defaultValue={searchKey}
            />
          </GridItem>
          <GridItem xs={12} md={6}>
            <CreateNewLead />
          </GridItem>
        </GridInnerContainer>
      </Box>

      <LeadTable />
    </Card>
  );
};
export default LeadList;
