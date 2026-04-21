import { describe, it, expect, beforeEach } from "@jest/globals";
import { MembershipApplicationService } from "../../../src/modern/services/membership-application-service";
import { InMemoryMembershipRepository } from "../../../src/modern/repositories/in-memory-membership-repository";
import { ValidationError } from "../../../src/modern/services/validation-error";
import { BillingInterval } from "../../../src/modern/models/membership";
import { MembershipApplicationFactory } from "../factory/membership-application";
import { MembershipApplicationValidator } from "../../../src/modern/services/membership-application-validator";
import moment from "moment";

describe("membership application service", () => {

    let membershipRepository: InMemoryMembershipRepository;
    let membershipApplicationService: MembershipApplicationService;
    let membershipApplicationFactory: MembershipApplicationFactory;
    let stubValidator: MembershipApplicationValidator;

    beforeEach(() => {
        membershipRepository = new InMemoryMembershipRepository()
        stubValidator = { validate: () => [] }
        membershipApplicationService = new MembershipApplicationService(membershipRepository, stubValidator)
        membershipApplicationFactory = new MembershipApplicationFactory()
    })

    describe("createMembership", () => {

        it("creates a new membership containing the data from the application", async () => {
            const membershipApplication = membershipApplicationFactory.build()
            const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
            const allMemberships = await membershipRepository.getMemberships()
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


        describe("when the validator returns validation errors", () => {
            it("throws the first validation error", async () => {
                const firstError = new ValidationError("negativeRecurringPrice")
                const secondError = new ValidationError("cashPriceBelow100")
                stubValidator.validate = () => [firstError, secondError]
                const membershipApplication = membershipApplicationFactory.build()
                await expect(membershipApplicationService.createMembership(membershipApplication)).rejects.toThrow(firstError)
            })
        })
    })

    describe("getMemberships", () => {
        it("returns all memberships with their periods", async () => {
            const membershipApplication = membershipApplicationFactory.build({ validFrom: moment().toDate(), billingInterval: BillingInterval.Yearly, billingPeriods: 2 })
            const createdMembership = await membershipApplicationService.createMembership(membershipApplication)
            const memberships = await membershipApplicationService.getMemberships()
            expect(memberships).toContainEqual(expect.objectContaining({
                ...createdMembership,
                periods: [
                    expect.objectContaining({
                        membershipId: createdMembership.id,
                        start: createdMembership.validFrom,
                        end: moment(createdMembership.validFrom).add(1, "year").toDate(),
                        state: 'planned'
                    }),
                    expect.objectContaining({
                        membershipId: createdMembership.id,
                        start: moment(createdMembership.validFrom).add(1, "year").toDate(),
                        end: moment(createdMembership.validFrom).add(2, "years").toDate(),
                        state: 'planned'
                    })
                ]
            }))
        })
    })
})