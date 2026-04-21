import moment from "moment";
import { Membership } from "../models/membership";

export class MembershipSerializer {
    serialize(membership: Membership) {
        const { periods, ...rest } = membership
        const dateFormat = "YYYY-MM-DD"
        return {
            membership: {
                ...rest,
                validFrom: moment(rest.validFrom).utc().format(dateFormat),
                validUntil: moment(rest.validUntil).utc().format(dateFormat),
            },
            periods: periods.map(period => ({
                ...period,
                start: moment(period.start).utc().format(dateFormat),
                end: moment(period.end).utc().format(dateFormat),
            }))
        }
    }
}
