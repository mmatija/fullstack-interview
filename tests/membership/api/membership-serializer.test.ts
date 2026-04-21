import { describe, it, expect } from "@jest/globals";
import { MembershipSerializer } from "../../../src/modern/routes/membership-serializer";
import { BillingInterval, Membership, MembershipState, PaymentMethod } from "../../../src/modern/models/membership";

describe("MembershipSerializer", () => {

    const serializer = new MembershipSerializer()

    const membership: Membership = {
        id: 1,
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Membership",
        userId: 1,
        recurringPrice: 100,
        validFrom: new Date("2023-01-01T00:00:00.000Z"),
        validUntil: new Date("2024-01-01T00:00:00.000Z"),
        state: MembershipState.Expired,
        assignedBy: "Admin",
        paymentMethod: PaymentMethod.CreditCard,
        billingInterval: BillingInterval.Yearly,
        billingPeriods: 1,
        periods: [
            {
                id: 1,
                uuid: "456e7890-e89b-12d3-a456-426614174001",
                membershipId: 1,
                start: new Date("2023-01-01T00:00:00.000Z"),
                end: new Date("2024-01-01T00:00:00.000Z"),
                state: "planned"
            }
        ]
    }

    describe("serialize", () => {

        it("separates membership fields and periods into distinct keys", () => {
            const result = serializer.serialize(membership)
            expect(result).toMatchObject({
                membership: expect.any(Object),
                periods: expect.any(Array)
            })
        })

        it("formats validFrom as YYYY-MM-DD", () => {
            const result = serializer.serialize(membership)
            expect(result.membership.validFrom).toEqual("2023-01-01")
        })

        it("formats validUntil as YYYY-MM-DD", () => {
            const result = serializer.serialize(membership)
            expect(result.membership.validUntil).toEqual("2024-01-01")
        })

        it("passes through remaining membership fields unchanged", () => {
            const result = serializer.serialize(membership)
            expect(result.membership).toMatchObject({
                id: membership.id,
                uuid: membership.uuid,
                name: membership.name,
                userId: membership.userId,
                recurringPrice: membership.recurringPrice,
                state: membership.state,
                assignedBy: membership.assignedBy,
                paymentMethod: membership.paymentMethod,
                billingInterval: membership.billingInterval,
                billingPeriods: membership.billingPeriods,
            })
        })

        it("formats period start as YYYY-MM-DD", () => {
            const result = serializer.serialize(membership)
            expect(result.periods[0].start).toEqual("2023-01-01")
        })

        it("formats period end as YYYY-MM-DD", () => {
            const result = serializer.serialize(membership)
            expect(result.periods[0].end).toEqual("2024-01-01")
        })

        it("passes through remaining period fields unchanged", () => {
            const result = serializer.serialize(membership)
            expect(result.periods[0]).toMatchObject({
                id: 1,
                uuid: "456e7890-e89b-12d3-a456-426614174001",
                membershipId: 1,
                state: "planned"
            })
        })
    })
})
