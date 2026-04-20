import { afterAll, beforeAll, describe, it, expect } from "@jest/globals";
import { Server } from "../../../src/server";
import membershipStubs from "../../../src/data/memberships.json"
import membershipPeriodsStubs from "../../../src/data/membership-periods.json"


describe("Membership API", () => {

    const server = new Server()
    const port = 8001
    const userId = 2000

    beforeAll(async () => {
        await server.start(port)
    })

    afterAll(async () => {
        await server.stop()
    })

    describe("GET /memberships", () => {

        it("returns the list of memberships and their periods", async () => {
            const response = await fetch(`http://localhost:${port}/memberships`);
            const data = await response.json()
            const expectedRespose = membershipStubs.map(membership => {
                const periods = membershipPeriodsStubs.filter(period => period.membership === membership.id)
                return { membership, periods }
            })
            expect(data).toEqual(expect.arrayContaining(expectedRespose))
        })
    })

    describe("POST /memberships", () => {
        it("returns created membership", async () => {
            const requestBody = {
                name: "Test Membership",
                userId: userId,
                recurringPrice: 100,
                validFrom: "2023-01-01",
                paymentMethod: "credit card",
                billingInterval: "monthly",
                billingPeriods: 12
            }
            const response = await sendCreateMembershipRequest(requestBody)
            const data = await response.json()
            expect(data).toMatchObject({
                id: expect.any(Number),
                uuid: expect.any(String),
                state: "expired",
                assignedBy: "Admin",
                validUntil: "2024-01-01",
                ...requestBody
            })
        })

        it("includes the list of periods for the membership", async () => {
            const requestBody = {
                name: "Test Membership",
                userId: userId,
                recurringPrice: 100,
                validFrom: "2023-01-01",
                paymentMethod: "credit card",
                billingInterval: "weekly",
                billingPeriods: 1
            }
            const response = await sendCreateMembershipRequest(requestBody)
            const data = await response.json()
            expect(data.periods).toEqual([
                {
                    id: 1,
                    uuid: expect.any(String),
                    membershipId: data.id,
                    start: "2023-01-01",
                    end: "2023-01-08",
                    state: 'planned'
                }
            ])
        })

        describe("when name is missing", () => {
            it("returns status code 400", async () => {
                await assertBadRequest({
                    userId: userId,
                    recurringPrice: 100,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "weekly",
                    billingPeriods: 1
                })
            })

            it("returns error message", async () => {
                await assertErrorMessage({
                    userId: userId,
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
                    userId: userId,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "weekly",
                    billingPeriods: 1
                })
            })

            it("returns error message", async () => {
                await assertErrorMessage({
                    name: "Test Membership",
                    userId: userId,
                    validFrom: "2023-01-01",
                    paymentMethod: "credit card",
                    billingInterval: "weekly",
                    billingPeriods: 1
                }, "missingMandatoryFields")
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
})