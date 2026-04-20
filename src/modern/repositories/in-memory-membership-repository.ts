import { Membership } from "../models/membership";
import { MembershipRepository } from "./memberships-repository";

export class InMemoryMembershipRepository implements MembershipRepository {

    async createMembership(membership: Membership): Promise<Membership> {
        return membership;
    }
}