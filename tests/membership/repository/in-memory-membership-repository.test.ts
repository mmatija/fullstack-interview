import { beforeEach, describe, expect, it } from "@jest/globals";
import { InMemoryMembershipRepository } from "../../../src/modern/repositories/in-memory-membership-repository";
import { BillingInterval, StoredMembership, MembershipState, PaymentMethod } from "../../../src/modern/models/membership";

describe("InMemoryMembershipRepository", () => {

    const membershipWithoutId: Omit<StoredMembership, 'id'> = {
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        name: "Platinum Plan",
        userId: 2000,
        recurringPrice: 50.0,
        validFrom: new Date("2023-01-01"),
        validUntil: new Date("2023-12-31"),
        state: MembershipState.Active,
        assignedBy: "Admin",
        paymentMethod: PaymentMethod.CreditCard,
        billingInterval: BillingInterval.Monthly,
        billingPeriods: 12
    }

    describe("createMembership", () => {
        let repository: InMemoryMembershipRepository

        beforeEach(() => {
            repository = new InMemoryMembershipRepository()
        })

        it("assigns an id to the created membership", async () => {
            const createdMembership = await repository.createMembership(membershipWithoutId)
            expect(createdMembership.id).toEqual(expect.any(Number))
        })

        it("returns the created membership with the original data", async () => {
            const createdMembership = await repository.createMembership(membershipWithoutId)
            expect(createdMembership).toMatchObject(membershipWithoutId)
        })
    })

    describe("getMemberships", () => {
        let repository: InMemoryMembershipRepository
        let membership1: StoredMembership
        let membership2: StoredMembership
        let membership3: StoredMembership

        beforeEach(async () => {
            repository = new InMemoryMembershipRepository()
            membership1 = await repository.createMembership({ ...membershipWithoutId, uuid: "uuid-1", userId: 2000 })
            membership2 = await repository.createMembership({ ...membershipWithoutId, uuid: "uuid-2", userId: 2000 })
            membership3 = await repository.createMembership({ ...membershipWithoutId, uuid: "uuid-3", userId: 3000 })
        })

        it("returns all memberships", async () => {
            const memberships = await repository.getMemberships()
            expect(memberships).toEqual([membership1, membership2, membership3])
        })

        describe("when there are no memberships", () => {

            const emptyRepository = new InMemoryMembershipRepository()

            it("returns an empty list", async () => {
                const memberships = await emptyRepository.getMemberships()
                expect(memberships).toEqual([])
            })
        })
    })
})