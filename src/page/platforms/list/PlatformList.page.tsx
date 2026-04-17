import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import PlatformTable from "../../../components/platforms/list/PlatformTable";
import PlatformDeleteModal from "../../../components/platforms/list/PlatformDeleteModal";
import { GridInnerContainer, GridItem } from "../../../components/layout";
import { TextField, Button } from "../../../ui";
import { useGetPlatformsQuery } from "../../../store/platforms/platformsApi";

interface DeleteTarget {
  id: string;
  title: string;
}

const PlatformList = () => {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useGetPlatformsQuery();
  const allItems = data ?? [];

  const handleDelete = (id: string) => {
    const item = allItems.find((i) => i.id === id);
    if (item) setDeleteTarget({ id, title: item.title });
  };

  const items = search
    ? allItems.filter((item) => {
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q);
      })
    : allItems;

  return (
    <>
      <Card padding={'30px'}>
        <Box display="flex" justify="space-between" padding={20}>
          <GridInnerContainer alignItems="center" justifyContent="space-between">
            <GridItem xs={12} md={6}>
              <TextField
                type="text"
                name="search-platform"
                placeholder="Search platform"
                sizes="small"
                maxWidth="280px"
                onChange={(e) => setSearch(e.target.value)}
              />
            </GridItem>
            <GridItem xs={12} md={6}>
              <Box display="flex" justify="flex-end">
                <Button onClick={() => navigate("/platforms/add/")}>
                  Create Platform
                </Button>
              </Box>
            </GridItem>
          </GridInnerContainer>
        </Box>

        <PlatformTable items={items} isLoading={isLoading} onDelete={handleDelete} />
      </Card>

      {deleteTarget && (
        <PlatformDeleteModal
          id={deleteTarget.id}
          title={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
};

export default PlatformList;
