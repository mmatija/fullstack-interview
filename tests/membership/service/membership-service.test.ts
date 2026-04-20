import { describe, it, expect } from "@jest/globals";
import { MembershipService } from "../../../src/modern/services/membership-service";
import { MembershipFactory } from "../factory/membership";
import { InMemoryMembershipRepository } from "../../../src/modern/repositories/in-memory-membership-repository";
import { ValidationError } from "./validation-error";
import { BillingInterval, Membership, PaymentMethod } from "../../../src/modern/models/membership";

describe("membership service", () => {

    const membershipRespoitory = new InMemoryMembershipRepository
    const membershipService = new MembershipService(membershipRespoitory)
    const membershipFactory = new MembershipFactory()


    describe("createMembership", () => {

        it("creates a new membership", async () => {
            const userId = 2000
            const membership = membershipFactory.build({ userId })
            await membershipService.createMembership(membership)
            const createdMemberships = await membershipRespoitory.getMemberships(membership.userId)
            expect(createdMemberships).toEqual([membership])
        })

        describe("when recurringPrice is negative", () => {
            const invalidMembership = membershipFactory.build({ recurringPrice: -1 })
            it("throws an error'", async () => {
                await assertThrowsValidationError(invalidMembership, "negativeRecurringPrice")
            })
        })

        describe("when recurringPrice is greater than 100 and payment method is cash", () => {
            const invalidMembership = membershipFactory.build({ recurringPrice: 101, paymentMethod: PaymentMethod.Cash })
            it("throws an error'", async () => {
                await assertThrowsValidationError(invalidMembership, "cashPriceBelow100")
            })
        })

        describe("when billingInterval is 'monthly'", () => {
            describe("when billingPeriods is more than 12", () => {

                it("throws an error'", async () => {
                    const invalidMembership = membershipFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 13 })
                    await assertThrowsValidationError(invalidMembership, "billingPeriodsMoreThan12Months")
                })
            })

            describe("when billingPerions is less than 6", () => {
                it("throws an error", async () => {
                    const invalidMembership = membershipFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 5 })
                    await assertThrowsValidationError(invalidMembership, "billingPeriodsLessThan6Months")
                })
            })

            describe("when billingPeriods is between 6 and 12", () => {
                it("does not throw an error", async () => {
                    const validMembership = membershipFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 6 })
                    await expect(membershipService.createMembership(validMembership)).resolves
                })
            })
        })

        describe("when billingInterval is 'yearly'", () => {

            describe("when billingPeriods is more than 3 and less than or equal to 10", () => {
                it("throws an error", async () => {
                    const invalidMembership = membershipFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 4 })
                    await assertThrowsValidationError(invalidMembership, "billingPeriodsLessThan3Years") // Confusing error message, but we want to keep it for backward compatibility
                })
            })

            describe("when billingPeriods is more than 10", () => {
                it("throws an error", async () => {
                    const invalidMembership = membershipFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 11 })
                    await assertThrowsValidationError(invalidMembership, "billingPeriodsMoreThan10Years")
                })
            })

            describe("when billingPeriods is less than or equal to 3", () => {
                it("does not throw an error", async () => {
                    const validMembership = membershipFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 3 })
                    await expect(membershipService.createMembership(validMembership)).resolves
                })
            })
        })

        async function assertThrowsValidationError(invalidMembership: Membership, expectedMessage: string) {
            await expect(membershipService.createMembership(invalidMembership)).rejects.toThrow(expectedMessage)
            await expect(membershipService.createMembership(invalidMembership)).rejects.toThrow(ValidationError)
        }
    })
})