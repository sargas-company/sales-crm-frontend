import { useParams } from "react-router-dom";
import ProposalForm from "../../../components/proposal/form/ProposalForm";

const ProposalEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <ProposalForm mode="edit" id={id} />;
};

export default ProposalEdit;
