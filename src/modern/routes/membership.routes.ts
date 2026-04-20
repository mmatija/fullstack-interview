import express, { Request, Response } from "express"
import memberships from "../../data/memberships.json"
import membershipPeriods from "../../data/membership-periods.json"

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
    const response = memberships.map(membership => {
        const periods = membershipPeriods.filter(period => period.membership === membership.id)
        return { membership, periods }
    })
    res.json(response)
})

router.post("/", (req: Request, res: Response) => {
  throw new Error('not implemented')
})

export default router;
