import { StoredMembership } from "../models/membership";
import { MembershipRepository } from "./memberships-repository";

export class InMemoryMembershipRepository implements MembershipRepository {

    private memberships: StoredMembership[] = []
    private nextId = 1

    getMemberships(): Promise<StoredMembership[]> {
        return Promise.resolve([...this.memberships]);
    }

    async createMembership(membership: Omit<StoredMembership, 'id'>): Promise<StoredMembership> {
        const stored = { ...membership, id: this.nextId++ }
        this.memberships.push(stored);
        return stored;
    }
}