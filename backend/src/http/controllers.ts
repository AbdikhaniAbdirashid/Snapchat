import type { FastifyReply, FastifyRequest } from "fastify";
import type { AddFriendRequest, AuthRequest, FriendParams, SendSnapRequest } from './types'
import * as services from '../services'
import type { TokenPayload } from "../auth";
import { BadRequest, NotFound } from "../errors";

const generateFreshTokens = async (
    username: string,
    reply: FastifyReply,
): Promise<{ access_token: string; refresh_token: string }> => {
    const payload: TokenPayload = {
        username: username,
        type: "refresh", // Will be set below
    };

    const newAccessToken = await reply.jwtSign(
        { ...payload, type: "access" },
        { expiresIn: "60s" },
    );
    const newRefreshToken = await reply.jwtSign(
        { ...payload, type: "refresh" },
        { expiresIn: "10y" },
    );

    return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
    };
};

export async function register(req: FastifyRequest<{ Body: AuthRequest }>, res: FastifyReply) {
    const createdUser = await services.register(req.body)

    const tokens = await generateFreshTokens(createdUser.username, res)

    const response = {
        tokens,
        user: createdUser
    }

    res.status(201).send(response)
}

export async function login(req: FastifyRequest<{ Body: AuthRequest }>, res: FastifyReply) {
    const user = await services.login(req.body)

    const tokens = await generateFreshTokens(user.username, res)

    const response = {
        tokens,
        user
    }

    res.status(200).send(response)
}

export async function addFriend(req: FastifyRequest<{ Body: AddFriendRequest }>, res: FastifyReply) {
    const username = req.user.username

    const response = await services.addFriend(username, req.body.friend_username);

    res.status(200).send(response)
}

export async function deleteFriend(req: FastifyRequest<{ Params: FriendParams }>, res: FastifyReply) {
    await services.deleteFriend(req.user.username, req.params.username)

    // Idempotent, so the same 204 whether or not they were a friend.
    res.status(204).send()
}

export async function getFriends(req: FastifyRequest, res: FastifyReply) {
    const friends = await services.getFriends(req.user.username)

    res.status(200).send({ friends })
}

export async function sendSnap(req: FastifyRequest<{ Body: SendSnapRequest }>, res: FastifyReply) {
    const multipartData = await req.file();

    if (!multipartData) throw new NotFound("No file uploaded");

    const allowedMimeTypes = ["image/jpeg", "image/png"];

    if (!allowedMimeTypes.includes(multipartData.mimetype)) throw new BadRequest("Only JPEG and PNG images are allowed");

    const buffer = await multipartData?.toBuffer();

    const senderUsername = req.user.username;

    await services.sendSnap(senderUsername, 'photo', req.body.recipients, req.body.text, buffer, multipartData.mimetype);
}
