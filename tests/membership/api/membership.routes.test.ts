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
            expect(data).toEqual(expectedRespose)
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
            const response = await fetch(`http://localhost:${port}/memberships`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            })
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
    })
})