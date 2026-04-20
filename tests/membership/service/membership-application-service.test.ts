import { describe, it, expect } from "@jest/globals";
import { MembershipApplicationService } from "../../../src/modern/services/membership-application-service";
import { InMemoryMembershipRepository } from "../../../src/modern/repositories/in-memory-membership-repository";
import { ValidationError } from "../../../src/modern/services/validation-error";
import { BillingInterval, MembershipApplication, PaymentMethod } from "../../../src/modern/models/membership";
import { MembershipApplicationFactory } from "../factory/membership-application";
import moment from "moment";

describe("membership application service", () => {

    const membershipRespoitory = new InMemoryMembershipRepository()
    const membershipApplicationService = new MembershipApplicationService(membershipRespoitory)
    const membershipApplicationFactory = new MembershipApplicationFactory()


    describe("createMembership", () => {

        it("creates a new membership containing the data from the application", async () => {
            const membershipApplication = membershipApplicationFactory.build()
            const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
            const allMemberships = await membershipRespoitory.getMemberships()
            expect(allMemberships).toContainEqual(expect.objectContaining({...membershipApplication}))
        })

        it("sets assignedBy to 'Admin'", async () => {
            const membershipApplication = membershipApplicationFactory.build()
            const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
            expect(createdMembership.assignedBy).toEqual("Admin")
        })

        it("returns the list of all periods for membership", async () => {
            const validFrom = moment().toDate()
            const membershipApplication = membershipApplicationFactory.build({ validFrom: validFrom, billingInterval: BillingInterval.Yearly, billingPeriods: 2 })
            const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
            expect(createdMembership.periods).toEqual([
                {
                    id: 1,
                    uuid: expect.any(String),
                    membershipId: createdMembership.id,
                    start: validFrom,
                    end: moment(validFrom).add(1, "year").toDate(),
                    state: 'planned'
                },{
                    id: 2,
                    uuid: expect.any(String),
                    membershipId: createdMembership.id,
                    start: moment(validFrom).add(1, "year").toDate(),
                    end: moment(validFrom).add(2, "years").toDate(),
                    state: 'planned'
                }
            ])
        })

        describe("when validFrom is not provided", () => {
            it("creates a membership with validFrom set to current date", async () => {
                const membershipApplication = membershipApplicationFactory.build({ validFrom: undefined })
                const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
                expect(moment(createdMembership.validFrom).isSame(moment(), "day")).toBeTruthy()
            })
        })

        describe("when billingInterval is 'monthly'", () => {
            it("sets validUntil to 'billingPeriods' months from validFrom", async () => {
                const billingPeriods = 7
                const validFrom = new Date("2023-01-01")
                const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods, validFrom })
                const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
                const expectedValidUntil = moment(validFrom).add(billingPeriods, "months")
                expect(moment(createdMembership.validUntil).isSame(expectedValidUntil, "day")).toBeTruthy()
            })
        })

        describe("when billingInterval is 'yearly'", () => {
            it("sets validUntil to 'billingPeriods' years from validFrom", async () => {
                const billingPeriods = 3
                const validFrom = new Date("2023-01-01")
                const membershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods, validFrom })
                const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
                const expectedValidUntil = moment(validFrom).add(billingPeriods, "years")
                expect(moment(createdMembership.validUntil).isSame(expectedValidUntil, "day")).toBeTruthy()
            })
        })

        describe("when membership will be active in the future", () => {
            it("sets state to 'pending'", async () => {
                const futureDate = moment().add(1, "month").toDate()
                const membershipApplication = membershipApplicationFactory.build({ validFrom: futureDate })
                const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
                expect(createdMembership.state).toBe("pending")
            })
        })

        describe("when membership has expired", () => {
            it("sets state to 'expired'", async () => {
                const pastDate = moment().subtract(2, "years").toDate()
                const membershipApplication = membershipApplicationFactory.build({ validFrom: pastDate, billingInterval: BillingInterval.Yearly, billingPeriods: 1 })
                const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
                expect(createdMembership.state).toBe("expired")
            })
        })

        describe("when membership is currently active", () => {
            it("sets state to 'active'", async () => {
                const membershipApplication = membershipApplicationFactory.build({ validFrom: moment().subtract(1, "day").toDate(), billingInterval: BillingInterval.Yearly, billingPeriods: 1 })
                const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
                expect(createdMembership.state).toBe("active")
            })
        })


        describe("when recurringPrice is negative", () => {
            const invalidMembershipApplication = membershipApplicationFactory.build({ recurringPrice: -1 })
            it("throws an error'", async () => {
                await assertThrowsValidationError(invalidMembershipApplication, "negativeRecurringPrice")
            })
        })

        describe("when recurringPrice is greater than 100 and payment method is cash", () => {
            const invalidMembershipApplication = membershipApplicationFactory.build({ recurringPrice: 101, paymentMethod: PaymentMethod.Cash })
            it("throws an error'", async () => {
                await assertThrowsValidationError(invalidMembershipApplication, "cashPriceBelow100")
            })
        })

        describe("when billingInterval is 'monthly'", () => {
            describe("when billingPeriods is more than 12", () => {

                it("throws an error'", async () => {
                    const invalidMembershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 13 })
                    await assertThrowsValidationError(invalidMembershipApplication, "billingPeriodsMoreThan12Months")
                })
            })

            describe("when billingPerions is less than 6", () => {
                it("throws an error", async () => {
                    const invalidMembershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 5 })
                    await assertThrowsValidationError(invalidMembershipApplication, "billingPeriodsLessThan6Months")
                })
            })

            describe("when billingPeriods is between 6 and 12", () => {
                it("does not throw an error", async () => {
                    const validMembershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Monthly, billingPeriods: 6 })
                    await expect(membershipApplicationService.createMembership(validMembershipApplication)).resolves.toBeTruthy()
                })
            })
        })

        describe("when billingInterval is 'yearly'", () => {

            describe("when billingPeriods is more than 3 and less than or equal to 10", () => {
                it("throws an error", async () => {
                    const invalidMembershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 4 })
                    await assertThrowsValidationError(invalidMembershipApplication, "billingPeriodsLessThan3Years") // Confusing error message, but we want to keep it for backward compatibility
                })
            })

            describe("when billingPeriods is more than 10", () => {
                it("throws an error", async () => {
                    const invalidMembershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 11 })
                    await assertThrowsValidationError(invalidMembershipApplication, "billingPeriodsMoreThan10Years")
                })
            })

            describe("when billingPeriods is less than or equal to 3", () => {
                it("does not throw an error", async () => {
                    const validMembershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Yearly, billingPeriods: 3 })
                    await expect(membershipApplicationService.createMembership(validMembershipApplication)).resolves.toBeTruthy()
                })
            })
        })

        describe("when billing interval is neither monthly nor yearly", () => {
            it("throws an error", async () => {
                const invalidMembershipApplication = membershipApplicationFactory.build({ billingInterval: BillingInterval.Weekly, billingPeriods: 5 })
                await assertThrowsValidationError(invalidMembershipApplication, "invalidBillingPeriods")
            })
        })

        async function assertThrowsValidationError(invalidMembershipApplication: MembershipApplication, expectedMessage: string) {
            await expect(membershipApplicationService.createMembership(invalidMembershipApplication)).rejects.toThrow(expectedMessage)
            await expect(membershipApplicationService.createMembership(invalidMembershipApplication)).rejects.toThrow(ValidationError)
        }
    })
})