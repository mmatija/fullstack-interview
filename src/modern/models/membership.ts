export interface MembershipApplication {
    name: string;
    userId: number;
    recurringPrice: number;
    validFrom?: Date;
    paymentMethod: PaymentMethod;
    billingInterval: BillingInterval;
    billingPeriods: number;
}

export interface StoredMembership extends MembershipApplication {
    id: number;
    uuid: string;
    state: MembershipState;
    validFrom: Date;
    validUntil: Date;
    assignedBy: string;
}

export interface Membership extends StoredMembership {
    periods: MembershipPeriod[];
}

export interface MembershipPeriod {
    id: number;
    uuid: string;
    membershipId: number;
    start: Date;
    end: Date;
    state: string;
}

export enum MembershipState {
    Active = "active",
    Pending = "pending",
    Expired = "expired",
}

export enum PaymentMethod {
    CreditCard = "credit card",
    Cash = "cash"
}

export enum BillingInterval {
    Monthly = "monthly",
    Weekly = "weekly",
    Yearly = "yearly"
}