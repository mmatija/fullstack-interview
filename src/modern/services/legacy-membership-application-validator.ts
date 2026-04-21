import { BillingInterval, MembershipApplication } from "../models/membership";
import { MembershipApplicationValidator } from "./membership-application-validator";
import { ValidationError } from "./validation-error";

export class LegacyMembershipApplicationValidator implements MembershipApplicationValidator {

    validate(membershipApplication: MembershipApplication): ValidationError[] {
        const errors: ValidationError[] = []

        if (membershipApplication.recurringPrice < 0) {
            errors.push(new ValidationError("negativeRecurringPrice"))
        }
        if (membershipApplication.paymentMethod === "cash" && membershipApplication.recurringPrice > 100) {
            errors.push(new ValidationError("cashPriceBelow100"))
        }
        if (membershipApplication.billingInterval == BillingInterval.Monthly) {
            if (membershipApplication.billingPeriods > 12) {
                errors.push(new ValidationError("billingPeriodsMoreThan12Months"))
            }
            if (membershipApplication.billingPeriods < 6) {
                errors.push(new ValidationError("billingPeriodsLessThan6Months"))
            }
        } else if (membershipApplication.billingInterval == BillingInterval.Yearly) {
            if (membershipApplication.billingPeriods > 3) {
                if (membershipApplication.billingPeriods > 10) {
                    errors.push(new ValidationError("billingPeriodsMoreThan10Years"))
                } else {
                    errors.push(new ValidationError("billingPeriodsLessThan3Years"))
                }
            }
        } else {
            errors.push(new ValidationError("invalidBillingPeriods"))
        }

        return errors
    }
}
