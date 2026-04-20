import http from 'http'
import express from 'express'
import membershipRoutes from './modern/routes/membership.routes'
import { errorHandler } from './error-handler.middleware'
// because of the javascript module, we need to use require to import the legacy routes
const legacyMembershipRoutes = require('./legacy/routes/membership.routes')

export class Server {

    private app: express.Application;
    private httpServer: http.Server | null = null;

    constructor() {

        this.app = express();

        this.app.use(express.json())
        this.app.use('/memberships', membershipRoutes);
        this.app.use('/legacy/memberships', legacyMembershipRoutes);
        this.app.use(errorHandler);
    }

    public start(port: number = 3099): Promise<void> {
        return new Promise((resolve) => {
            this.httpServer = this.app.listen(port, () => {
                console.log(`Server running on http://localhost:${port}`)
                resolve()
            })
        })
    }

    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.httpServer) {
                return resolve()
            }
            this.httpServer.close((err) => {
                this.httpServer = null
                if (err) reject(err)
                else resolve()
            })
        })
    }

}