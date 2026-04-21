import express, { Request, Response, NextFunction } from "express"
import { MembershipApplicationService } from "../services/membership-application-service"
import { ValidationError } from "../services/validation-error"
import { MembershipSerializer } from "./membership-serializer"

export function createMembershipRouter(membershipService: MembershipApplicationService) {
    const router = express.Router();
    const serializer = new MembershipSerializer()

    router.get("/", async (req: Request, res: Response) => {
        const memberships = await membershipService.getMemberships()
        res.json(memberships.map(m => serializer.serialize(m)))
    })

    router.post("/", async (req: Request, res: Response, next: NextFunction) => {
        if (!req.body.name || !req.body.recurringPrice) {
            return res.status(400).json({ message: "missingMandatoryFields" })
        }
        try {
            const membership = await membershipService.createMembership(req.body)
            res.status(201).json(serializer.serialize(membership))
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
