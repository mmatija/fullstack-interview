import { StoredMembership } from "../models/membership";

export interface MembershipRepository {
    createMembership(membership: Omit<StoredMembership, 'id'>): Promise<StoredMembership>
    getMemberships(userId: number): Promise<StoredMembership[]>
}