import { ApiError, notifyUnauthorized } from './api.types'
import type { AddFriendResponse, ApiFriend, AuthResponse, SendSnapInput } from './api.types'

// Every username exists except this one, so C can type any name and get 'pending'.
const MISSING_USER = 'nobody'
// Has already added us, so adding them back makes the friendship mutual.
const FRIENDLY_USER = 'anna'

let accessToken: string | null = null
let currentUser: string | null = null

let friends: ApiFriend[] = [
    { username: 'moises', created_at: '2026-08-20T10:00:00.000Z', mutual: true },
    { username: 'kalle', created_at: '2026-08-28T16:30:00.000Z', mutual: false },
]

function delay(): Promise<void> {
    const ms = 300 + Math.random() * 500

    return new Promise((resolve) => setTimeout(resolve, ms))
}

function requireAuth(): void {
    if (accessToken === null) {
        notifyUnauthorized()
        throw new ApiError(401, 'You are not authorized')
    }
}

function authResponse(username: string): AuthResponse {
    return {
        tokens: {
            access_token: `mock-access-token-${username}`,
            refresh_token: `mock-refresh-token-${username}`,
        },
        user: { username, created_at: new Date().toISOString() },
    }
}

export function setAccessToken(token: string | null): void {
    accessToken = token
}

export async function register(username: string, password: string): Promise<AuthResponse> {
    await delay()

    if (username === 'taken') throw new ApiError(409, 'User already exists')
    if (username === 'boom') throw new ApiError(500, 'Unknown error')

    currentUser = username

    return authResponse(username)
}

export async function login(username: string, password: string): Promise<AuthResponse> {
    await delay()

    if (username === MISSING_USER) throw new ApiError(404, 'User not found')
    if (password === 'wrong') throw new ApiError(401, 'Invalid password!')

    currentUser = username

    return authResponse(username)
}

export async function getFriends(): Promise<ApiFriend[]> {
    await delay()
    requireAuth()

    // A copy, so screens can't mutate our state and so React sees a new
    // reference after addFriend and actually re-renders.
    return [...friends]
}

export async function addFriend(friendUsername: string): Promise<AddFriendResponse> {
    await delay()
    requireAuth()

    if (friendUsername === currentUser) throw new ApiError(400, "You can't add yourself as a friend")
    if (friendUsername === MISSING_USER) throw new ApiError(404, 'User not found')

    const existing = friends.find((friend) => friend.username === friendUsername)

    if (existing) return { status: existing.mutual ? 'friends' : 'pending' }

    const mutual = friendUsername === FRIENDLY_USER

    friends.push({ username: friendUsername, created_at: new Date().toISOString(), mutual })

    return { status: mutual ? 'friends' : 'pending' }
}

// Idempotent — removing someone who isn't a friend is a no-op, not an error.
export async function deleteFriend(username: string): Promise<void> {
    await delay()
    requireAuth()

    friends = friends.filter((friend) => friend.username !== username)
}

export async function sendSnap(input: SendSnapInput): Promise<void> {
    await delay()
    requireAuth()

    if (input.recipients.length === 0) throw new ApiError(400, 'A snap needs at least one recipient')

    for (const recipient of input.recipients) {
        const friend = friends.find((entry) => entry.username === recipient)

        if (!friend?.mutual) throw new ApiError(400, `You are not friends with ${recipient}`)
    }
}
