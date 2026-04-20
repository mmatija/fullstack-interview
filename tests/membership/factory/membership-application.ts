import { BillingInterval, MembershipApplication, PaymentMethod } from "../../../src/modern/models/membership";
import { Factory } from 'fishery';

export class MembershipApplicationFactory {

    private membershipFactory = Factory.define<MembershipApplication>(({ sequence, params }) => ({
            name: `Membership Plan`,
            userId: 1000 + sequence,
            recurringPrice: 50.0,
            validFrom: new Date("2023-01-01"),
            paymentMethod: PaymentMethod.CreditCard,
            billingInterval: BillingInterval.Monthly,
            billingPeriods: 12,
            ...params
        }))

    public build(membershipData: Partial<MembershipApplication> = {}): MembershipApplication {
        return this.membershipFactory.build(membershipData);
    }
}