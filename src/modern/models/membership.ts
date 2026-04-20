export interface MembershipApplication {
    name: string;
    userId: number;
    recurringPrice: number;
    validFrom?: Date;
    paymentMethod: PaymentMethod;
    billingInterval: BillingInterval;
    billingPeriods: number;
}

export interface Membership extends MembershipApplication {
    id: number;
    uuid: string;
    state: MembershipState;
    validFrom: Date;
    validUntil: Date;
    assignedBy: string;
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