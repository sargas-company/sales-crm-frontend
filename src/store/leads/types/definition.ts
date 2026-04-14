
export type LeadStatus = "Draft" | "Sent" | "Viewed" | "Replied";

export type AvatarColor = "error" | "info" | "warning" | "success"

export type AccountName = "Dmytro" | "Artem" | "Vadym";

export type Platform = "Upwork" | "LinkedIn" | "Jobble";

export type LeadType = "Bid" | "Invite" | "Direct Message";

export type BoostedStatus = "Boosted" | "Not Boosted" | "Boosted Outbid";

export interface LeadList {
    id: number;
    jobId: string;
    account: AccountName;
    platform: Platform;
    leadType: LeadType;
    boosted: BoostedStatus;
    connects: number;
    coverLetter: string;
    createdAt: string;
    sentAt: string;
    address: string;
    company: string;
    companyEmail: string;
    country: string;
    contact: string;
    name: string;
    service: string;
    total: number;
    avatar: string | undefined;
    avatarColor?: AvatarColor;
    status: LeadStatus;
    balance: string | 0;
    dueDate: string;
}

export interface LeadState {
    data: Array<LeadList>;
    allData: Array<LeadList>;
    total: number;
}
