import { ValidationError } from "../../../tests/membership/service/validation-error";
import { BillingInterval, Membership, MembershipApplication as MembershipApplication, MembershipState } from "../models/membership";
import { MembershipRepository } from "../repositories/memberships-repository";
import { v4 as uuid } from 'uuid';

export class MembershipService {

    constructor(private membershipRepository: MembershipRepository) {}

    createMembership(membershipApplication: MembershipApplication): Promise<Membership> {
        try {
            this.validateMembership(membershipApplication)
        } catch (error) {
            return Promise.reject(error)
        }
        const membership = {
            id: 0,
            uuid: uuid(),
            state: MembershipState.Active,
            validFrom: membershipApplication.validFrom ? membershipApplication.validFrom : new Date(),
            validUntil: new Date(),
            assignedBy: "Admin",
            ...membershipApplication
        }
        return this.membershipRepository.createMembership(membership)
    }

    private validateMembership(membershipRequest: MembershipApplication): void {
        if (membershipRequest.recurringPrice < 0) {
            throw new ValidationError("negativeRecurringPrice")
        }
        if (membershipRequest.paymentMethod === "cash" && membershipRequest.recurringPrice > 100) {
            throw new ValidationError("cashPriceBelow100")
        }
        if (membershipRequest.billingInterval == BillingInterval.Monthly) {
            if (membershipRequest.billingPeriods > 12) {
                throw new ValidationError("billingPeriodsMoreThan12Months")
            }
            if (membershipRequest.billingPeriods < 6) {
                throw new ValidationError("billingPeriodsLessThan6Months")
            }
        } else if (membershipRequest.billingInterval == BillingInterval.Yearly) {
            if (membershipRequest.billingPeriods > 3) {
                if (membershipRequest.billingPeriods > 10) {
                    throw new ValidationError("billingPeriodsMoreThan10Years")
                }
                throw new ValidationError("billingPeriodsLessThan3Years")
            }
        }
    }


}