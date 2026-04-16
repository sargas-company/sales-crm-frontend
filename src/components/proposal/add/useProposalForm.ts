import { useState, useEffect } from "react";
import type { ProposalType, ProposalStatus } from "../../../store/proposals/types/definition";

export interface ProposalFormFields {
  title: string;
  accountId: string;
  platformId: string;
  proposalType: ProposalType | "";
  status: ProposalStatus;
  jobUrl: string;
  boosted: boolean;
  connects: string;
  coverLetter: string;
  vacancy: string;
}

export interface ProposalFormErrors {
  title?: string;
  accountId?: string;
  proposalType?: string;
}

const INITIAL: ProposalFormFields = {
  title: "",
  accountId: "",
  platformId: "",
  proposalType: "",
  status: "Draft",
  jobUrl: "",
  boosted: false,
  connects: "0",
  coverLetter: "",
  vacancy: "",
};

const validate = (fields: ProposalFormFields): ProposalFormErrors => {
  const errors: ProposalFormErrors = {};
  if (!fields.title.trim())    errors.title        = "Title is required";
  if (!fields.accountId)       errors.accountId    = "Account is required";
  if (!fields.proposalType)    errors.proposalType = "Proposal type is required";
  return errors;
};

const useProposalForm = (initialValues?: Partial<ProposalFormFields>) => {
  const [fields, setFields] = useState<ProposalFormFields>({ ...INITIAL, ...initialValues });
  const [errors, setErrors]  = useState<ProposalFormErrors>({});

  useEffect(() => {
    if (initialValues) {
      setFields({ ...INITIAL, ...initialValues });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialValues)]);

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
    title:        fields.title.trim(),
    accountId:    fields.accountId,
    platformId:   fields.platformId,
    proposalType: fields.proposalType as ProposalType,
    status:       fields.status,
    jobUrl:       fields.jobUrl.trim() || null,
    boosted:      fields.boosted,
    connects:     Number(fields.connects) || 0,
    coverLetter:  fields.coverLetter.trim(),
    vacancy:      fields.vacancy.trim() || null,
  });

  return { fields, errors, setField, runValidation, getPayload };
};

export default useProposalForm;
