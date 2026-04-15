import { useState } from "react";
import type { Platform, ProposalType } from "../../../store/proposals/types/definition";

export interface ProposalFormFields {
  manager: string;
  account: string;
  proposalType: ProposalType | "";
  platform: Platform;
  jobUrl: string;
  boosted: boolean;
  connects: string;
  coverLetter: string;
  vacancy: string;
  comment: string;
  context: string;
}

export interface ProposalFormErrors {
  manager?: string;
  account?: string;
  proposalType?: string;
}

const INITIAL: ProposalFormFields = {
  manager: "",
  account: "",
  proposalType: "",
  platform: "Upwork",
  jobUrl: "",
  boosted: false,
  connects: "0",
  coverLetter: "",
  vacancy: "",
  comment: "",
  context: "",
};

const validate = (fields: ProposalFormFields): ProposalFormErrors => {
  const errors: ProposalFormErrors = {};
  if (!fields.manager.trim())  errors.manager      = "Manager is required";
  if (!fields.account.trim())  errors.account      = "Account is required";
  if (!fields.proposalType)    errors.proposalType = "Proposal type is required";
  return errors;
};

const useProposalForm = () => {
  const [fields, setFields] = useState<ProposalFormFields>(INITIAL);
  const [errors, setErrors]  = useState<ProposalFormErrors>({});

  const setField = <K extends keyof ProposalFormFields>(key: K, value: ProposalFormFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const runValidation = (): boolean => {
    const result = validate(fields);
    setErrors(result);
    return Object.keys(result).length === 0;
  };

  const getPayload = () => ({
    manager:      fields.manager.trim(),
    account:      fields.account.trim(),
    proposalType: fields.proposalType as ProposalType,
    platform:     fields.platform,
    jobUrl:       fields.jobUrl.trim() || null,
    boosted:      fields.boosted,
    connects:     Number(fields.connects) || 0,
    coverLetter:  fields.coverLetter.trim(),
    vacancy:      fields.vacancy.trim(),
    comment:      fields.comment.trim(),
    context:      fields.context.trim(),
  });

  return { fields, errors, setField, runValidation, getPayload };
};

export default useProposalForm;
