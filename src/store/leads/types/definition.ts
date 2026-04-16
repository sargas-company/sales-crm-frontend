
export type LeadStatus =
  | "Conversation Ongoing"
  | "Trial"
  | "Hold"
  | "Archived"
  | "Contract Offer"
  | "Accept Contract"
  | "Start Contract";

export type ClientType = "Company" | "Individual";

export type AvatarColor = "error" | "info" | "warning" | "success"

export type AccountName = "Dmytro Sarafaniuk" | "Artem Kovalenko" | "Vadym Petrenko";

export type Platform = "Upwork" | "LinkedIn";

export type LeadType = "Bid" | "Invite" | "Direct Message";

export type BoostedStatus = "Boosted" | "Not Boosted" | "Boosted Outbid";

export interface LeadList {
    id: number;
    jobId: string;
    name: string;
    clientType: ClientType;
    rate: number;
    location: string;
    repliedAt: string;
    acceptedAt: string;
    holdOnAt: string;
    status: LeadStatus;
    // legacy fields
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
    service: string;
    total: number;
    avatar: string | undefined;
    avatarColor?: AvatarColor;
    balance: string | 0;
    dueDate: string;
}

export interface LeadState {
    data: Array<LeadList>;
    allData: Array<LeadList>;
    total: number;
}
