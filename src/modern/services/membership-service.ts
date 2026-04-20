import { Membership } from "../models/membership";
import { MembershipRepository } from "../repositories/memberships-repository";

export class MembershipService {

    constructor(private membershipRepository: MembershipRepository) {}

    createMembership(membership: Membership): Promise<Membership> {
        return this.membershipRepository.createMembership(membership)
    }

}