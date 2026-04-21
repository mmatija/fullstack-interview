import { describe, it, expect, beforeEach } from "@jest/globals";
import { LegacyMembershipApplicationValidator } from "../../../src/modern/services/legacy-membership-application-validator";
import { ValidationError } from "../../../src/modern/services/validation-error";
import { BillingInterval, MembershipApplication, PaymentMethod } from "../../../src/modern/models/membership";
import { MembershipApplicationFactory } from "../factory/membership-application";

describe("LegacyMembershipApplicationValidator", () => {

    let validator: LegacyMembershipApplicationValidator;
    let membershipApplicationFactory: MembershipApplicationFactory;

    beforeEach(() => {
        validator = new LegacyMembershipApplicationValidator()
        membershipApplicationFactory = new MembershipApplicationFactory()
    })

    function assertReturnsValidationError(membershipApplication: MembershipApplication, expectedMessage: string) {
        const errors = validator.validate(membershipApplication)
        expect(errors).toContainEqual(expect.objectContaining({ message: expectedMessage }))
        expect(errors.some(e => e instanceof ValidationError)).toBe(true)
    }

    describe("when recurringPrice is negative", () => {
        it("returns a negativeRecurringPrice error", () => {
            const membershipApplication = membershipApplicationFactory.build({ recurringPrice: -1 })
            assertReturnsValidationError(membershipApplication, "negativeRecurringPrice")
        })
    })

    describe("when recurringPrice is greater than 100 and payment method is cash", () => {
        it("returns a cashPriceBelow100 error", () => {
            const membershipApplication = membershipApplicationFactory.build({ recurringPrice: 101, paymentMethod: PaymentMethod.Cash })
            assertReturnsValidationError(membershipApplication, "cashPriceBelow100")
        })
    })

    describe("when billingInterval is 'monthly'", () => {
        describe("when billingPeriods is more than 12", () => {
            it("returns a billingPeriodsMoreThan12Months error", () => {
                const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 13 })
                assertReturnsValidationError(membershipApplication, "billingPeriodsMoreThan12Months")
            })
        })

        describe("when billingPeriods is less than 6", () => {
            it("returns a billingPeriodsLessThan6Months error", () => {
                const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 5 })
                assertReturnsValidationError(membershipApplication, "billingPeriodsLessThan6Months")
            })
        })

        describe("when billingPeriods is between 6 and 12", () => {
            it("returns no errors", () => {
                const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 6 })
                expect(validator.validate(membershipApplication)).toHaveLength(0)
            })
        })
    })

    describe("when billingInterval is 'yearly'", () => {
        describe("when billingPeriods is more than 3 and less than or equal to 10", () => {
            it("returns a billingPeriodsLessThan3Years error", () => {
                const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 4 })
                assertReturnsValidationError(membershipApplication, "billingPeriodsLessThan3Years") // Confusing error message, but we want to keep it for backward compatibility
            })
        })

        describe("when billingPeriods is more than 10", () => {
            it("returns a billingPeriodsMoreThan10Years error", () => {
                const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 11 })
                assertReturnsValidationError(membershipApplication, "billingPeriodsMoreThan10Years")
            })
        })

        describe("when billingPeriods is less than or equal to 3", () => {
            it("returns no errors", () => {
                const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 3 })
                expect(validator.validate(membershipApplication)).toHaveLength(0)
            })
        })
    })

    describe("when billing interval is neither monthly nor yearly", () => {
        it("returns an invalidBillingPeriods error", () => {
            const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Weekly, billingPeriods: 5 })
            assertReturnsValidationError(membershipApplication, "invalidBillingPeriods")
        })
    })
})
