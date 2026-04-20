import { Membership } from "../models/membership";

export interface MembershipRepository {
    createMembership(membership: Membership): Promise<Membership>
    getMemberships(userId: number): Promise<Membership[]>
}