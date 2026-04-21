import moment from "moment";
import { Membership } from "../models/membership";

export class MembershipSerializer {
    serialize(membership: Membership) {
        const { periods, ...rest } = membership
        return {
            membership: {
                ...rest,
                validFrom: moment(rest.validFrom).utc().format("YYYY-MM-DD"),
                validUntil: moment(rest.validUntil).utc().format("YYYY-MM-DD"),
            },
            periods: periods.map(period => ({
                ...period,
                start: moment(period.start).utc().format("YYYY-MM-DD"),
                end: moment(period.end).utc().format("YYYY-MM-DD"),
            }))
        }
    }
}
