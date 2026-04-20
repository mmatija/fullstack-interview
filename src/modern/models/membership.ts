export interface Membership {
    id: number;
    uuid: string;
    name: string;
    userId: number;
    recurringPrice: number;
    validFrom: Date;
    validUntil: Date;
    state: MembershipState;
    assignedBy: string;
    paymentMethod: PaymentMethod;
    billingInterval: BillingInterval;
    billingPeriods: number;
}

export enum MembershipState {
    Active = "active",
}

export enum PaymentMethod {
    CreditCard = "credit card",
    Cash = "cash"
}

export enum BillingInterval {
    Monthly = "monthly",
    Yearly = "yearly"
}