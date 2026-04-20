import { ValidationError } from "../../../tests/membership/service/validation-error";
import { BillingInterval, Membership, MembershipApplication as MembershipApplication, MembershipPeriod, MembershipState, StoredMembership } from "../models/membership";
import { MembershipRepository } from "../repositories/memberships-repository";
import { v4 as uuid } from 'uuid';
import moment from "moment";

export class MembershipApplicationService {

    constructor(private membershipRepository: MembershipRepository) {}

    async createMembership(membershipApplication: MembershipApplication): Promise<Membership> {
        try {
            this.validateMembership(membershipApplication)
        } catch (error) {
            return Promise.reject(error)
        }
        const now = moment()
        const validFrom = membershipApplication.validFrom ? moment(membershipApplication.validFrom) : now.clone()
        const validUntil = this.calculateValidUntil(validFrom, membershipApplication)
        const storedMembership = await this.membershipRepository.createMembership({
            uuid: uuid(),
            ...membershipApplication,
            state: this.calculateState(now, validFrom, membershipApplication),
            validFrom: validFrom.toDate(),
            validUntil,
            assignedBy: "Admin"
        })
        return {
            ...storedMembership,
            periods: this.calculatePeriods(storedMembership)
        }
    }

    private calculatePeriods(storedMembership: StoredMembership): MembershipPeriod[] {
        const periods: MembershipPeriod[] = []
        let periodStart = moment(storedMembership.validFrom)

        for (let i = 0; i < storedMembership.billingPeriods; i++) {
            const periodEnd = this.calculatePeriodEnd(periodStart, storedMembership.billingInterval)
            periods.push({
                id: i + 1,
                uuid: uuid(),
                membershipId: storedMembership.id,
                start: periodStart.toDate(),
                end: periodEnd.toDate(),
                state: "planned"
            })
            periodStart = periodEnd
        }

        return periods
    }

    private calculatePeriodEnd(periodStart: moment.Moment, billingInterval: BillingInterval): moment.Moment {
        if (billingInterval === BillingInterval.Weekly) {
            return periodStart.clone().add(1, "week")
        }
        if (billingInterval === BillingInterval.Monthly) {
            return periodStart.clone().add(1, "month")
        }
        return periodStart.clone().add(1, "year")
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