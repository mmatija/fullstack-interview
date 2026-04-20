import { Membership } from "../models/membership";
import { MembershipRepository } from "./memberships-repository";

export class InMemoryMembershipRepository implements MembershipRepository {

    private memberships: Membership[] = []
    private nextId = 1

    getMemberships(userId: number): Promise<Membership[]> {
        const userMemberships = this.memberships.filter(membership => membership.userId === userId);
        return Promise.resolve(userMemberships);
    }

    async createMembership(membership: Omit<Membership, 'id'>): Promise<Membership> {
        const stored = { ...membership, id: this.nextId++ }
        this.memberships.push(stored);
        return stored;
    }
}