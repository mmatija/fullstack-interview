import { Membership } from "../models/membership";
import { MembershipRepository } from "./memberships-repository";

export class InMemoryMembershipRepository implements MembershipRepository {

    private memberships: Membership[] = []

    getMemberships(userId: number): Promise<Membership[]> {
        const userMemberships = this.memberships.filter(membership => membership.userId === userId);
        return Promise.resolve(userMemberships);
    }

    async createMembership(membership: Membership): Promise<Membership> {
        this.memberships.push(membership);
        return membership;
    }
}