import { afterAll, beforeAll, describe, it, expect } from "@jest/globals";
import { Server } from "../../../src/server";

describe("Membership API", () => {

    const server = new Server()
    const port = 8001

    beforeAll(async () => {
        await server.start(port)
    })

    afterAll(async () => {
        await server.stop()
    })

    describe("GET /memberships", () => {

        const membership1 = {
            name: "Test Membership 1",
            userId: 1,
            recurringPrice: 100,
            validFrom: "2023-01-01",
            paymentMethod: "credit card",
            billingInterval: "yearly",
            billingPeriods: 1
        }
        const membership2 = {
            name: "Test Membership 2",
            userId: 2,
            recurringPrice: 100,
            validFrom: "2025-01-01",
            paymentMethod: "credit card",
            billingInterval: "yearly",
            billingPeriods: 1
        }
        beforeAll(async () => {
            await sendCreateMembershipRequest(membership1)
            await sendCreateMembershipRequest(membership2)
        })

        it("returns the list of memberships and their periods", async () => {
            const response = await fetch(`http://localhost:${port}/memberships`);
            const data = await response.json()
            expect(data).toEqual(expect.arrayContaining([
                {
                    membership: expect.objectContaining({
                        name: membership1.name,
                        userId: membership1.userId,
                        recurringPrice: membership1.recurringPrice,
                        paymentMethod: membership1.paymentMethod,
                        billingInterval: membership1.billingInterval,
                        billingPeriods: membership1.billingPeriods,
                    }),
                    periods: expect.arrayContaining([expect.objectContaining({
                        id: expect.any(Number),
                        uuid: expect.any(String),
                        membershipId: expect.any(Number),
                        start: "2023-01-01",
                        end: "2024-01-01",
                        state: "planned"
                    })])
                },
                {
                    membership: expect.objectContaining({
                        name: membership2.name,
                        userId: membership2.userId,
                        recurringPrice: membership2.recurringPrice,
                        paymentMethod: membership2.paymentMethod,
                        billingInterval: membership2.billingInterval,
                        billingPeriods: membership2.billingPeriods,
                    }),
                    periods: expect.arrayContaining([expect.objectContaining({
                        id: expect.any(Number),
                        uuid: expect.any(String),
                        membershipId: expect.any(Number),
                        start: "2025-01-01",
                        end: "2026-01-01",
                        state: "planned"
                    })])
                }
            ]))
        })
    })

    describe("POST /memberships", () => {

        it("returns status code 201", async () => {
            const response = await sendCreateMembershipRequest({
                name: "Test Membership",
                userId: 1,
                recurringPrice: 100,
                validFrom: "2023-01-01",
                paymentMethod: "credit card",
                billingInterval: "yearly",
                billingPeriods: 1
            })
            expect(response.status).toEqual(201)
        })

        it("returns created membership and their periods", async () => {
            const requestBody = {
                name: "Test Membership",
                userId: 1,
                recurringPrice: 100,
                validFrom: "2023-01-01",
                paymentMethod: "credit card",
                billingInterval: "yearly",
                billingPeriods: 1
            }
            const response = await sendCreateMembershipRequest(requestBody)
            const data = await response.json()
            expect(data).toMatchObject({
                membership: {
                    id: expect.any(Number),
                    uuid: expect.any(String),
                    state: "expired",
                    assignedBy: "Admin",
                    validUntil: "2024-01-01",
                    ...requestBody
                },
                periods: [{
                    id: 1,
                    uuid: expect.any(String),
                    membershipId: data.membership.id,
                    start: "2023-01-01",
                    end: "2024-01-01",
                    state: 'planned'
                }]
            })
        })

        describe("when name is missing", () => {
            it("returns status code 400", async () => {
                await assertBadRequest({
                    userId: 1,
                    recurringPrice: 100,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "yearly",
                    billingPeriods: 1
                })
            })

            it("returns error message", async () => {
                await assertErrorMessage({
                    userId: 1,
                    recurringPrice: 100,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "weekly",
                    billingPeriods: 1
                }, "missingMandatoryFields")
            })
        })

        describe("when recurringPrice is missing", () => {
            it("returns status code 400", async () => {
                await assertBadRequest({
                    name: "Test Membership",
                    userId: 1,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "weekly",
                    billingPeriods: 1
                })
            })

            it("returns error message", async () => {
                await assertErrorMessage({
                    name: "Test Membership",
                    userId: 1,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "weekly",
                    billingPeriods: 1
                }, "missingMandatoryFields")
            })
        })

        describe("when there is a validation error", () => {
            it("returns status code 400", async () => {
                await assertBadRequest({
                    name: "Test Membership",
                    userId: 1,
                    recurringPrice: 100,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "weekly",
                })
            })

            it("returns error message", async () => {
                await assertErrorMessage({
                    name: "Test Membership",
                    userId: 1,
                    recurringPrice: 100,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "weekly",
                }, "invalidBillingPeriods")
            })
        })

        async function assertBadRequest(requestBody: object) {
            const response = await sendCreateMembershipRequest(requestBody)
            expect(response.status).toEqual(400)
        }

        async function assertErrorMessage(requestBody: object, expectedMessage: string) {
            const response = await sendCreateMembershipRequest(requestBody)
            const data = await response.json()
            expect(data).toEqual({ message: expectedMessage })
        }
    })

    async function sendCreateMembershipRequest(requestBody: object) {
        return await fetch(`http://localhost:${port}/memberships`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })
    }
})