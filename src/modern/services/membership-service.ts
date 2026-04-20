import { ValidationError } from "../../../tests/membership/service/validation-error";
import { BillingInterval, Membership } from "../models/membership";
import { MembershipRepository } from "../repositories/memberships-repository";

export class MembershipService {

    constructor(private membershipRepository: MembershipRepository) {}

    createMembership(membership: Membership): Promise<Membership> {
        try {
            this.validateMembership(membership)
        } catch (error) {
            return Promise.reject(error)
        }
        return this.membershipRepository.createMembership(membership)
    }

    private validateMembership(membership: Membership): void {
        if (membership.recurringPrice < 0) {
            throw new ValidationError("negativeRecurringPrice")
        }
        if (membership.paymentMethod === "cash" && membership.recurringPrice > 100) {
            throw new ValidationError("cashPriceBelow100")
        }
        if (membership.billingInterval == BillingInterval.Monthly) {
            if (membership.billingPeriods > 12) {
                throw new ValidationError("billingPeriodsMoreThan12Months")
            }
            if (membership.billingPeriods < 6) {
                throw new ValidationError("billingPeriodsLessThan6Months")
            }
        } else if (membership.billingInterval == BillingInterval.Yearly) {
            if (membership.billingPeriods > 3) {
                if (membership.billingPeriods > 10) {
                    throw new ValidationError("billingPeriodsMoreThan10Years")
                }
                throw new ValidationError("billingPeriodsLessThan3Years")
            }
        }
    }


}