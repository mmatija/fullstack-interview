import express, { Request, Response, NextFunction } from "express"
import memberships from "../../data/memberships.json"
import membershipPeriods from "../../data/membership-periods.json"
import { MembershipApplicationService } from "../services/membership-application-service"
import { ValidationError } from "../services/validation-error"
import moment from "moment"

export function createMembershipRouter(membershipService: MembershipApplicationService) {
    const router = express.Router();

    router.get("/", (req: Request, res: Response) => {
        const response = memberships.map(membership => {
            const periods = membershipPeriods.filter(period => period.membership === membership.id)
            return { membership, periods }
        })
        res.json(response)
    })

    router.post("/", async (req: Request, res: Response, next: NextFunction) => {
        if (!req.body.name || !req.body.recurringPrice) {
            res.status(400).json({ message: "missingMandatoryFields" })
            return
        }
        try {
            const membership = await membershipService.createMembership(req.body)
            res.json({
                ...membership,
                validFrom: moment(membership.validFrom).format("YYYY-MM-DD"),
                validUntil: moment(membership.validUntil).format("YYYY-MM-DD"),
                periods: membership.periods.map(period => ({
                    ...period,
                    start: moment(period.start).format("YYYY-MM-DD"),
                    end: moment(period.end).format("YYYY-MM-DD"),
                })),
            })
        } catch (err) {
            if (err instanceof ValidationError) {
                res.status(400).json({ message: err.message })
            } else {
                next(err)
            }
        }
    })

    return router
}
