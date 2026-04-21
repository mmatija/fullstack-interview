import { BillingInterval, Membership, MembershipApplication as MembershipApplication, MembershipPeriod, MembershipState, StoredMembership } from "../models/membership";
import { MembershipRepository } from "../repositories/memberships-repository";
import { MembershipApplicationValidator } from "./membership-application-validator";
import { v4 as uuid } from 'uuid';
import moment from "moment";

export class MembershipApplicationService {

    constructor(
        private membershipRepository: MembershipRepository,
        private membershipApplicationValidator: MembershipApplicationValidator
    ) {}

    async getMemberships(): Promise<Membership[]> {
        const storedMemberships = await this.membershipRepository.getMemberships()
        return storedMemberships.map(stored => ({
            ...stored,
            periods: this.calculatePeriods(stored)
        }))
    }

    async createMembership(membershipApplication: MembershipApplication): Promise<Membership> {
        const errors = this.membershipApplicationValidator.validate(membershipApplication)
        if (errors.length > 0) {
            return Promise.reject(errors[0])
        }
        const now = moment()
        const validFrom = membershipApplication.validFrom ? moment.utc(membershipApplication.validFrom) : now.clone()
        const validUntil = this.calculateValidUntil(validFrom, membershipApplication.billingInterval, membershipApplication.billingPeriods)
        const storedMembership = await this.membershipRepository.createMembership({
            ...membershipApplication,
            uuid: uuid(),
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
        let periodStart = moment.utc(storedMembership.validFrom)

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
        const membershipValidUntil = this.calculateValidUntil(validFrom, membershipRequest.billingInterval, membershipRequest.billingPeriods)
        if (validFrom.isAfter(currentDate)) {
            return MembershipState.Pending
        }
        if (validFrom.isBefore(currentDate) && moment(membershipValidUntil).isBefore(currentDate)) {
            return MembershipState.Expired
        }

        return MembershipState.Active
    }

    private calculateValidUntil(validFrom: moment.Moment, billingInterval: BillingInterval, billingPeriods: number): Date {
        if (billingInterval === BillingInterval.Weekly) {
            return validFrom.clone().add(billingPeriods, "weeks").toDate()
        } else if (billingInterval === BillingInterval.Monthly) {
            return validFrom.clone().add(billingPeriods, "months").toDate()
        } else {
            return validFrom.clone().add(billingPeriods, "years").toDate()
        }
    }
}
