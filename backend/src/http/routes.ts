import type { FastifyInstance } from "fastify";
import * as controllers from './controllers'

async function routes(httpServer: FastifyInstance) {

    httpServer.route({
        method: 'POST',
        url: '/register',
        handler: controllers.register
    })

    httpServer.route({
        method: 'POST',
        url: '/login',
        handler: controllers.login
    })

    httpServer.route({
        method: 'GET',
        url: '/friends',
        preHandler: [httpServer.authenticate],
        handler: controllers.getFriends
    })

    httpServer.route({
        method: 'POST',
        url: '/friends',
        preHandler: [httpServer.authenticate],
        handler: controllers.addFriend
    })

    httpServer.route({
        method: 'DELETE',
        url: '/friends/:username',
        preHandler: [httpServer.authenticate],
        handler: controllers.deleteFriend
    })

    httpServer.route({
        method: 'POST',
        url: '/snaps',
        preHandler: [httpServer.authenticate],
        handler: controllers.sendSnap
    })

}

export default routes
