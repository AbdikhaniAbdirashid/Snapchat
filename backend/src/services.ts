import { AlreadyExists, BadRequest, NotFound, Unauthorized } from './errors'
import type { AddFriendResponse, ApiFriend, ApiUser, AuthRequest } from './http/types'
import * as repository from './repository'
import { hashPassword, verifyPassword } from './utils/password';
import * as s3 from './utils/s3'

// Idempotent
export async function register(authRequest: AuthRequest): Promise<ApiUser> {
    // Om användaren finns
    const exists = await repository.userExists(authRequest.username)

    if (exists) throw new AlreadyExists("User already exists");

    // Hasha lösenord
    const passwordHash = await hashPassword(authRequest.password)

    // Skapa användaren
    const user = await repository.insertUser(authRequest.username, passwordHash)

    // Utfärda tokens

    return {
        username: user.username,
        created_at: user.created_at.toISOString()
    }
    // Hasha lösenordet
}

export async function login(authRequest: AuthRequest): Promise<ApiUser> {
    // Kontrollera användarnamn och lösenord
    const user = await repository.getUserByUsername(authRequest.username)

    if (!user) throw new NotFound("User not found");

    const validPassword = await verifyPassword(authRequest.password, user.password_hash);

    if (!validPassword) throw new Unauthorized("Invalid password!")

    return {
        username: user.username,
        created_at: user.created_at.toISOString()
    }
}

export async function addFriend(
    username: string,
    friendUsername: string
): Promise<AddFriendResponse> {
    // Usernames are unique, so this is an exact self-add check — and it saves
    // the DB throwing check (user_id <> friend_id) as an unhandled 500.
    if (username === friendUsername) {
        throw new BadRequest("You can't add yourself as a friend")
    }

    const { friend_exists, mutual } = await repository.addFriend(username, friendUsername)

    if (!friend_exists) throw new NotFound('User not found')

    return { status: mutual ? 'friends' : 'pending' }
}

// Idempotent — removing someone who isn't a friend is a no-op, not an error.
// Only your own edge goes; if they still have you added, you become a pending
// incoming request to them.
export async function deleteFriend(username: string, friendUsername: string): Promise<void> {
    await repository.deleteFriend(username, friendUsername)
}

export async function getFriends(username: string): Promise<ApiFriend[]> {
    const friends = await repository.getFriends(username)

    return friends.map((friend) => ({
        username: friend.username,
        created_at: friend.created_at.toISOString(),
        mutual: friend.mutual,
    }))
}

type TextContent = {
    text: string
}/*  */

type ImageContent = {
    src: string
}

type Snap = {
    type: 'photo' | 'text',
    content: ImageContent | TextContent
    sender_id: string
    created_at: string
}


const SNAP_TTL_MS = 24 * 60 * 60 * 1000 // 24 timmar

// Anropas av både HTTP (controller) och Websocket
export async function sendSnap(senderUsername: string, type: 'photo' | 'text', recipients: string[], text?: string, imageBuffer?: Buffer, mimetype?: string) {

    if (recipients.length === 0) throw new BadRequest('A snap needs at least one recipient')

    // Du kan bara snappa dina vänner — annars kan vem som helst snappa vem som helst.
    for (const recipient of new Set(recipients)) {
        const friends = await repository.areFriends(senderUsername, recipient)
        if (!friends) throw new BadRequest(`You are not friends with ${recipient}`)
    }

    // Först spara i databasen
    const expiresAt = new Date(Date.now() + SNAP_TTL_MS)

    const base = {
        senderUsername,
        recipientUsernames: recipients,
        expiresAt,
    }

    let snapId = null

    // Spara initiala snapen i db (utan filen)
    if (type === 'text') {
        if (!text) throw new BadRequest('A text snap needs text')

        const { id } = await repository.createSnap({ ...base, type: 'text', body: text })
        snapId = id
    } else {
        const { id } = await repository.createSnap({ ...base, type: 'photo', body: text ?? null })
        snapId = id
    }

    // Ladda upp på filen på S3 och uppdatera snapen i db.
    if (type === 'photo') {
        if (!imageBuffer || !mimetype) throw new BadRequest('A photo snap needs an image')

        const key = crypto.randomUUID()

        await s3.uploadFile(key, imageBuffer, mimetype)

        await repository.setSnapMedia(snapId, key, mimetype)
    }

    // Skicka notiser till alla mottagare
}

export async function getSnap(username: string, snapId: string) {

}

