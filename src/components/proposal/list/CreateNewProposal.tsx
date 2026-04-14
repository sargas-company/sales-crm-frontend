import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../ui";

const CreateNewProposal = () => {
  const navigate = useNavigate();
  return (
    <Button onClick={() => navigate("/proposal/add/")}>Create proposal</Button>
  );
};
export default memo(CreateNewProposal);
