import { describe, it, expect } from "@jest/globals";
import { MembershipService } from "../../../src/modern/services/membership-service";
import { InMemoryMembershipRepository } from "../../../src/modern/repositories/in-memory-membership-repository";
import { ValidationError } from "./validation-error";
import { BillingInterval, MembershipApplication, PaymentMethod } from "../../../src/modern/models/membership";
import { MembershipApplicationFactory } from "../factory/membership-application";
import moment from "moment";

describe("membership service", () => {

    const membershipRespoitory = new InMemoryMembershipRepository()
    const membershipService = new MembershipService(membershipRespoitory)
    const membershipApplicationFactory = new MembershipApplicationFactory()


    describe("createMembership", () => {

        it("creates a new membership containing the data from the application", async () => {
            const userId = 2000
            const membership = membershipApplicationFactory.build({ userId })
            await membershipService.createMembership(membership)
            const createdMemberships = await membershipRespoitory.getMemberships(membership.userId)
            expect(createdMemberships).toEqual([expect.objectContaining({...membership})])
        })

        it("sets assignedBy to 'Admin'", async () => {
            const membership = membershipApplicationFactory.build()
            const createdMembership = await membershipService.createMembership(membership)
            expect(createdMembership.assignedBy).toEqual("Admin")
        })

        describe("when validFrom is not provided", () => {
            it("creates a membership with validFrom set to current date", async () => {
                const membership = membershipApplicationFactory.build({ validFrom: undefined })
                const createdMembership = await membershipService.createMembership(membership)
                expect(moment(createdMembership.validFrom).isSame(moment(), "day")).toBeTruthy()
            })
        })

        describe("when billingInterval is 'weekly'", () => {
            it("sets validUntil to 'billingPeriods' weeks from now", async () => {
                const billingPeriods = 4
                const membership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Weekly, billingPeriods })
                const createdMembership = await membershipService.createMembership(membership)
                const expectedValidUntil = moment().add(billingPeriods, "weeks")
                expect(moment(createdMembership.validUntil).isSame(expectedValidUntil, "day")).toBeTruthy()
            })
        })
        
        describe("when billingInterval is 'monthly'", () => {
            it("sets validUntil to 'billingPeriods' months from now", async () => {
                const billingPeriods = 7
                const membership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods })
                const createdMembership = await membershipService.createMembership(membership)
                const expectedValidUntil = moment().add(billingPeriods, "months")
                expect(moment(createdMembership.validUntil).isSame(expectedValidUntil, "day")).toBeTruthy()
            })
        })

        describe("when billingInterval is 'yearly'", () => {
            it("sets validUntil to 'billingPeriods' years from now", async () => {
                const billingPeriods = 3
                const membership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods })
                const createdMembership = await membershipService.createMembership(membership)
                const expectedValidUntil = moment().add(billingPeriods, "years")
                expect(moment(createdMembership.validUntil).isSame(expectedValidUntil, "day")).toBeTruthy()
            })
        })

        describe("when membership will be active in the future", () => {
            it("sets state to 'pending'", async () => {
                const futureDate = moment().add(1, "month").toDate()
                const membership = membershipApplicationFactory.build({ validFrom: futureDate })
                const createdMembership = await membershipService.createMembership(membership)
                expect(createdMembership.state).toBe("pending")
            })
        })

        describe("when membership has expired", () => {
            it("sets state to 'expired'", async () => {
                const pastDate = moment().subtract(2, "weeks").toDate()
                const membership = membershipApplicationFactory.build({ validFrom: pastDate, billingInterval: BillingInterval.Weekly, billingPeriods: 1 })
                const createdMembership = await membershipService.createMembership(membership)
                expect(createdMembership.state).toBe("expired")
            })
        })

        describe("when membership is currently active", () => {
            it("sets state to 'active'", async () => {
                const membership = membershipApplicationFactory.build({ validFrom: moment().subtract(1, "day").toDate(), billingInterval: BillingInterval.Weekly, billingPeriods: 1 })
                const createdMembership = await membershipService.createMembership(membership)
                expect(createdMembership.state).toBe("active")
            })
        })


        describe("when recurringPrice is negative", () => {
            const invalidMembership = membershipApplicationFactory.build({ recurringPrice: -1 })
            it("throws an error'", async () => {
                await assertThrowsValidationError(invalidMembership, "negativeRecurringPrice")
            })
        })

        describe("when recurringPrice is greater than 100 and payment method is cash", () => {
            const invalidMembership = membershipApplicationFactory.build({ recurringPrice: 101, paymentMethod: PaymentMethod.Cash })
            it("throws an error'", async () => {
                await assertThrowsValidationError(invalidMembership, "cashPriceBelow100")
            })
        })

        describe("when billingInterval is 'monthly'", () => {
            describe("when billingPeriods is more than 12", () => {

                it("throws an error'", async () => {
                    const invalidMembership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 13 })
                    await assertThrowsValidationError(invalidMembership, "billingPeriodsMoreThan12Months")
                })
            })

            describe("when billingPerions is less than 6", () => {
                it("throws an error", async () => {
                    const invalidMembership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 5 })
                    await assertThrowsValidationError(invalidMembership, "billingPeriodsLessThan6Months")
                })
            })

            describe("when billingPeriods is between 6 and 12", () => {
                it("does not throw an error", async () => {
                    const validMembership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 6 })
                    await expect(membershipService.createMembership(validMembership)).resolves.toBeTruthy()
                })
            })
        })

        describe("when billingInterval is 'yearly'", () => {

            describe("when billingPeriods is more than 3 and less than or equal to 10", () => {
                it("throws an error", async () => {
                    const invalidMembership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 4 })
                    await assertThrowsValidationError(invalidMembership, "billingPeriodsLessThan3Years") // Confusing error message, but we want to keep it for backward compatibility
                })
            })

            describe("when billingPeriods is more than 10", () => {
                it("throws an error", async () => {
                    const invalidMembership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 11 })
                    await assertThrowsValidationError(invalidMembership, "billingPeriodsMoreThan10Years")
                })
            })

            describe("when billingPeriods is less than or equal to 3", () => {
                it("does not throw an error", async () => {
                    const validMembership = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 3 })
                    await expect(membershipService.createMembership(validMembership)).resolves.toBeTruthy()
                })
            })
        })

        async function assertThrowsValidationError(invalidMembership: MembershipApplication, expectedMessage: string) {
            await expect(membershipService.createMembership(invalidMembership)).rejects.toThrow(expectedMessage)
            await expect(membershipService.createMembership(invalidMembership)).rejects.toThrow(ValidationError)
        }
    })
})