import { ValidationError } from "../../../tests/membership/service/validation-error";
import { BillingInterval, Membership, MembershipApplication as MembershipApplication, MembershipState } from "../models/membership";
import { MembershipRepository } from "../repositories/memberships-repository";
import { v4 as uuid } from 'uuid';
import moment from "moment";

export class MembershipService {

    constructor(private membershipRepository: MembershipRepository) {}

    createMembership(membershipApplication: MembershipApplication): Promise<Membership> {
        try {
            this.validateMembership(membershipApplication)
        } catch (error) {
            return Promise.reject(error)
        }
        const now = moment()
        const validFrom = membershipApplication.validFrom ? moment(membershipApplication.validFrom) : now.clone()
        const validUntil = this.calculateValidUntil(now, membershipApplication)
        const membership = {
            id: 0,
            uuid: uuid(),
            ...membershipApplication,
            state: this.calculateState(now, validFrom, membershipApplication),
            validFrom: validFrom.toDate(),
            validUntil,
            assignedBy: "Admin"
        }
        return this.membershipRepository.createMembership(membership)
    }

    private calculateState(currentDate: moment.Moment, validFrom: moment.Moment, membershipRequest: MembershipApplication): MembershipState {
        const membershipValidUntil = this.calculateValidUntil(validFrom, membershipRequest)
        if (validFrom.isAfter(currentDate)) {
            return MembershipState.Pending
        }
        if (validFrom.isBefore(currentDate) && moment(membershipValidUntil).isBefore(currentDate)) {
            return MembershipState.Expired
        }

        return MembershipState.Active
    }

    private calculateValidUntil(currentDate: moment.Moment, membershipRequest: MembershipApplication): Date {
        if (membershipRequest.billingInterval === BillingInterval.Weekly) {
            return currentDate.clone().add(membershipRequest.billingPeriods, "weeks").toDate()
        } else if (membershipRequest.billingInterval === BillingInterval.Monthly) {
            return currentDate.clone().add(membershipRequest.billingPeriods, "months").toDate()
        } else {
            return currentDate.clone().add(membershipRequest.billingPeriods, "years").toDate()
        }
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