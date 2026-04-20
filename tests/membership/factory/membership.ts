import { BillingInterval, Membership, MembershipState, PaymentMethod } from "../../../src/modern/models/membership";
import { Factory } from 'fishery';
import { v4 as uuid } from 'uuid';

export class MembershipFactory {

    private membershipFactory = Factory.define<Membership>(({ sequence, params }) => ({
            id: sequence,
            uuid: uuid(),
            name: `Membership Plan ${sequence}`,
            userId: 1000 + sequence,
            recurringPrice: 50.0,
            validFrom: new Date("2023-01-01"),
            validUntil: new Date("2023-12-31"),
            state: MembershipState.Active,
            assignedBy: "Admin",
            paymentMethod: PaymentMethod.CreditCard,
            billingInterval: BillingInterval.Monthly,
            billingPeriods: 12,
            ...params
        }))

    public build(membershipData: Partial<Membership> = {}): Membership {
        return this.membershipFactory.build(membershipData);
    }
}