import { beforeAll, describe, expect, it } from "@jest/globals";
import { InMemoryMembershipRepository } from "../../../src/modern/repositories/in-memory-membership-repository";
import { BillingInterval, Membership, MembershipState, PaymentMethod } from "../../../src/modern/models/membership";
import { MembershipFactory } from "../factory/membership";

describe("InMemoryMembershipRepository", () => {


    describe("createMembership", () => {
        const repository = new InMemoryMembershipRepository()

        it("returns created membership", async () => {
            const membership: Membership = {
                id: 1,
                uuid: "123e4567-e89b-12d3-a456-426614174000",
                name: "Platinum Plan",
                userId: 2000,
                recurringPrice: 150.0,
                validFrom: new Date("2023-01-01"),
                validUntil: new Date("2023-12-31"),
                state: MembershipState.Active,
                assignedBy: "Admin",
                paymentMethod: PaymentMethod.CreditCard,
                billingInterval: BillingInterval.Monthly,
                billingPeriods: 12
            }
            const createdMembership = await repository.createMembership(membership)
            expect(createdMembership).toEqual(membership)
        })

    })

    describe("getMemberships", () => {
        const repository = new InMemoryMembershipRepository()
        const membershipFactory = new MembershipFactory()
        const userId = 2000
        const membership1 = membershipFactory.build({ id: 1, userId })

        const membership2 = membershipFactory.build({ id: 2, userId })
        
        const membership3 = membershipFactory.build({ id: 3, userId: 3000 })

        beforeAll(async () => {
            await repository.createMembership(membership1)
            await repository.createMembership(membership2)
        })

        it("returns the list of all memberships for given user id", async () => {
            const memberships = await repository.getMemberships(userId)
            expect(memberships).toEqual([membership1, membership2])
        })

        describe("when there are no memberships for given user id", () => {
            it("returns an empty list", async () => {
                const memberships = await repository.getMemberships(9999)
                expect(memberships).toEqual([])
            })
        })
    })
})