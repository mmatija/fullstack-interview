import { BillingInterval, Membership, MembershipState, PaymentMethod } from "../../src/modern/models/membership";
import { Factory } from 'fishery';

export class MembershipFactory {

    private membershipFactory = Factory.define<Membership>(({ sequence, params }) => ({
            id: sequence,
            uuid: `123e4567-e89b-12d3-a456-42661417400${sequence}`,
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