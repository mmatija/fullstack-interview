import express, { Request, Response } from "express"
import memberships from "../../data/memberships.json"
import membershipPeriods from "../../data/membership-periods.json"
import { MembershipApplicationService } from "../services/membership-application-service"
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

    router.post("/", async (req: Request, res: Response) => {
        const membership = await membershipService.createMembership(req.body)
        res.json({
            ...membership,
            validFrom: moment(membership.validFrom).format("YYYY-MM-DD"),
            validUntil: moment(membership.validUntil).format("YYYY-MM-DD"),
        })
    })

    return router
}
