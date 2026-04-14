import type { ProposalItem } from "../../../components/proposal/item/type";
export interface Proposal {
    proposalNo: number;
    dateIssue: Date;
    dateDue: Date;
    proposalTo: number;
    salesperson: string;
    msgLeave: string;
    note: string;
    items: ProposalItem[];
}