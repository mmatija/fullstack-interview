import { MembershipApplication } from "../models/membership";
import { ValidationError } from "./validation-error";

export interface MembershipApplicationValidator {
    validate(membershipApplication: MembershipApplication): ValidationError[];
}
