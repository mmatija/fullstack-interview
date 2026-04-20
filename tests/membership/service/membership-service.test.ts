import { describe, it, expect } from "@jest/globals";
import { MembershipService } from "../../../src/modern/services/membership-service";
import { MembershipFactory } from "../factory/membership";
import { InMemoryMembershipRepository } from "../../../src/modern/repositories/in-memory-membership-repository";

describe("membership service", () => {

    const membershipRespoitory = new InMemoryMembershipRepository
    const membershipService = new MembershipService(membershipRespoitory)
    const membershipFactory = new MembershipFactory()
    

    describe("createMembership", () => {

        const userId = 2000
        const membership = membershipFactory.build({ userId })

        it("creates a new membership", async () => {
            await membershipService.createMembership(membership)
            const createdMemberships = await membershipRespoitory.getMemberships(membership.userId)
            expect(createdMemberships).toEqual([membership])
        })
    })

})