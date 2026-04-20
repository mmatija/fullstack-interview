import { Membership } from "../models/membership";

export interface MembershipRepository {
    createMembership(membership: Omit<Membership, 'id'>): Promise<Membership>
    getMemberships(userId: number): Promise<Membership[]>
}