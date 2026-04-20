import { StoredMembership } from "../models/membership";
import { MembershipRepository } from "./memberships-repository";

export class InMemoryMembershipRepository implements MembershipRepository {

    private memberships: StoredMembership[] = []
    private nextId = 1

    getMemberships(userId: number): Promise<StoredMembership[]> {
        const userMemberships = this.memberships.filter(membership => membership.userId === userId);
        return Promise.resolve(userMemberships);
    }

    async createMembership(membership: Omit<StoredMembership, 'id'>): Promise<StoredMembership> {
        const stored = { ...membership, id: this.nextId++ }
        this.memberships.push(stored);
        return stored;
    }
}