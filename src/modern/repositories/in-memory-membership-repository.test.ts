import { describe, expect, it } from "@jest/globals";
import { InMemoryMembershipRepository } from "./in-memory-membership-repository";
import { BillingInterval, Membership, MembershipState, PaymentMethod } from "../models/membership";

describe("InMemoryMembershipRepository", () => {

    const repository = new InMemoryMembershipRepository()

    describe("createMembership", () => {

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

})