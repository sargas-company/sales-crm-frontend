import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import AccountTable from "../../../components/accounts/list/AccountTable";
import AccountDeleteModal from "../../../components/accounts/list/AccountDeleteModal";
import { GridInnerContainer, GridItem } from "../../../components/layout";
import { TextField, Button } from "../../../ui";
import { useGetAccountsQuery } from "../../../store/accounts/accountsApi";

interface DeleteTarget {
  id: string;
  title: string;
}

const AccountList = () => {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useGetAccountsQuery();
  const allItems = data ?? [];

  const handleDelete = (id: string) => {
    const item = allItems.find((i) => i.id === id);
    if (item) setDeleteTarget({ id, title: `${item.firstName} ${item.lastName}` });
  };

  const items = search
    ? allItems.filter((item) => {
        const q = search.toLowerCase();
        return (
          item.firstName.toLowerCase().includes(q) ||
          item.lastName.toLowerCase().includes(q) ||
          (item.platform?.title ?? "").toLowerCase().includes(q)
        );
      })
    : allItems;

  return (
    <>
      <Card>
        <Box display="flex" justify="space-between" padding={20}>
          <GridInnerContainer alignItems="center" justifyContent="space-between">
            <GridItem xs={12} md={6}>
              <TextField
                type="text"
                name="search-account"
                placeholder="Search account"
                sizes="small"
                maxWidth="280px"
                onChange={(e) => setSearch(e.target.value)}
              />
            </GridItem>
            <GridItem xs={12} md={6}>
              <Box display="flex" justify="flex-end">
                <Button onClick={() => navigate("/accounts/add/")}>
                  Create Account
                </Button>
              </Box>
            </GridItem>
          </GridInnerContainer>
        </Box>

        <AccountTable items={items} isLoading={isLoading} onDelete={handleDelete} />
      </Card>

      {deleteTarget && (
        <AccountDeleteModal
          id={deleteTarget.id}
          title={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
};

export default AccountList;
