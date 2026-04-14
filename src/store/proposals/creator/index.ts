import { ProposalActionName } from "../types/action";

export const fetchProposal = (proposal: any) => ({
    type: ProposalActionName.fetchProposal,
    payload: proposal
});

export const searchData = (qr: string) => ({
    type: ProposalActionName.searchData,
    payload: qr
})