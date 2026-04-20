import { afterAll, beforeAll, describe, it, expect } from "@jest/globals";
import { Server } from "../../../src/server";
import membershipStubs from "../../../src/data/memberships.json"
import membershipPeriodsStubs from "../../../src/data/membership-periods.json"


describe("Get Memberships", () => {

    const server = new Server()
    const port = 8001

    beforeAll(async () => {
        await server.start(port)
    })

    afterAll(async () => {
        await server.stop()
    })

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